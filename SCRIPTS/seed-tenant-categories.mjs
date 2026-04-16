import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

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

const tenantId = process.argv[2];

if (!tenantId) {
    console.error('❌ Por favor, informe o TenantId. Ex: node scripts/seed-tenant-categories.mjs tenant_XYZ');
    process.exit(1);
}

const defaultCategories = [
    { name: 'Insumos' },
    { name: 'Receitas' },
    { name: 'Produtos SKU' }
];

async function seed() {
    console.log(`🌱 Semeando categorias para o tenant: ${tenantId}...`);
    try {
        for (const cat of defaultCategories) {
            const catRef = doc(collection(db, 'tenants', tenantId, 'Category'));
            await setDoc(catRef, {
                id: catRef.id,
                name: cat.name,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(` ✅ Injetada: ${cat.name}`);
        }
        console.log('✅ Todas Categorias padrão injetadas com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

seed();

seed();
