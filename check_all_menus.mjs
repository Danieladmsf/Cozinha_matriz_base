import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function checkMenuGlobal() {
    console.log("=== CHECKING ALL WEEKLY MENUS (Corrected) ===");
    const snap = await getDocs(collection(db, "WeeklyMenu"));
    
    if (snap.empty) {
        console.log("No menus found AT ALL.");
    } else {
        snap.forEach(doc => {
            const data = doc.data();
            console.log("\nDocument ID:", doc.id);
            console.log("User:", data.user_id);
            console.log("Week Key:", data.week_key);
            console.log("menu_data present?", !!data.menu_data);
            
            if (data.menu_data) {
                // menu_data is structured as: { mealType: { dayIndex: { categoryId: [items] } } }
                for (const [mealType, mealData] of Object.entries(data.menu_data)) {
                    console.log(`\n--- Aba (MealType): ${mealType} ---`);
                    for (const [dayIndex, dayData] of Object.entries(mealData)) {
                        console.log(`  Dia ${dayIndex}:`);
                        for (const [catId, items] of Object.entries(dayData)) {
                            console.log(`    Categoria ID: ${catId}`);
                            items.forEach(i => {
                                console.log(`      -> recipe_id: ${i.recipe_id}`);
                            });
                        }
                    }
                }
            }
        });
    }
    process.exit(0);
}

checkMenuGlobal();
