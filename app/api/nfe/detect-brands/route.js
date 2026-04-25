import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getTenantIdFromRequest } from '@/lib/auth/tenantStore';
import { extractBrandsWithAI, dedupeNovasMarcas } from '@/lib/nfe/brandExtractor';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

async function resolveAnthropicApiKey(tenantId) {
    const rootRef = adminDb.doc(`tenants/${tenantId}/settings/ai_config`);
    const rootSnap = await rootRef.get();
    if (!rootSnap.exists) return null;

    const rootData = rootSnap.data() || {};
    const activeProfileId = rootData.activeProfileId;

    let cfg = rootData;
    if (activeProfileId) {
        const profileSnap = await rootRef.collection('profiles').doc(activeProfileId).get();
        if (profileSnap.exists) cfg = profileSnap.data() || {};
    }

    if (cfg.aiProvider === 'anthropic' && cfg.apiKey) return cfg.apiKey;

    const profilesSnap = await rootRef.collection('profiles').get();
    for (const d of profilesSnap.docs) {
        const data = d.data() || {};
        if (data.aiProvider === 'anthropic' && data.apiKey) return data.apiKey;
    }

    return process.env.ANTHROPIC_API_KEY || null;
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

    const itens = Array.isArray(body?.itens) ? body.itens : [];
    if (itens.length === 0) {
        return NextResponse.json({ error: 'Itens vazios' }, { status: 400 });
    }

    const apiKey = await resolveAnthropicApiKey(tenantId);
    if (!apiKey) {
        return NextResponse.json(
            { error: 'Chave Anthropic não configurada', details: 'Cadastre uma chave Anthropic em Configurações da I.A.' },
            { status: 400 }
        );
    }

    const brandSnap = await adminDb.collection(`tenants/${tenantId}/Brand`).get();
    const marcasExistentes = brandSnap.docs.map((d) => ({ id: d.id, name: d.data()?.name || '' }));

    let extraidas;
    try {
        extraidas = await extractBrandsWithAI(itens, { apiKey });
    } catch (err) {
        logger.error('[nfe/detect-brands] erro IA', err);
        return NextResponse.json(
            { error: 'Falha ao extrair marcas', details: err.message },
            { status: 500 }
        );
    }

    const novasMarcas = dedupeNovasMarcas(extraidas, marcasExistentes);

    return NextResponse.json({
        extraidas,
        marcasExistentes: marcasExistentes.length,
        novasMarcas,
    });
}
