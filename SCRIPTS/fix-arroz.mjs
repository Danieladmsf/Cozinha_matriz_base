import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyDZp5jHdx6RoDcww_poTH7_UpNFjpdIquE",
  authDomain: "cozinha-matriz-base.firebaseapp.com",
  projectId: "cozinha-matriz-base",
  storageBucket: "cozinha-matriz-base.firebasestorage.app",
  messagingSenderId: "459924162938",
  appId: "1:459924162938:web:9c5f55d19c9e4dcc0e2ec3"
});
const db = getFirestore(app);

// Arroz Branco é receita (Guarnição), não produto
await updateDoc(doc(db, 'Recipe', 'gTugX51VzQUc5IeSJ8tE'), { type: 'receitas' });
console.log('✅ Arroz Branco corrigido para type="receitas"');
process.exit(0);
