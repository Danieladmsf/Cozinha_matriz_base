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

const TYPE_NORMALIZATION = {
  'product': 'receitas',
  'recipe': 'receitas',
  'recipes': 'receitas',
  'receita': 'receitas',
  'produto': 'produtos',
  'products': 'produtos',
};

async function fixTypes() {
  const snap = await getDocs(collection(db, 'Recipe'));
  let fixed = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const currentType = (data.type || '').toLowerCase();
    const normalized = TYPE_NORMALIZATION[currentType];

    if (normalized) {
      console.log(`  🔧 [${d.id}] "${data.name}" → type "${data.type}" → "${normalized}"`);
      await updateDoc(doc(db, 'Recipe', d.id), { type: normalized });
      fixed++;
    }
  }

  console.log(`\n✅ ${fixed} receita(s) corrigida(s).`);
  process.exit(0);
}

fixTypes().catch(e => { console.error(e); process.exit(1); });
