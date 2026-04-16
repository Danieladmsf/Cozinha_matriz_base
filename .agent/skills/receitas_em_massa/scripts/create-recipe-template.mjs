/**
 * TEMPLATE BASE PARA CRIAÇÃO DE FICHAS TÉCNICAS
 * ================================================
 * Copiar este arquivo, renomear e preencher os dados da nova receita.
 * Executar: node scripts/create-recipe-template.mjs
 */
import { db } from '../lib/firebase.js';
import { collection, getDocsFromServer, doc, updateDoc } from "firebase/firestore";

// ─────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────
const gid = () => String(Date.now() + Math.random());

const LOSSES = {
  'Acém (peça)':              { cleanLoss: 0.18, cookLoss: 0.25 },
  'Fraldinha (peça)':         { cleanLoss: 0.10, cookLoss: 0.22 },
  'Carne Moída - Acém':       { cleanLoss: 0.05, cookLoss: 0.25 },
  'Carne Moída - Fraldinha':  { cleanLoss: 0.03, cookLoss: 0.22 },
  'Frango (peça)':            { cleanLoss: 0.20, cookLoss: 0.28 },
  'Peito de Frango':          { cleanLoss: 0.05, cookLoss: 0.25 },
  'Cebola':                   { cleanLoss: 0.10, cookLoss: 0.30 },
  'Alho':                     { cleanLoss: 0.12, cookLoss: 0.00 },
  'Tomate':                   { cleanLoss: 0.10, cookLoss: 0.20 },
  'Cenoura':                  { cleanLoss: 0.22, cookLoss: 0.10 },
  'Batata':                   { cleanLoss: 0.25, cookLoss: 0.05 },
  'Chuchu':                   { cleanLoss: 0.15, cookLoss: 0.10 },
  'Abobrinha':                { cleanLoss: 0.10, cookLoss: 0.15 },
  'Arroz':                    { cleanLoss: 0.00, cookLoss: -1.50 },
  'Feijão Carioca':           { cleanLoss: 0.00, cookLoss: -2.00 },
  'Sal Refinado':             { cleanLoss: 0.00, cookLoss: 0.00 },
  'Pimenta do Reino':         { cleanLoss: 0.00, cookLoss: 0.00 },
  'Azeite':                   { cleanLoss: 0.00, cookLoss: 0.00 },
  'Óleo de Soja':             { cleanLoss: 0.00, cookLoss: 0.00 },
  'Água':                     { cleanLoss: 0.00, cookLoss: 1.00 },
};

function applyLosses(name, weightRaw) {
  const loss = LOSSES[name] || { cleanLoss: 0, cookLoss: 0 };
  const weightClean      = weightRaw * (1 - loss.cleanLoss);
  const weightPreCooking = weightClean;
  const weightCooked     = loss.cookLoss < 0
    ? weightPreCooking * (1 + Math.abs(loss.cookLoss))
    : weightPreCooking * (1 - loss.cookLoss);
  return {
    weight_raw:         parseFloat(weightRaw.toFixed(5)),
    weight_clean:       parseFloat(weightClean.toFixed(5)),
    weight_pre_cooking: parseFloat(weightPreCooking.toFixed(5)),
    weight_cooked:      parseFloat(weightCooked.toFixed(5)),
    quantity:           weightRaw,
  };
}

function generateRecipeCode(recipeName, allCodes = []) {
  const prefix = recipeName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
  let maxGlobalNumber = 0;
  allCodes.forEach(code => {
    const m = code.match(/\d+/);
    if (m) { const n = parseInt(m[0], 10); if (n > maxGlobalNumber) maxGlobalNumber = n; }
  });
  let counter = maxGlobalNumber + 1;
  let newCode = `${prefix}${String(counter).padStart(3, '0')}`;
  while (allCodes.includes(newCode)) { counter++; newCode = `${prefix}${String(counter).padStart(3, '0')}`; }
  return newCode;
}

// ─────────────────────────────────────────────
// CARREGAR BANCO
// ─────────────────────────────────────────────
async function loadDB() {
  const [ingSnap, recSnap, catSnap] = await Promise.all([
    getDocsFromServer(collection(db, 'Ingredient')),
    getDocsFromServer(collection(db, 'Recipe')),
    getDocsFromServer(collection(db, 'Category')),
  ]);

  const ingredients = {};
  ingSnap.forEach(d => { ingredients[d.data().name.trim()] = { id: d.id, ...d.data() }; });

  const allCodes = [];
  recSnap.forEach(d => { if (d.data().code) allCodes.push(d.data().code); });

  const categories = {};
  catSnap.forEach(d => { categories[d.data().name.trim()] = d.id; });

  return { ingredients, allCodes, categories };
}

