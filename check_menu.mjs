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

async function checkMenu() {
    console.log("=== CHECKING WEEKLY MENU FOR WEEK 16 ===");
    const q = query(collection(db, "WeeklyMenu"), where("week_key", "==", "2026-W16"));
    const snap = await getDocs(q);
    
    if (snap.empty) {
        console.log("No menu found for week 2026-W16.");
    } else {
        snap.forEach(doc => {
            const data = doc.data();
            console.log("Document ID:", doc.id);
            console.log("User:", data.user_id);
            console.log("Days mapped:", Object.keys(data.days || {}));
            
            // Check Monday (Day 1 for JS getDay() usually, or however it's structured)
            if (data.days && data.days[1]) {
                console.log("\n--- SEGUNDA-FEIRA (Day 1) ---");
                const dayData = data.days[1];
                console.log("Categories found:", dayData.length);
                dayData.forEach(cat => {
                    console.log(`\nCategoria: ${cat.category_name} (ID: ${cat.category_id})`);
                    console.log("Receitas:");
                    (cat.recipes || []).forEach(r => {
                        console.log(`  - ${r.name || r.recipe_name} (ID: ${r.id || r.recipe_id})`);
                    });
                });
            } else {
                console.log("No data for Monday (day index 1).");
            }
        });
    }
    process.exit(0);
}

checkMenu();
