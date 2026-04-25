import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getTenantIdFromRequest } from '@/lib/auth/tenantStore';
import { parseNfeXml } from '@/lib/nfe/parser';
import { enrichItemsWithCanonicalPrice } from '@/lib/nfe/priceCalculator';
import { matchAllItems } from '@/lib/nfe/matcher';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

async function loadInsumosForTenant(tenantId) {
    const snap = await adminDb.collection(`tenants/${tenantId}/Ingredient`).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function findExistingNfeImport(tenantId, chaveAcesso) {
    if (!chaveAcesso) return null;
    const snap = await adminDb
        .collection(`tenants/${tenantId}/nfe_imports`)
        .where('chaveAcesso', '==', chaveAcesso)
        .limit(1)
        .get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
}

function normalizeCnpj(cnpj) {
    return String(cnpj || '').replace(/\D/g, '');
}

async function findSupplierByCnpj(tenantId, cnpj) {
    const cnpjDigits = normalizeCnpj(cnpj);
    if (!cnpjDigits) return null;
    const snap = await adminDb.collection(`tenants/${tenantId}/Supplier`).get();
    for (const d of snap.docs) {
        if (normalizeCnpj(d.data()?.cnpj) === cnpjDigits) {
            return { id: d.id, ...d.data() };
        }
    }
    return null;
}

export async function POST(request) {
    try {
        const tenantId = getTenantIdFromRequest(request);
        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId ausente' }, { status: 401 });
        }

        const body = await request.json();
        const xml = body?.xml;
        if (typeof xml !== 'string' || xml.trim().length === 0) {
            return NextResponse.json({ error: 'Campo "xml" obrigatório.' }, { status: 400 });
        }

        let parsed;
        try {
            parsed = parseNfeXml(xml);
        } catch (err) {
            return NextResponse.json(
                { error: 'XML inválido', details: err.message },
                { status: 422 }
            );
        }

        const enriched = enrichItemsWithCanonicalPrice(parsed.itens);
        const insumos = await loadInsumosForTenant(tenantId);
        const itensComMatch = matchAllItems(enriched, insumos);

        const [jaImportada, fornecedorExistente] = await Promise.all([
            findExistingNfeImport(tenantId, parsed.cabecalho.chaveAcesso),
            findSupplierByCnpj(tenantId, parsed.cabecalho.emitente?.cnpj),
        ]);

        return NextResponse.json({
            cabecalho: parsed.cabecalho,
            itens: itensComMatch,
            jaImportada: jaImportada
                ? {
                      id: jaImportada.id,
                      importadoEm: jaImportada.importadoEm || null,
                      importadoPor: jaImportada.importadoPor || null,
                  }
                : null,
            fornecedorExistente: fornecedorExistente
                ? {
                      id: fornecedorExistente.id,
                      company_name: fornecedorExistente.company_name || fornecedorExistente.name || '',
                      supplier_code: fornecedorExistente.supplier_code || '',
                      cnpj: fornecedorExistente.cnpj || '',
                  }
                : null,
            totalInsumosCadastrados: insumos.length,
        });
    } catch (error) {
        logger.error('[nfe/parse] erro', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
