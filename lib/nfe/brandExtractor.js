import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `Você é um assistente que extrai MARCAS de produtos a partir de descrições de NFe brasileiras.

REGRAS:
1) Devolva SOMENTE JSON válido no formato:
{ "itens": [ { "indice": <number>, "marca": <string|null> } ] }
2) "marca" é o NOME COMERCIAL/FABRICANTE do produto (ex: "Perdigão", "Sadia", "Italac", "Piracanjuba", "Vila Velha", "Nita").
3) NÃO confunda marca com tipo do produto. Ex: "FILE DE PEITO SEM PELE" não tem marca → marca: null.
4) NÃO confunda marca com unidade/embalagem (KG, LT, UN, CX, BB, PET, BBN).
5) NÃO confunda marca com gramatura/volume (12X1KG, 5X5KG, 18LT, 900ML).
6) Se não houver marca clara, retorne null. Não invente.
7) Padronize capitalização: primeira letra maiúscula, restante minúscula. "PERDIGAO" → "Perdigão", "ITALAC" → "Italac".
8) Acentuação correta em português: "PIRACANJUBA" → "Piracanjuba", "PERDIGAO" → "Perdigão".`;

function buildUserPrompt(itens) {
    const lines = itens.map((it) => `${it.indice}. ${it.descricao}`).join('\n');
    return `Extraia a marca de cada item:\n\n${lines}\n\nResponda APENAS o JSON.`;
}

export async function extractBrandsWithAI(itens, opts = {}) {
    const apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY não configurada.');
    }

    const lista = itens.map((it) => ({ indice: it.indice, descricao: it.descricao }));
    if (lista.length === 0) return [];

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        temperature: 0,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: buildUserPrompt(lista) }],
    });

    const text = response?.content?.[0]?.text || '';
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart < 0 || jsonEnd < 0) {
        throw new Error(`Resposta IA sem JSON: ${text.slice(0, 200)}`);
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    const out = Array.isArray(parsed?.itens) ? parsed.itens : [];

    const map = new Map();
    out.forEach((r) => map.set(r.indice, r.marca || null));

    return lista.map((it) => ({
        indice: it.indice,
        descricao: it.descricao,
        marca: map.get(it.indice) ?? null,
    }));
}

export function dedupeNovasMarcas(extraidas, marcasExistentes) {
    const norm = (s) => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const existentes = new Set(marcasExistentes.map((m) => norm(m.name || m)));
    const set = new Map();
    extraidas.forEach((e) => {
        if (!e.marca) return;
        const k = norm(e.marca);
        if (existentes.has(k)) return;
        if (!set.has(k)) set.set(k, { nome: e.marca, ocorrencias: [] });
        set.get(k).ocorrencias.push({ indice: e.indice, descricao: e.descricao });
    });
    return Array.from(set.values());
}
