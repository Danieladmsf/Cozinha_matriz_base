import { db } from './lib/firebase.js';
import { collection, getDocs, doc, setDoc, query, where, Timestamp } from "firebase/firestore";
import fs from 'fs';

// Função auxiliar para gerar IDs
function generateId(prefix = '') {
  return prefix + Math.random().toString(36).substring(2, 15);
}

// Ler o arquivo fill_technical_data.mjs para extrair a array TECH_DATABASE
const sourceFile = fs.readFileSync('fill_technical_data.mjs', 'utf-8');
const match = sourceFile.match(/const TECH_DATABASE = \[([\s\S]*?)\];/);

if (!match) {
  console.error("Não foi possível encontrar TECH_DATABASE no arquivo.");
  process.exit(1);
}

// Avaliar a string do array de volta para objeto real
// Removemos os comentários para que o eval não quebre em múltiplas linhas, e adicionamos colchetes.
const arrayString = `[${match[1]}]`;
let techDatabase;
try {
  techDatabase = eval(arrayString);
  console.log(`✅ Base de Inteligência Lida: ${techDatabase.length} categorias genéricas encontradas.`);
} catch(e) {
  console.error("Falha ao fazer parse do array.", e);
  process.exit(1);
}

// Fornecedores Genéricos Base para alimentar a grande massa (criaremos um distribuidor/hotifruti base)
const GENERIC_BRANDS = {
  Carnes: 'Frigorífico Genérico',
  Hortifruti: 'Ceagesp / Direto do Campo',
  Secos: 'Distribuidora Atacadista',
  Laticínios: 'Laticínios Atacadista',
  Outros: 'Fornecedor Padrão'
};

async function runSeeder100Percent() {
  console.log("🚀 Iniciando Seeder 100% da Base de Dados (120+ Itens)...");

  // 1. PROCESSAR FORNECEDORES GENÉRICOS (Garantir que existam)
  console.log("\n--- Sincronizando Suppliers Genéricos ---");
  const suppliersMap = {}; 
  for (const [cat, supName] of Object.entries(GENERIC_BRANDS)) {
    const q = query(collection(db, 'Supplier'), where("name", "==", supName));
    const snap = await getDocs(q);
    if (!snap.empty) {
      suppliersMap[supName] = snap.docs[0].id;
    } else {
      const supId = generateId('sup_');
      await setDoc(doc(db, 'Supplier', supId), {
        id: supId,
        name: supName,
        active: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      suppliersMap[supName] = supId;
    }
  }

  // 2. PROCESSAR OS +120 INGREDIENTES
  console.log("\n--- Injetando Insumos e Preços ---");

  let successCount = 0;

  for (const tech of techDatabase) {
    if (!tech.match || tech.match.length === 0) continue;

    // Pegar o nome mais bonito (geralmente o index 0)
    const rawName = tech.match[0];
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1); // Ex: "acém" => "Acém"

    const techData = {
      thawing_loss_pct: tech.thaw || 0,
      cleaning_loss_pct: tech.clean || 0,
      cooking_loss_pct: tech.cook || 0, 
      cleaning_time_per_kg: tech.time || 0
    };

    // Estimar categoria e brand e preço base para o insumo com base nas perdas ou nome
    // Muito genérico, mas atende perfeitamente ao requisito de "Fábrica".
    let category = 'Mercearia';
    let brand = GENERIC_BRANDS.Outros;
    let expectedPrice = 10.0;
    let unit = 'kg';

    if (tech.cook > 20 && tech.thaw === 0) { category = 'Carnes'; brand = GENERIC_BRANDS.Carnes; expectedPrice = 25.0; }
    else if (tech.thaw > 0 && tech.cook <= 25) { category = 'Peixes'; brand = GENERIC_BRANDS.Carnes; expectedPrice = 30.0; }
    else if (tech.cook <= 15 && tech.clean >= 10 && tech.cook >= 0) { category = 'Hortifruti'; brand = GENERIC_BRANDS.Hortifruti; expectedPrice = 7.0; }
    else if (tech.cook < 0) { category = 'Grãos'; brand = GENERIC_BRANDS.Secos; expectedPrice = 8.0; }

    // Busca se ingrediente já existe pelo nome
    const q = query(collection(db, 'Ingredient'), where("name", "==", name));
    const snap = await getDocs(q);
    
    let ingId = '';
    const targetSupplierId = suppliersMap[brand] || null;

    if (!snap.empty) {
      ingId = snap.docs[0].id;
      await setDoc(doc(db, 'Ingredient', ingId), {
        ...snap.docs[0].data(),
        technical_data: techData,
        supplier_id: targetSupplierId, // Associa ao fornecedor
        updatedAt: Timestamp.now()
      }, { merge: true });
    } else {
      ingId = generateId('ing_');
      await setDoc(doc(db, 'Ingredient', ingId), {
        id: ingId,
        name: name,
        category: category,
        type: category,
        primary_unit: unit,
        supplier_id: targetSupplierId,
        technical_data: techData,
        active: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }

    // 3. INSERIR HISTÓRICO DE PREÇO (PriceHistory)
    const phId = generateId('ph_');
    await setDoc(doc(db, 'PriceHistory', phId), {
      id: phId,
      ingredient_id: ingId,
      supplier_id: targetSupplierId,
      brand: brand,
      price: expectedPrice,
      unit: unit,
      date: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    successCount++;
    console.log(`✅ [${successCount}/${techDatabase.length}] Injetado 100%: ${name} (R$ ${expectedPrice.toFixed(2)} - ${brand}) | Perdas: ${tech.clean}%L | ${tech.cook}%C`);
  }

  console.log(`\n🎉 Injection Concluída! Total Processados: ${successCount} ingredientes.`);
  process.exit(0);
}

runSeeder100Percent().catch(e => {
  console.error("Erro no seeder:", e);
  process.exit(1);
});
