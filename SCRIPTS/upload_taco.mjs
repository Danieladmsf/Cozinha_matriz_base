import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs } from "firebase/firestore";
import fs from 'fs';
import path from 'path';

// Configuração extraída de check_db.mjs
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

const TACO_PATH = path.join(process.cwd(), 'data', 'taco.json');

// Função utilitária para converter valores para string (conforme estrutura do projeto)
const toValidString = (value) => {
    if (value === null || value === undefined) return "";
    if (value === 0 || value === 0.0) return "0";
    if (value === "NA" || value === "Tr") return value;
    return value.toString();
};

async function upload() {
    console.log("🚀 Iniciando processamento do TACO para Firestore...");
    
    if (!fs.existsSync(TACO_PATH)) {
        console.error("❌ Erro: data/taco.json não encontrado.");
        return;
    }

    const data = JSON.parse(fs.readFileSync(TACO_PATH, 'utf8'));
    console.log(`📊 Total de registros encontrados: ${data.length}`);

    // 1. Extrair e criar categorias únicas
    const categories = [...new Set(data.map(item => item.category))];
    console.log(`📂 Criando ${categories.length} categorias nutricionais...`);

    for (const catName of categories) {
        const catId = catName.toLowerCase().replace(/[^\w]/g, '_');
        await setDoc(doc(db, "NutritionCategory", catId), {
            id: catId,
            category: catName,
            active: true,
            updatedAt: new Date()
        });
    }

    // 2. Upload de Alimentos em lotes (para evitar sobrecarga de rede)
    console.log("🍎 Enviando alimentos para NutritionFood...");
    
    let success = 0;
    let error = 0;

    for (const item of data) {
        try {
            const foodId = `taco_${item.id}`;
            const processedItem = {
                id: foodId,
                taco_id: String(item.id),
                name: item.description,
                description: item.description,
                category_name: item.category,
                category_id: item.category.toLowerCase().replace(/[^\w]/g, '_'),
                active: true,
                updatedAt: new Date(),
                
                // Composição Centesimal
                humidity_percents: toValidString(item.humidity_percents),
                energy_kcal: toValidString(item.energy_kcal),
                energy_kj: toValidString(item.energy_kj),
                protein_g: toValidString(item.protein_g),
                lipid_g: toValidString(item.lipid_g),
                carbohydrate_g: toValidString(item.carbohydrate_g),
                fiber_g: toValidString(item.fiber_g),
                ashes_g: toValidString(item.ashes_g),

                // Minerais
                calcium_mg: toValidString(item.calcium_mg),
                magnesium_mg: toValidString(item.magnesium_mg),
                manganese_mg: toValidString(item.manganese_mg),
                phosphorus_mg: toValidString(item.phosphorus_mg),
                iron_mg: toValidString(item.iron_mg),
                sodium_mg: toValidString(item.sodium_mg),
                potassium_mg: toValidString(item.potassium_mg),
                copper_mg: toValidString(item.copper_mg),
                zinc_mg: toValidString(item.zinc_mg),

                // Vitaminas
                retinol_mcg: toValidString(item.retinol_mcg),
                re_mcg: toValidString(item.re_mcg),
                rae_mcg: toValidString(item.rae_mcg),
                thiamine_mg: toValidString(item.thiamine_mg),
                riboflavin_mg: toValidString(item.riboflavin_mg),
                pyridoxine_mg: toValidString(item.pyridoxine_mg),
                niacin_mg: toValidString(item.niacin_mg),
                vitaminC_mg: toValidString(item.vitaminC_mg),

                // Gorduras
                cholesterol_mg: toValidString(item.cholesterol_mg),
                saturated_g: toValidString(item.saturated_g),
                monounsaturated_g: toValidString(item.monounsaturated_g),
                polyunsaturated_g: toValidString(item.polyunsaturated_g)
            };

            await setDoc(doc(db, "NutritionFood", foodId), processedItem);
            success++;
            
            if (success % 50 === 0) {
                console.log(`✅ Progresso: ${success}/${data.length}...`);
            }
        } catch (e) {
            console.error(`❌ Erro no item ${item.id}:`, e.message);
            error++;
        }
    }

    console.log(`\n🎉 Upload Concluído!`);
    console.log(`   - Sucesso: ${success}`);
    console.log(`   - Erros: ${error}`);
    process.exit(0);
}

upload();
