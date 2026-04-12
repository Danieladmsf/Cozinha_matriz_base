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

async function checkCats() {
  const snap = await getDocs(collection(db, 'CategoryTree'));
  console.log('=== CATEGORIAS NO BANCO ===');
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`  [${doc.id}] "${d.name}" → type="${d.type}" | level=${d.level} | parent="${d.parent_id || 'ROOT'}" | active=${d.active}`);
  });
  process.exit(0);
}
checkCats().catch(e => { console.error(e); process.exit(1); });
