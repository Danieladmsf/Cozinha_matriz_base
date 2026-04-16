/**
 * Script de Migração Multi-Tenant
 * 
 * Move todos os dados das coleções raiz para a subcoleção do tenant do usuário.
 * 
 * USO:
 *   node scripts/migrate-to-tenant.mjs <TENANT_ID>
 * 
 * EXEMPLO:
 *   node scripts/migrate-to-tenant.mjs tenant_abc123def456
 * 
 * O que faz:
 * 1. Lê todos os documentos de cada coleção raiz
 * 2. Copia para tenants/{TENANT_ID}/{coleção}
 * 3. NÃO deleta os dados originais (segurança)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

// --- CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyDZp5jHdx6RoDcww_poTH7_UpNFjpdIquE",
    authDomain: "cozinha-matriz-base.firebaseapp.com",
    projectId: "cozinha-matriz-base",
    storageBucket: "cozinha-matriz-base.firebasestorage.app",
    messagingSenderId: "459924162938",
    appId: "1:459924162938:web:9c5f55d19c9e4dcc0e2ec3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Coleções que DEVEM ser migradas (multi-tenant)
const COLLECTIONS_TO_MIGRATE = [
    'Recipe',
    'Ingredient',
    'Category',
    'Product',
    'Customer',
    'Supplier',
    'Order',
    'WeeklyMenu',
    'WeeklyMenuConfig',
    'Production_Schedule',
    'Employee',
    'WorkStation',
    'WorkflowProcess',
    'sales_history',
    'DailyAssignment',
    'impressaoProgramacao',
    'programming_edits',
    'programming_block_order',
    'programming_custom_blocks',
    'POP',
    'pop_categorias',
    'NutritionalTable',
    'AIConfiguration',
    'Brand',
    'CategoryTree',
    'CategoryType',
    'MenuConfig',
    'MenuNote',
    'NutritionCategory',
    'NutritionFood',
    'PriceHistory',
    'UserNutrientConfig',
    'settings',
    'AppSettings',
    'BillPayment',
    'MenuCategory',
    'MenuLocation',
    'OrderReceiving',
    'OrderWaste',
    'OrderRupture',
    'RecipeIngredient',
    'RecipeNutritionConfig',
    'RecipeProcess',
    'RecurringBill',
    'VariableBill'
];

// Coleções que ficam GLOBAIS (NÃO migrar)
const GLOBAL_COLLECTIONS = [
    'User',
    'tenants'
];

// --- MAIN ---
async function migrate(tenantId) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║     MIGRAÇÃO MULTI-TENANT — COZINHA MATRIZ BASE     ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🎯 Tenant destino: ${tenantId}`);
    console.log(`📋 Coleções a migrar: ${COLLECTIONS_TO_MIGRATE.length}`);
    console.log('');

    const results = {
        total: 0,
        migrated: 0,
        skipped: 0,
        errors: 0,
        collections: {}
    };

    for (const collName of COLLECTIONS_TO_MIGRATE) {
        try {
            console.log(`\n📦 Migrando: ${collName}...`);

            // 1. Ler documentos da coleção raiz
            const sourceRef = collection(db, collName);
            const snapshot = await getDocs(sourceRef);

            if (snapshot.empty) {
                console.log(`   ⏭️  Vazia, pulando.`);
                results.collections[collName] = { count: 0, status: 'empty' };
                continue;
            }

            let count = 0;
            let errors = 0;

            // 2. Copiar cada documento para tenants/{tenantId}/{collName}
            for (const docSnap of snapshot.docs) {
                try {
                    const data = docSnap.data();
                    const destRef = doc(db, 'tenants', tenantId, collName, docSnap.id);
                    await setDoc(destRef, data);
                    count++;
                } catch (err) {
                    console.error(`   ❌ Erro no doc ${docSnap.id}:`, err.message);
                    errors++;
                }
            }

            results.total += snapshot.size;
            results.migrated += count;
            results.errors += errors;
            results.collections[collName] = {
                total: snapshot.size,
                migrated: count,
                errors,
                status: errors === 0 ? '✅' : '⚠️'
            };

            console.log(`   ✅ ${count}/${snapshot.size} documentos migrados`);

        } catch (err) {
            console.error(`   ❌ ERRO na coleção ${collName}:`, err.message);
            results.collections[collName] = { count: 0, status: 'error', error: err.message };
            results.errors++;
        }
    }

    // --- RELATÓRIO ---
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                   RELATÓRIO FINAL                   ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📊 Total de documentos: ${results.total}`);
    console.log(`✅ Migrados: ${results.migrated}`);
    console.log(`❌ Erros: ${results.errors}`);
    console.log('');

    console.log('📋 Detalhes por coleção:');
    for (const [name, info] of Object.entries(results.collections)) {
        console.log(`   ${info.status} ${name}: ${info.migrated || 0}/${info.total || 0}`);
    }

    console.log('');
    console.log('⚠️  IMPORTANTE: Os dados originais NÃO foram deletados.');
    console.log('   Após verificar que tudo funciona, você pode removê-los manualmente.');
    console.log('');

    return results;
}

// --- CLI ---
const tenantId = process.argv[2];

if (!tenantId) {
    console.error('');
    console.error('❌ USO: node scripts/migrate-to-tenant.mjs <TENANT_ID>');
    console.error('');
    console.error('   Exemplo: node scripts/migrate-to-tenant.mjs tenant_abc123def456');
    console.error('');
    console.error('   Para encontrar seu TENANT_ID:');
    console.error('   1. Faça login no app');
    console.error('   2. Abra o console do navegador (F12)');
    console.error('   3. Procure por "[TenantProvider] TenantId global setado: tenant_..."');
    console.error('');
    process.exit(1);
}

migrate(tenantId)
    .then(() => {
        console.log('🎉 Migração concluída!');
        process.exit(0);
    })
    .catch(err => {
        console.error('💀 ERRO FATAL:', err);
        process.exit(1);
    });
