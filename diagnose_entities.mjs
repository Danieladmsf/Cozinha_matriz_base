import { NutritionFood, NutritionCategory } from "./app/api/entities.js";

async function diagnose() {
    try {
        console.log("🔍 Testando NutritionCategory.list()...");
        const cats = await NutritionCategory.list();
        console.log(`✅ Encontradas ${cats.length} categorias no Firestore.`);
        if (cats.length > 0) {
            console.log("Exemplo:", cats[0]);
        }

        console.log("\n🔍 Testando NutritionFood.list()...");
        const foods = await NutritionFood.list(); // Isso usará getDocsFromServer
        console.log(`✅ Encontrados ${foods.length} alimentos no Firestore.`);
        if (foods.length > 0) {
            console.log("Exemplo:", foods[0].name);
        }

    } catch (e) {
        console.error("❌ Erro no diagnóstico:", e);
    }
    process.exit(0);
}

diagnose();
