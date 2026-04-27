import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Tenant da conta de apresentação que serve como "matriz de fábrica".
// Toda nova conta recebe uma cópia exata destas coleções (insumos com
// preço, TACO vinculada, fornecedores reais, etc).
const FACTORY_TENANT_ID = 'tenant_BmF1PNNemZaRdwNpsrWZrLoL8C62';

const FACTORY_COLLECTIONS = [
  'Supplier',
  'Ingredient',
  'PriceHistory',
  'NutritionFood',
  'NutritionCategory',
];

const BATCH_LIMIT = 400;

async function cloneCollection(srcTenantId, dstTenantId, collectionName) {
  const srcRef = adminDb
    .collection('tenants').doc(srcTenantId)
    .collection(collectionName);
  const dstRef = adminDb
    .collection('tenants').doc(dstTenantId)
    .collection(collectionName);

  const snap = await srcRef.get();
  if (snap.empty) return 0;

  let batch = adminDb.batch();
  let pending = 0;
  let total = 0;

  for (const docSnap of snap.docs) {
    // Preservamos o ID original para manter as referências cruzadas
    // intactas (PriceHistory.ingredient_id → Ingredient.id,
    // Ingredient.taco_id → NutritionFood.id, etc).
    batch.set(dstRef.doc(docSnap.id), docSnap.data());
    pending++;
    total++;

    if (pending >= BATCH_LIMIT) {
      await batch.commit();
      batch = adminDb.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();
  return total;
}

export async function POST(request) {
  try {
    const { tenantId } = await request.json();
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });
    }
    if (tenantId === FACTORY_TENANT_ID) {
      return NextResponse.json(
        { error: 'tenant fábrica não pode ser semeado a partir de si mesmo' },
        { status: 400 }
      );
    }

    const counts = {};
    for (const col of FACTORY_COLLECTIONS) {
      counts[col] = await cloneCollection(FACTORY_TENANT_ID, tenantId, col);
    }

    // Configuração de I.A. zerada (não copiamos a chave da fábrica)
    const now = admin.firestore.Timestamp.now();
    await adminDb
      .doc(`tenants/${tenantId}/settings/ai_config`)
      .set({
        aiProvider: 'anthropic',
        apiKey: '',
        baseUrl: '',
        activeProfileId: null,
        createdAt: now,
        updatedAt: now,
      });

    console.log(`[seed-tenant] ✅ ${tenantId} clonado de ${FACTORY_TENANT_ID}:`, counts);
    return NextResponse.json({ success: true, counts, source: FACTORY_TENANT_ID });
  } catch (error) {
    console.error('[seed-tenant] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
