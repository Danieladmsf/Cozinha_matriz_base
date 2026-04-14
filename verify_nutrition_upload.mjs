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

async function verify() {
    console.log("--- NUTRITION CATEGORIES ---");
    const catSnap = await getDocs(collection(db, "NutritionCategory"));
    catSnap.docs.forEach(doc => console.log(`- ${doc.data().category} (${doc.id})`));

    console.log("\n--- NUTRITION FOODS (Sample 5) ---");
    const foodSnap = await getDocs(query(collection(db, "NutritionFood"), limit(5)));
    foodSnap.docs.forEach(doc => console.log(`- ${doc.data().name} [ID: ${doc.id}]`));
    
    process.exit(0);
}
verify();
