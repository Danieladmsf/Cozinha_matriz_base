const UNIT_KG = new Set(['KG', 'KGS', 'QUILO', 'QUILOS']);
const UNIT_G = new Set(['G', 'GR', 'GRAMA', 'GRAMAS']);
const UNIT_L = new Set(['L', 'LT', 'LTS', 'LITRO', 'LITROS']);
const UNIT_ML = new Set(['ML', 'MLS']);
const UNIT_PIECE = new Set(['UN', 'UND', 'UNID', 'UNIDADE', 'PC', 'PCT', 'PACOTE', 'CX', 'CAIXA', 'BB', 'BD', 'BDJ', 'BANDEJA', 'FD', 'FARDO', 'SC', 'SACO', 'GL', 'GALAO', 'POTE', 'PT']);

function classifyUnit(u) {
    const x = String(u || '').toUpperCase().trim();
    if (UNIT_KG.has(x)) return 'kg';
    if (UNIT_G.has(x)) return 'g';
    if (UNIT_L.has(x)) return 'L';
    if (UNIT_ML.has(x)) return 'ml';
    if (UNIT_PIECE.has(x)) return 'un';
    return null;
}

function num(s) {
    return Number(String(s).replace(',', '.'));
}

function extractPackagingFromDescription(descricao) {
    const desc = String(descricao || '').toUpperCase();
    const candidates = [];

    const reAxB = /(\d+)\s*[X*]\s*(\d+(?:[.,]\d+)?)\s*(KG|G|GR|ML|L|LT|LTS)\b/g;
    let m;
    while ((m = reAxB.exec(desc)) !== null) {
        const fator = parseInt(m[1], 10);
        const valor = num(m[2]);
        const unidade = m[3];
        candidates.push({ tipo: 'AxB', fator, valor, unidade, raw: m[0] });
    }

    const reSimples = /(?<![X*\d])(\d+(?:[.,]\d+)?)\s*(KG|ML|LT|LTS|L)\b/g;
    while ((m = reSimples.exec(desc)) !== null) {
        const valor = num(m[1]);
        const unidade = m[2];
        const before = desc.slice(Math.max(0, m.index - 3), m.index);
        if (/[X*]/.test(before)) continue;
        candidates.push({ tipo: 'simples', valor, unidade, raw: m[0] });
    }

    return candidates;
}

function toBaseQuantity(valor, unidade) {
    const u = unidade.toUpperCase();
    if (u === 'KG') return { quantidade: valor, base: 'kg' };
    if (u === 'G' || u === 'GR') return { quantidade: valor / 1000, base: 'kg' };
    if (u === 'L' || u === 'LT' || u === 'LTS') return { quantidade: valor, base: 'L' };
    if (u === 'ML') return { quantidade: valor / 1000, base: 'L' };
    return null;
}

export function calculateCanonicalPrice(item) {
    const uCom = classifyUnit(item.unidadeComercial);
    const valorUnit = item.valorUnitario;

    if (uCom === 'kg') {
        return {
            precoCanonico: valorUnit,
            unidadeCanonica: 'kg',
            quantidadePorUnidadeComercial: 1,
            confiabilidade: 'alta',
            observacao: 'Unidade comercial em KG — preço unitário já é por kg.',
        };
    }
    if (uCom === 'g') {
        return {
            precoCanonico: valorUnit * 1000,
            unidadeCanonica: 'kg',
            quantidadePorUnidadeComercial: 0.001,
            confiabilidade: 'alta',
            observacao: 'Unidade comercial em gramas — convertido para kg.',
        };
    }
    if (uCom === 'L') {
        return {
            precoCanonico: valorUnit,
            unidadeCanonica: 'L',
            quantidadePorUnidadeComercial: 1,
            confiabilidade: 'alta',
            observacao: 'Unidade comercial em LITRO — preço unitário já é por L.',
        };
    }
    if (uCom === 'ml') {
        return {
            precoCanonico: valorUnit * 1000,
            unidadeCanonica: 'L',
            quantidadePorUnidadeComercial: 0.001,
            confiabilidade: 'alta',
            observacao: 'Unidade comercial em ML — convertido para L.',
        };
    }

    const candidatos = extractPackagingFromDescription(item.descricao);

    if (candidatos.length === 0) {
        return {
            precoCanonico: valorUnit,
            unidadeCanonica: 'un',
            quantidadePorUnidadeComercial: 1,
            confiabilidade: 'media',
            observacao: 'Sem peso/volume na descrição — tratado como unidade.',
        };
    }

    const escolha = candidatos.find((c) => c.tipo === 'AxB') || candidatos[0];

    if (escolha.tipo === 'AxB') {
        const conv = toBaseQuantity(escolha.valor, escolha.unidade);
        if (!conv) {
            return {
                precoCanonico: valorUnit,
                unidadeCanonica: 'un',
                quantidadePorUnidadeComercial: 1,
                confiabilidade: 'baixa',
                observacao: `Padrão "${escolha.raw}" não convertível.`,
            };
        }
        const qtdPorUnidadeComercial = conv.quantidade;
        return {
            precoCanonico: Number((valorUnit / qtdPorUnidadeComercial).toFixed(6)),
            unidadeCanonica: conv.base,
            quantidadePorUnidadeComercial: qtdPorUnidadeComercial,
            confiabilidade: 'media',
            observacao:
                `Padrão "${escolha.raw}" interpretado como cada unidade comercial = ${escolha.valor}${escolha.unidade} ` +
                `(o "${escolha.fator}" geralmente é a embalagem master). Confirme antes de salvar.`,
        };
    }

    const conv = toBaseQuantity(escolha.valor, escolha.unidade);
    if (!conv) {
        return {
            precoCanonico: valorUnit,
            unidadeCanonica: 'un',
            quantidadePorUnidadeComercial: 1,
            confiabilidade: 'baixa',
            observacao: `Padrão "${escolha.raw}" não convertível.`,
        };
    }
    return {
        precoCanonico: Number((valorUnit / conv.quantidade).toFixed(6)),
        unidadeCanonica: conv.base,
        quantidadePorUnidadeComercial: conv.quantidade,
        confiabilidade: 'media',
        observacao: `Peso/volume "${escolha.raw}" extraído da descrição.`,
    };
}

export function enrichItemsWithCanonicalPrice(itens) {
    return itens.map((it) => {
        const calc = calculateCanonicalPrice(it);
        return { ...it, calculoPreco: calc };
    });
}

export default calculateCanonicalPrice;