// ─────────────────────────────────────────────
// CRIAR INGREDIENTE (estrutura completa)
// ─────────────────────────────────────────────
function makeIngredient(ingMap, name, weightRaw) {
  const ing = ingMap[name];
  if (!ing) { console.warn(`[WARN] Ingrediente não encontrado: "${name}"`); return null; }

  const losses = applyLosses(name, weightRaw);

  return {
    ingredient_id: ing.id,
    id: ing.id,
    name: ing.name,
    unit: ing.unit || 'Kg',
    current_price: ing.current_price || 0,
    active: true,
    item_type: 'ingrediente',
    ingredient_type: ing.ingredient_type || 'traditional',
    category: ing.category || '',
    brand: ing.brand || '',
    displayBrand: ing.brand || '',
    main_supplier: ing.main_supplier || '',
    displaySupplier: ing.main_supplier || '',
    supplier_id: ing.supplier_id || '',
    supplier_code: ing.supplier_code || '',
    brand_id: ing.brand_id || '',
    min_stock: 0,
    current_stock: 0,
    technical_data: {},
    notes: '',
    chosen_taco_id: ing.chosen_taco_id || null,
    chosen_variation_name: ing.chosen_variation_name || 'Cru',
    taco_variations: ing.taco_variations || [],
    taco_id: ing.taco_id || null,
    commercial_name: ing.commercial_name || '',
    last_update: ing.last_update || '',
    createdAt: ing.createdAt || null,
    updatedAt: ing.updatedAt || null,
    ...losses,
    weight_frozen: '',
    weight_thawed: '',
    weight_portioned: '',
    dndId: `dnd-${ing.id}-${Date.now()}`,
  };
}

// ─────────────────────────────────────────────
// ★ PREENCHER AQUI — DADOS DA NOVA RECEITA ★
// ─────────────────────────────────────────────
async function buildRecipe(ingMap, catMap) {

  // IDs de etapas (gerados antes para cross-referência)
  const etapa1Id = gid();
  const etapa2Id = gid();

  const etapa1 = {
    id: etapa1Id,
    title: "1º Etapa: Limpeza + Cocção",
    processes: ["cleaning", "cooking"],
    instructions: "",
    ingredients: [
      // makeIngredient(ingMap, 'Nome do Ingrediente', peso_bruto_em_kg),
      makeIngredient(ingMap, 'Carne Moída - Acém',      0.700),
      makeIngredient(ingMap, 'Carne Moída - Fraldinha', 0.300),
      makeIngredient(ingMap, 'Sal Refinado',            0.020),
      makeIngredient(ingMap, 'Pimenta do Reino',        0.005),
    ].filter(Boolean),
    notes: [
      {
        id: gid(), title: "",
        content: "<p>Instruções do processo...</p>",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };

  const etapa2 = {
    id: etapa2Id,
    title: "2º Etapa: Porcionamento",
    processes: ["portioning"],
    ingredients: [],
    sub_components: [
      {
        id: gid(),
        type: 'preparation',
        source_id: etapa1Id,
        name: etapa1.title,
        assembly_weight_kg: "0.180",   // ← peso do produto final
        yield_weight: 0,
        total_cost: 0
      }
    ],
    assembly_config: {
      container_type: "unidade",
      unit_type: "kg",
      units_quantity: "1",
      total_weight: "",
      notes: ""
    },
    instructions: "",
    notes: []
  };

  return {
    name: "Nome da Receita",               // ← PREENCHER
    category: "Hamburguers",               // ← PREENCHER
    category_id: catMap["Hamburguers"] || null,
    type: "receitas",                       // "receitas" ou "produtos"
    prep_time: 20,
    production_time: 20,
    portion_size: 180,
    video_url: "",
    notes: "",
    // Controle de Qualidade
    shelf_life: "2 dias",
    storage_temperature: "-18 graus (congelado) / 4 graus (refrigerado)",
    allergens: "Não declarado. Pode conter traços de glúten.",
    ccp_notes: "Temperatura interna mínima: 71°C. Evitar contaminação cruzada.",
    preparations: [etapa1, etapa2],
  };
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  console.log("📥 Carregando banco de dados...");
  const { ingredients, allCodes, categories } = await loadDB();

  const recipeData = await buildRecipe(ingredients, categories);

  console.log(`🌐 Criando receita "${recipeData.name}" via API...`);
  const res = await fetch('http://localhost:3000/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipeData)
  });
  const result = await res.json();
  if (!result.success) { console.error("❌ Erro:", result.error); process.exit(1); }

  const newId = result.data.id;
  const code  = generateRecipeCode(recipeData.name, allCodes);

  await updateDoc(doc(db, 'Recipe', newId), {
    code,
    active: true,
    status: 'active',
    updatedAt: new Date()
  });

  console.log(`✅ Receita criada com sucesso!`);
  console.log(`   ID:     ${newId}`);
  console.log(`   Código: ${code}`);
  console.log(`   Status: Ativo`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
