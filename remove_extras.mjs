import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

async function removeExtras() {
    console.log("Limpando categorias não solicitadas...");
    const snap = await getDocs(collection(db, "CategoryType"));
    for (let docSnap of snap.docs) {
        const data = docSnap.data();
        if (data.value === 'equipment' || data.value === 'pack') {
            await deleteDoc(doc(db, "CategoryType", docSnap.id));
            console.log("Deletado:", data.label);
        }
    }
    
    console.log("Limpeza concluída!");
    process.exit(0);
}
removeExtras();
