import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getTenantIdFromRequest } from '@/lib/auth/tenantStore';

export const runtime = 'nodejs';

function normalize(s) {
    return String(s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

    const nomes = Array.isArray(body?.nomes) ? body.nomes : [];
    if (nomes.length === 0) {
        return NextResponse.json({ error: 'Lista de nomes vazia' }, { status: 400 });
    }

    const brandCol = adminDb.collection(`tenants/${tenantId}/Brand`);
    const existentes = await brandCol.get();
    const indexExistente = new Map();
    existentes.docs.forEach((d) => {
        indexExistente.set(normalize(d.data()?.name), { id: d.id, ...d.data() });
    });

    const criadas = [];
    const ignoradas = [];
    const batch = adminDb.batch();

    for (const nomeBruto of nomes) {
        const nome = String(nomeBruto || '').trim();
        if (!nome) continue;
        const key = normalize(nome);
        if (indexExistente.has(key)) {
            ignoradas.push({ nome, id: indexExistente.get(key).id, motivo: 'já existia' });
            continue;
        }
        const ref = brandCol.doc();
        const data = {
            name: nome,
            manufacturer: '',
            active: true,
            criadoVia: 'nfe',
            createdAt: new Date().toISOString(),
        };
        batch.set(ref, data);
        criadas.push({ id: ref.id, ...data });
        indexExistente.set(key, { id: ref.id, ...data });
    }

    if (criadas.length > 0) await batch.commit();

    return NextResponse.json({ criadas, ignoradas }, { status: 201 });
}
