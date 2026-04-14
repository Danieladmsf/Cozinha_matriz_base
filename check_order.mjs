import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

async function checkOrder() {
    console.log("=== CHECKING ORDER ppM7NCjUgrz6odds5z07 ===");
    const ref = doc(db, "Order", "ppM7NCjUgrz6odds5z07");
    const snap = await getDoc(ref);
    if (snap.exists()) {
        const data = snap.data();
        console.dir(data, { depth: null });
        
        console.log("\nIs the week number correct?", data.week_number === 16 ? "YES" : "NO", "(is "+data.week_number+")");
        console.log("Is the day correct?", data.day_of_week === 1 ? "YES (Monday)" : "NO: " + data.day_of_week);
        console.log("Are the items correct?");
        data.items?.forEach(item => {
            console.log(`- Item Name: ${item.name}`);
            console.log(`  Weight Info: ${item.weight_info}`);
            console.log(`  Qtd: ${item.quantity}`);
        });
    } else {
        console.log("Not found.");
    }
    process.exit(0);
}
checkOrder();
