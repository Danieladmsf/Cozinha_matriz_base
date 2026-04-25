import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getTenantIdFromRequest } from '@/lib/auth/tenantStore';
import {
    buildCompraHistoricoDoc,
    buildNfeImportDoc,
    buildInsumoVersionDoc,
    buildAliasUpdate,
} from '@/lib/nfe/schema';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const ACOES = { VINCULAR: 'vincular', CRIAR: 'criar', IGNORAR: 'ignorar' };

function tenantCol(tenantId, name) {
    return adminDb.collection(`tenants/${tenantId}/${name}`);
}

export async function POST(request) {
    const tenantId = getTenantIdFromRequest(request);
    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId ausente' }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }
    const { cabecalho, itens, decisoes, fornecedorId } = body || {};
    if (!cabecalho || !Array.isArray(itens) || !decisoes) {
        return NextResponse.json({ error: 'Payload incompleto' }, { status: 400 });
    }

    if (cabecalho.chaveAcesso) {
        const dup = await tenantCol(tenantId, 'nfe_imports')
            .where('chaveAcesso', '==', cabecalho.chaveAcesso)
            .limit(1)
            .get();
        if (!dup.empty) {
            return NextResponse.json(
                { error: 'NFe já importada anteriormente', nfeImportId: dup.docs[0].id },
                { status: 409 }
            );
        }
    }

    const ingredientCol = tenantCol(tenantId, 'Ingredient');
    const comprasCol = tenantCol(tenantId, 'compras_historico');
    const nfeImportsCol = tenantCol(tenantId, 'nfe_imports');

    const nfeImportRef = nfeImportsCol.doc();

    const detalhes = [];
    let criados = 0;
    let atualizados = 0;
    let ignorados = 0;

    const insumosCache = new Map();
    const writes = [];

    for (const item of itens) {
        const decisao = decisoes[item.indice];
        if (!decisao || decisao.acao === ACOES.IGNORAR) {
            ignorados++;
            detalhes.push({ indice: item.indice, descricao: item.descricao, acao: 'ignorado' });
            continue;
        }

        const calcAjustado = applyUserAdjustment(item);

        if (decisao.acao === ACOES.CRIAR) {
            const novoRef = ingredientCol.doc();
            const novoInsumoData = buildNovoInsumoPayload(decisao.novo, calcAjustado, cabecalho);
            writes.push({ ref: novoRef, op: 'set', data: novoInsumoData });

            writes.push({
                ref: comprasCol.doc(),
                op: 'set',
                data: buildCompraHistoricoDoc({
                    insumoId: novoRef.id,
                    nfeImportId: nfeImportRef.id,
                    fornecedorCnpj: cabecalho.emitente?.cnpj,
                    fornecedorNome: cabecalho.emitente?.razaoSocial,
                    dataEmissao: cabecalho.dataEmissao,
                    descricaoOriginal: item.descricao,
                    item: calcAjustado,
                }),
            });
            criados++;
            detalhes.push({ indice: item.indice, descricao: item.descricao, acao: 'criado', insumoId: novoRef.id });
            continue;
        }

        if (decisao.acao === ACOES.VINCULAR) {
            const insumoId = decisao.insumoId;
            if (!insumoId) {
                ignorados++;
                detalhes.push({ indice: item.indice, descricao: item.descricao, acao: 'ignorado', erro: 'insumoId ausente' });
                continue;
            }

            let insumoAtual = insumosCache.get(insumoId);
            if (!insumoAtual) {
                const snap = await ingredientCol.doc(insumoId).get();
                if (!snap.exists) {
                    ignorados++;
                    detalhes.push({ indice: item.indice, descricao: item.descricao, acao: 'ignorado', erro: 'insumo não encontrado' });
                    continue;
                }
                insumoAtual = { id: insumoId, ...snap.data() };
                insumosCache.set(insumoId, insumoAtual);
            }

            const novoPreco = calcAjustado.calculoPreco?.precoCanonico;
            const novaUnidade = calcAjustado.calculoPreco?.unidadeCanonica;
            const novosAliases = buildAliasUpdate(insumoAtual, item.descricao);

            const marcaParaAplicar = String(decisao.aplicarMarca || '').trim();
            const dadosNovos = {
                ...insumoAtual,
                current_price: novoPreco,
                unit: novaUnidade || insumoAtual.unit,
                aliases: novosAliases,
                ...(marcaParaAplicar ? { brand: marcaParaAplicar } : {}),
                last_update: new Date().toISOString().split('T')[0],
                last_purchase: {
                    fornecedorCnpj: cabecalho.emitente?.cnpj || '',
                    fornecedorNome: cabecalho.emitente?.razaoSocial || '',
                    dataEmissao: cabecalho.dataEmissao || '',
                    precoUnitario: item.valorUnitario,
                    unidadeComercial: item.unidadeComercial,
                    nfeImportId: nfeImportRef.id,
                },
            };

            const versaoDoc = buildInsumoVersionDoc({
                antes: insumoAtual,
                depois: dadosNovos,
                origem: 'nfe',
                origemRefId: nfeImportRef.id,
            });

            if (versaoDoc.camposAlterados.length > 0) {
                writes.push({
                    ref: ingredientCol.doc(insumoId).collection('versions').doc(),
                    op: 'set',
                    data: versaoDoc,
                });
            }

            writes.push({
                ref: ingredientCol.doc(insumoId),
                op: 'update',
                data: {
                    current_price: dadosNovos.current_price,
                    unit: dadosNovos.unit,
                    aliases: dadosNovos.aliases,
                    last_update: dadosNovos.last_update,
                    last_purchase: dadosNovos.last_purchase,
                    ...(marcaParaAplicar ? { brand: marcaParaAplicar } : {}),
                },
            });

            writes.push({
                ref: comprasCol.doc(),
                op: 'set',
                data: buildCompraHistoricoDoc({
                    insumoId,
                    nfeImportId: nfeImportRef.id,
                    fornecedorCnpj: cabecalho.emitente?.cnpj,
                    fornecedorNome: cabecalho.emitente?.razaoSocial,
                    dataEmissao: cabecalho.dataEmissao,
                    descricaoOriginal: item.descricao,
                    item: calcAjustado,
                }),
            });

            atualizados++;
            detalhes.push({ indice: item.indice, descricao: item.descricao, acao: 'atualizado', insumoId });
        }
    }

    const resumo = { criados, atualizados, ignorados };

    writes.push({
        ref: nfeImportRef,
        op: 'set',
        data: {
            ...buildNfeImportDoc({
                cabecalho,
                quantidadeItens: itens.length,
                resumo,
            }),
            fornecedorId: fornecedorId || null,
        },
    });

    try {
        await commitInBatches(writes, 400);
    } catch (err) {
        logger.error('[nfe/import] erro batch', err);
        return NextResponse.json({ error: 'Falha ao gravar dados', details: err.message }, { status: 500 });
    }

    return NextResponse.json({
        nfeImportId: nfeImportRef.id,
        resumo,
        detalhes,
    });
}

