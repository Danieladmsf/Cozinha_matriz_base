import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyDZp5jHdx6RoDcww_poTH7_UpNFjpdIquE",
  authDomain: "cozinha-matriz-base.firebaseapp.com",
  projectId: "cozinha-matriz-base",
  storageBucket: "cozinha-matriz-base.firebasestorage.app",
  messagingSenderId: "459924162938",
  appId: "1:459924162938:web:9c5f55d19c9e4dcc0e2ec3"
});
const db = getFirestore(app);

async function checkTypes() {
  const snap = await getDocs(collection(db, 'Recipe'));
  console.log('=== TIPOS DAS RECEITAS NO BANCO ===');
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`  [${doc.id}] "${d.name || d.title}" → type="${d.type}" | recipe_type="${d.recipe_type}" | category="${d.category}"`);
  });
  process.exit(0);
}
checkTypes().catch(e => { console.error(e); process.exit(1); });
