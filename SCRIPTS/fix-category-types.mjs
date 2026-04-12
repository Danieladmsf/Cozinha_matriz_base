import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyDZp5jHdx6RoDcww_poTH7_UpNFjpdIquE",
  authDomain: "cozinha-matriz-base.firebaseapp.com",
  projectId: "cozinha-matriz-base",
  storageBucket: "cozinha-matriz-base.firebasestorage.app",
  messagingSenderId: "459924162938",
  appId: "1:459924162938:web:9c5f55d19c9e4dcc0e2ec3"
});
const db = getFirestore(app);

// Mapa canônico: variações → tipo correto no padrão do sistema
const CANONICAL = {
  'recipe': 'receitas',
  'recipes': 'receitas',
  'receita': 'receitas',
  'product': 'produtos',
  'products': 'produtos',
  'produto': 'produtos',
  'ingredient': 'ingredientes',
  'ingredients': 'ingredientes',
  'ingrediente': 'ingredientes',
};

async function fixCategoryTypes() {
  const snap = await getDocs(collection(db, 'CategoryTree'));
  let fixed = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const currentType = (data.type || '').toLowerCase().trim();
    const normalized = CANONICAL[currentType];

    if (normalized && normalized !== currentType) {
      console.log(`  🔧 [${d.id}] "${data.name}" → type "${data.type}" → "${normalized}"`);
      await updateDoc(doc(db, 'CategoryTree', d.id), { type: normalized });
      fixed++;
    } else if (!normalized && currentType) {
      // Tipo já é canônico (receitas, produtos, ingredientes)
      console.log(`  ✅ [${d.id}] "${data.name}" → type "${data.type}" (já correto)`);
    } else if (!currentType) {
      console.log(`  ⚠️  [${d.id}] "${data.name}" → SEM TIPO DEFINIDO!`);
    }
  }

  console.log(`\n✅ ${fixed} categoria(s) normalizada(s).`);
  process.exit(0);
}

fixCategoryTypes().catch(e => { console.error(e); process.exit(1); });
