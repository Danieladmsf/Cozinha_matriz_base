import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyDZp5jHdx6RoDcww_poTH7_UpNFjpdIquE",
  authDomain: "cozinha-matriz-base.firebaseapp.com",
  projectId: "cozinha-matriz-base",
  storageBucket: "cozinha-matriz-base.firebasestorage.app",
  messagingSenderId: "459924162938",
  appId: "1:459924162938:web:9c5f55d19c9e4dcc0e2ec3"
});
const db = getFirestore(app);

async function checkArrozProduct() {
  console.log('=== VERIFICANDO RECEITAS ("Recipe") ===');
  const recipesSnap = await getDocs(collection(db, 'Recipe'));
  let recipeId = null;
  recipesSnap.forEach(doc => {
    const d = doc.data();
    if (d.name === 'Arroz' || d.title === 'Arroz' || (d.name && d.name.includes('Arroz'))) {
      console.log(`  RECEITA [${doc.id}] "${d.name || d.title}"`);
      console.log(`    ↳ type: "${d.type}"`);
      console.log(`    ↳ category: "${d.category}"`);
      console.log(`    ↳ custo CMV: R$ ${d.total_cost || d.portion_cost || 'N/A'}`);
      console.log(`    ↳ peso liq: ${d.yield_weight}kg`);
      recipeId = doc.id;
    }
  });

  console.log('\n=== VERIFICANDO SKU COMERCIAL ("Product") ===');
  const productsSnap = await getDocs(collection(db, 'Product'));
  productsSnap.forEach(doc => {
    const d = doc.data();
    if (d.name === 'Arroz' || d.title === 'Arroz' || (d.name && d.name.includes('Arroz'))) {
      console.log(`  PRODUTO [${doc.id}] "${d.name || d.title}"`);
      console.log(`    ↳ unit_type: "${d.unit_type}"`);
      console.log(`    ↳ category: "${d.category}"`);
      console.log(`    ↳ recipe_link_id: "${d.recipe_link_id}"`);
      console.log(`    ↳ components:`, d.components ? JSON.stringify(d.components) : 'Nenhum');
    }
  });

  process.exit(0);
}

checkArrozProduct().catch(e => { console.error(e); process.exit(1); });