function applyUserAdjustment(item) {
    if (typeof item.precoCanonicoAjustado === 'number' && item.precoCanonicoAjustado > 0) {
        return {
            ...item,
            calculoPreco: {
                ...item.calculoPreco,
                precoCanonico: item.precoCanonicoAjustado,
                confiabilidade: 'alta',
                observacao: (item.calculoPreco?.observacao || '') + ' (ajustado pelo usuário)',
            },
        };
    }
    return item;
}

function buildNovoInsumoPayload(novo, item, cabecalho) {
    return {
        name: novo.name || item.descricao || 'SEM NOME',
        commercial_name: novo.name || item.descricao || '',
        brand: novo.brand || '',
        category: novo.category || '',
        unit: novo.unit || item.calculoPreco?.unidadeCanonica || 'un',
        current_price: item.calculoPreco?.precoCanonico ?? 0,
        last_update: new Date().toISOString().split('T')[0],
        active: true,
        ingredient_type: 'both',
        main_supplier: novo.main_supplier || cabecalho?.emitente?.razaoSocial || '',
        supplier_cnpj: novo.supplier_cnpj || cabecalho?.emitente?.cnpj || '',
        aliases: [item.descricao || ''].filter(Boolean),
        last_purchase: {
            fornecedorCnpj: cabecalho?.emitente?.cnpj || '',
            fornecedorNome: cabecalho?.emitente?.razaoSocial || '',
            dataEmissao: cabecalho?.dataEmissao || '',
            precoUnitario: item.valorUnitario,
            unidadeComercial: item.unidadeComercial,
        },
        createdAt: new Date().toISOString(),
        criadoVia: 'nfe',
    };
}

async function commitInBatches(writes, chunkSize) {
    for (let i = 0; i < writes.length; i += chunkSize) {
        const chunk = writes.slice(i, i + chunkSize);
        const batch = adminDb.batch();
        for (const w of chunk) {
            if (w.op === 'set') batch.set(w.ref, w.data);
            else if (w.op === 'update') batch.update(w.ref, w.data);
        }
        await batch.commit();
    }
}
