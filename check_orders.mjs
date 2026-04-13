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

async function checkOrders() {
    console.log("=== CHECKING ORDERS FOR 13/04/2026 ===");
    // Usually collection is Order or customer_orders
    const collectionsToCheck = ["Order", "Orders", "customer_orders", "DailyOrder"];
    
    for (const c of collectionsToCheck) {
        console.log(`\nChecking collection: ${c}`);
        try {
            const snap = await getDocs(collection(db, c));
            if (!snap.empty) {
                console.log(`Found ${snap.size} documents in ${c}`);
                snap.docs.slice(0, 5).forEach(doc => {
                    const data = doc.data();
                    console.log("Doc ID:", doc.id);
                    // Print summary
                    console.log(JSON.stringify(data).substring(0, 200) + "...");
                });
            }
        } catch (e) {
            // Collection might not exist
        }
    }
    process.exit(0);
}

checkOrders();
