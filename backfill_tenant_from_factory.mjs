#!/usr/bin/env node
/**
 * Backfill de um tenant existente a partir da conta-fábrica.
 *
 * Uso:
 *   node backfill_tenant_from_factory.mjs <tenantId>
 *
 * Limpa as coleções de fábrica do tenant alvo e clona-as do tenant
 * de apresentação (BmF1PNNemZaRdwNpsrWZrLoL8C62). Use isto para
 * corrigir contas criadas antes do seed-tenant ter sido consertado.
 *
 * Requer GOOGLE_APPLICATION_CREDENTIALS apontando para o service
 * account (já configurado em .env.local).
 */
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();

const FACTORY_TENANT_ID = 'tenant_BmF1PNNemZaRdwNpsrWZrLoL8C62';
const COLLECTIONS = [
  'Supplier',
  'Ingredient',
  'PriceHistory',
  'NutritionFood',
  'NutritionCategory',
];
const BATCH_LIMIT = 400;

function initAdmin() {
  if (admin.apps.length) return;

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const resolved = path.isAbsolute(credPath)
      ? credPath
      : path.resolve(__dirname, credPath);
    if (existsSync(resolved)) {
      const serviceAccount = JSON.parse(readFileSync(resolved, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      return;
    }
  }
  admin.initializeApp();
}

async function deleteCollection(db, tenantId, name) {
  const ref = db.collection('tenants').doc(tenantId).collection(name);
  const snap = await ref.get();
  if (snap.empty) return 0;

  let batch = db.batch();
  let pending = 0;
  let total = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    pending++;
    total++;
    if (pending >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();
  return total;
}

async function cloneCollection(db, srcTenantId, dstTenantId, name) {
  const src = db.collection('tenants').doc(srcTenantId).collection(name);
  const dst = db.collection('tenants').doc(dstTenantId).collection(name);
  const snap = await src.get();
  if (snap.empty) return 0;

  let batch = db.batch();
  let pending = 0;
  let total = 0;
  for (const doc of snap.docs) {
    batch.set(dst.doc(doc.id), doc.data());
    pending++;
    total++;
    if (pending >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();
  return total;
}

async function main() {
  const targetTenantId = process.argv[2];
  if (!targetTenantId) {
    console.error('uso: node backfill_tenant_from_factory.mjs <tenantId>');
    console.error('exemplo: node backfill_tenant_from_factory.mjs tenant_abc123');
    process.exit(1);
  }
  if (targetTenantId === FACTORY_TENANT_ID) {
    console.error('não posso clonar a fábrica em cima dela mesma');
    process.exit(1);
  }

  initAdmin();
  const db = admin.firestore();

  console.log(`🧹 Limpando coleções existentes em ${targetTenantId}...`);
  const deleted = {};
  for (const col of COLLECTIONS) {
    deleted[col] = await deleteCollection(db, targetTenantId, col);
    console.log(`   - ${col}: ${deleted[col]} doc(s) removido(s)`);
  }

  console.log(`\n🏭 Clonando de ${FACTORY_TENANT_ID} → ${targetTenantId}...`);
  const cloned = {};
  for (const col of COLLECTIONS) {
    cloned[col] = await cloneCollection(db, FACTORY_TENANT_ID, targetTenantId, col);
    console.log(`   + ${col}: ${cloned[col]} doc(s) clonado(s)`);
  }

  console.log('\n✅ Backfill concluído.');
  console.log('   removidos:', deleted);
  console.log('   clonados :', cloned);
  process.exit(0);
}

main().catch((err) => {
  console.error('💥 Erro no backfill:', err);
  process.exit(1);
});
