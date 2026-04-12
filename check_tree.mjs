import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

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

async function checkRelationships() {
    const rootSnap = await getDocs(query(collection(db, "CategoryTree"), where("name", "==", "HortFrut")));
    if (!rootSnap.empty) {
        const rootDoc = rootSnap.docs[0];
        console.log(`Pai Encontrado: ${rootDoc.data().name} | ID: ${rootDoc.id} | Nível: ${rootDoc.data().level}`);
        
        const childrenSnap = await getDocs(query(collection(db, "CategoryTree"), where("parent_id", "==", rootDoc.id)));
        console.log(`Filhos vinculados a este Pai: ${childrenSnap.size}`);
        childrenSnap.forEach(d => {
            console.log(`  -> ${d.data().name} | ID Pai: ${d.data().parent_id} | Nível: ${d.data().level}`);
        });
    } else {
        console.log("Pai não encontrado.");
    }
    process.exit(0);
}
checkRelationships();
