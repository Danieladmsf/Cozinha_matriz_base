const { Recipe, Ingredient } = require('./app/api/entities');
const fs = require('fs');

async function debugArroz() {
    try {
        console.log("--- DEBUG ARROZ ---");
        const recipeId = "mLIprV0BoAyOofRkgK5P";
        const masterArrozId = "umP3wA8e9i23TqE5tLc8";

        const recipe = await Recipe.get(recipeId);
        if (!recipe) {
            console.error("Receita não encontrada!");
            return;
        }

        console.log(`Receita: ${recipe.name}`);
        recipe.preparations.forEach((prep, pIdx) => {
            console.log(`Etapa ${pIdx}: ${prep.title}`);
            if (prep.ingredients) {
                prep.ingredients.forEach(ing => {
                    if (ing.name.toLowerCase().includes('arroz')) {
                        console.log(`  [MATCH] Ingrediente: ${ing.name}`);
                        console.log(`    -> ing.id: ${ing.id}`);
                        console.log(`    -> ing.ingredient_id: ${ing.ingredient_id}`);
                        console.log(`    -> ing.source_ingredient_id: ${ing.source_ingredient_id}`);
                        console.log(`    -> Tem taco_variations? ${ing.taco_variations ? ing.taco_variations.length : 'NÃO'}`);
                    }
                });
            }
        });

        const masterArroz = await Ingredient.get(masterArrozId);
        console.log("\n--- MASTER ARROZ (MATRIZ) ---");
        console.log(`ID: ${masterArroz.id}`);
        console.log(`Nome: ${masterArroz.name}`);
        console.log(`Taco Variations: ${masterArroz.taco_variations ? masterArroz.taco_variations.length : 0}`);

    } catch (err) {
        console.error("ERRO:", err);
    }
}

debugArroz();
