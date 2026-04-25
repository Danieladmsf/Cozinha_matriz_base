const STOPWORDS = new Set([
    'de', 'do', 'da', 'dos', 'das', 'a', 'o', 'e', 'em', 'com', 'para', 'sem',
    'kg', 'g', 'gr', 'ml', 'l', 'lt', 'lts', 'un', 'und', 'unid', 'cx', 'cxa',
    'pc', 'pct', 'pacote', 'caixa', 'fardo', 'fd', 'sc', 'saco', 'bb', 'bbn',
    'bd', 'bdj', 'bandeja', 'pet', 'plast', 'plastico',
    'embalagem', 'embal', 'pacotes', 'caixas', 'unidade', 'unidades',
    'novo', 'nova', 'natural', 'tipo', 'tradicional',
]);

function normalize(s) {
    return String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(s) {
    const norm = normalize(s);
    if (!norm) return [];
    return norm.split(' ').filter((t) => t.length >= 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

function jaccard(aSet, bSet) {
    if (aSet.size === 0 || bSet.size === 0) return 0;
    let inter = 0;
    for (const t of aSet) if (bSet.has(t)) inter++;
    const union = aSet.size + bSet.size - inter;
    return union === 0 ? 0 : inter / union;
}

function tokenContainScore(needleTokens, haystackTokens) {
    if (needleTokens.length === 0) return 0;
    const haySet = new Set(haystackTokens);
    let hits = 0;
    for (const t of needleTokens) if (haySet.has(t)) hits++;
    return hits / needleTokens.length;
}

function buildInsumoSearchString(insumo) {
    return [
        insumo.name,
        insumo.commercial_name,
        insumo.brand,
        ...(Array.isArray(insumo.aliases) ? insumo.aliases : []),
    ]
        .filter(Boolean)
        .join(' ');
}

export function matchItemAgainstInsumos(itemDescricao, insumos, opts = {}) {
    const topN = opts.topN ?? 3;
    const autoThreshold = opts.autoThreshold ?? 0.7;
    const autoGap = opts.autoGap ?? 0.15;

    const needleNorm = normalize(itemDescricao);
    if (!needleNorm) {
        return { topMatches: [], autoMatch: null };
    }
    const needleTokens = tokenize(itemDescricao);
    const needleSet = new Set(needleTokens);

    const scored = [];

    for (const insumo of insumos) {
        const aliases = Array.isArray(insumo.aliases) ? insumo.aliases : [];
        let aliasHit = false;
        for (const alias of aliases) {
            if (normalize(alias) === needleNorm) {
                aliasHit = true;
                break;
            }
        }

        const haystack = buildInsumoSearchString(insumo);
        const hayTokens = tokenize(haystack);
        const haySet = new Set(hayTokens);

        const jacc = jaccard(needleSet, haySet);
        const contain = tokenContainScore(needleTokens, hayTokens);
        const reverse = tokenContainScore(hayTokens, needleTokens);
        const heuristic = 0.4 * jacc + 0.4 * contain + 0.2 * reverse;

        const score = aliasHit ? 1 : Number(heuristic.toFixed(4));
        if (score <= 0) continue;

        scored.push({
            insumo,
            score,
            via: aliasHit ? 'alias' : 'fuzzy',
            sinais: { jaccard: jacc, contain, reverse },
        });
    }

    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.slice(0, topN);

    let autoMatch = null;
    if (topMatches.length > 0) {
        const top = topMatches[0];
        if (top.via === 'alias') {
            autoMatch = top;
        } else if (top.score >= autoThreshold) {
            const second = topMatches[1]?.score ?? 0;
            if (top.score - second >= autoGap) autoMatch = top;
        }
    }

    return { topMatches, autoMatch };
}

export function matchAllItems(itens, insumos, opts) {
    return itens.map((item) => {
        const result = matchItemAgainstInsumos(item.descricao, insumos, opts);
        return {
            ...item,
            matches: result.topMatches.map((m) => ({
                insumoId: m.insumo.id,
                insumoNome: m.insumo.commercial_name || m.insumo.name,
                insumoMarca: m.insumo.brand || '',
                score: m.score,
                via: m.via,
            })),
            matchAutomatico: result.autoMatch
                ? {
                      insumoId: result.autoMatch.insumo.id,
                      score: result.autoMatch.score,
                      via: result.autoMatch.via,
                  }
                : null,
        };
    });
}

export const __test = { normalize, tokenize, jaccard, tokenContainScore };
export default matchAllItems;
