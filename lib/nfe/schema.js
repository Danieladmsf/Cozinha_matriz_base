export const NFE_COLLECTIONS = {
    ingredient: 'Ingredient',
    comprasHistorico: 'compras_historico',
    nfeImports: 'nfe_imports',
    ingredientVersions: (insumoId) => `Ingredient/${insumoId}/versions`,
};

export function tenantPath(tenantId, collectionName) {
    if (!tenantId) throw new Error('tenantId obrigatório');
    return `tenants/${tenantId}/${collectionName}`;
}

export function buildCompraHistoricoDoc({
    insumoId,
    nfeImportId,
    fornecedorCnpj,
    fornecedorNome,
    dataEmissao,
    descricaoOriginal,
    item,
}) {
    if (!insumoId) throw new Error('insumoId obrigatório');
    const calc = item.calculoPreco || {};
    return {
        insumoId,
        nfeImportId: nfeImportId || null,
        fornecedorCnpj: fornecedorCnpj || '',
        fornecedorNome: fornecedorNome || '',
        dataEmissao: dataEmissao || '',
        descricaoOriginal: descricaoOriginal || item.descricao || '',
        codigoProdutoFornecedor: item.codigoProduto || '',
        ean: item.ean || '',
        ncm: item.ncm || '',
        unidadeComercial: item.unidadeComercial || '',
        quantidadeComercial: Number(item.quantidade) || 0,
        valorUnitario: Number(item.valorUnitario) || 0,
        valorTotal: Number(item.valorTotal) || 0,
        valorDesconto: Number(item.valorDesconto) || 0,
        valorFrete: Number(item.valorFrete) || 0,
        valorLiquido: Number(item.valorLiquido) || 0,
        precoCanonico: Number(calc.precoCanonico) || 0,
        unidadeCanonica: calc.unidadeCanonica || 'un',
        quantidadePorUnidadeComercial: Number(calc.quantidadePorUnidadeComercial) || 1,
        confiabilidadeCalculo: calc.confiabilidade || 'media',
        observacaoCalculo: calc.observacao || '',
        precoCanonicoAjustadoPeloUsuario: typeof item.precoCanonicoAjustado === 'number'
            ? item.precoCanonicoAjustado
            : null,
        createdAt: new Date().toISOString(),
    };
}

export function buildNfeImportDoc({
    cabecalho,
    quantidadeItens,
    importadoPorUid,
    importadoPorEmail,
    resumo,
}) {
    return {
        chaveAcesso: cabecalho.chaveAcesso || '',
        numero: cabecalho.numero || '',
        serie: cabecalho.serie || '',
        dataEmissao: cabecalho.dataEmissao || '',
        naturezaOperacao: cabecalho.naturezaOperacao || '',
        emitente: cabecalho.emitente || {},
        destinatario: cabecalho.destinatario || {},
        totais: cabecalho.totais || {},
        quantidadeItens,
        importadoPor: importadoPorUid || null,
        importadoPorEmail: importadoPorEmail || null,
        importadoEm: new Date().toISOString(),
        status: 'concluida',
        resumo: resumo || { criados: 0, atualizados: 0, ignorados: 0 },
    };
}

export function diffInsumoFields(antes, depois, camposMonitorados = ['current_price', 'unit', 'brand', 'brand_id', 'category', 'main_supplier', 'supplier_id']) {
    const camposAlterados = [];
    for (const campo of camposMonitorados) {
        const a = antes?.[campo];
        const b = depois?.[campo];
        if (a !== b) camposAlterados.push(campo);
    }
    return camposAlterados;
}

export function buildInsumoVersionDoc({
    antes,
    depois,
    origem,
    origemRefId,
    changedByUid,
    changedByEmail,
    motivo,
}) {
    const camposAlterados = diffInsumoFields(antes, depois);
    return {
        changedAt: new Date().toISOString(),
        changedBy: changedByUid || null,
        changedByEmail: changedByEmail || null,
        origem: origem || 'manual',
        origemRefId: origemRefId || null,
        motivo: motivo || '',
        camposAlterados,
        dadosAnteriores: pickFields(antes, camposAlterados),
        dadosNovos: pickFields(depois, camposAlterados),
    };
}

function pickFields(obj, keys) {
    const out = {};
    for (const k of keys) out[k] = obj?.[k] ?? null;
    return out;
}

export function buildAliasUpdate(insumoExistente, novaDescricao) {
    const atuais = Array.isArray(insumoExistente?.aliases) ? insumoExistente.aliases : [];
    const norm = String(novaDescricao || '').trim();
    if (!norm) return atuais;
    if (atuais.some((a) => String(a).trim().toUpperCase() === norm.toUpperCase())) return atuais;
    return [...atuais, norm];
}
