import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";

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

async function main() {
    const q = query(collection(db, "Ingredient"), limit(1));
    const snap = await getDocs(q);
    snap.forEach(doc => {
        console.log("ID:", doc.id);
        console.log("Data:", JSON.stringify(doc.data(), null, 2));
    });
    process.exit(0);
}
main();
