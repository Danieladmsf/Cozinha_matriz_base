/**
 * Cria a ficha técnica do Hambúrguer Blend via API HTTP (localhost:3000)
 * Isso garante: código automático (#HAMXXX), status ativo, e estrutura idêntica ao frontend.
 */
import { db } from './lib/firebase.js';
import { collection, getDocsFromServer } from "firebase/firestore";

const gid = () => String(Date.now() + Math.random());

async function main() {
  console.log("📥 Carregando ingredientes do banco...");
  const snap = await getDocsFromServer(collection(db, 'Ingredient'));
  const map = {};
  snap.forEach(d => { map[d.data().name.trim()] = { id: d.id, ...d.data() }; });

  // Função para criar um ingrediente com a estrutura EXATA igual ao DB real
  function makeIng(name, weightRaw, weightClean, weightPreCooking, weightCooked) {
    const ing = map[name];
    if (!ing) { console.warn(`[WARN] ingrediente não encontrado: "${name}"`); return null; }

    return {
      // — campos do cadastro (cópia da collection Ingredient)
      ingredient_id: ing.id,
      id: ing.id,           // o frontend usa o id do ingrediente como referência inicial
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
      // — campos de processo (preenchidos por ingrediente)
      quantity: weightRaw,
      weight_frozen: '',
      weight_thawed: '',
      weight_raw: weightRaw,
      weight_clean: weightClean,
      weight_pre_cooking: weightPreCooking,
      weight_cooked: weightCooked,
      weight_portioned: '',
      // dndId único para drag-and-drop
      dndId: `dnd-${ing.id}-${Date.now()}`,
    };
  }

  // Ingredientes do Blend (sem descongelamento, limpeza mínima, sem cocção - carne crua)
  // Acém: 700g bruto → 700g limpo (sem limpeza) → fica cru (weight_cooked = mesmo peso)
  // Fraldinha: 300g bruto → 300g limpo → cru
  // Sal: 20g, Pimenta: 5g, Alho granulado: 8g
  const ingredients = [
    makeIng('Carne Moída - Acém',      0.700, 0.700, 0.700, 0.700),
    makeIng('Carne Moída - Fraldinha', 0.300, 0.300, 0.300, 0.300),
    makeIng('Sal Refinado',            0.020, 0.020, 0.020, 0.020),
    makeIng('Pimenta do Reino',        0.005, 0.005, 0.005, 0.005),
  ].filter(Boolean);

  const etapa1Id = gid();
  const etapa2Id = gid();

  const prep1 = {
    id: etapa1Id,
    title: "1º Etapa: Blend + Temperos",
    processes: ["cleaning", "cooking"],  // "cleaning" = coluna limpeza, "cooking" = coluna cocção
    ingredients,
    instructions: "",
    notes: [
      {
        id: gid(),
        title: "",
        content: "<p><em>BLEND DE HAMBÚRGUER</em></p><p></p><p><em>MATÉRIA-PRIMA:</em></p><p>- Acém: 700g (70% do blend — sabor e textura)</p><p>- Fraldinha: 300g (30% do blend — maciez e suculência)</p><p>- Gordura total do blend: aprox. 20%</p><p></p><p><em>PROCESSO:</em></p><p>1. Manter as carnes refrigeradas (abaixo de 4°C) durante todo o processo</p><p>2. Pesar e misturar o acém e a fraldinha</p><p>3. Adicionar sal e pimenta e mesclar gentilmente sem amassar</p><p>4. Modelar em discos de 180g usando aro de 11cm</p><p>5. Pressionar levemente o centro do disco para evitar abaulamento na grelha</p><p>6. Intercalar os discos com papel manteiga cortado</p><p>7. Manter refrigerado até o uso ou congelar imediatamente</p><p></p><p><em>NOTAS:</em></p><p>- NÃO usar carne moída de segunda, pois compromete a textura</p><p>- O blend deve ser moído na hora para máxima qualidade</p>",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };

  const prep2 = {
    id: etapa2Id,
    title: "2º Etapa: Porcionamento",
    processes: ["portioning"],
    ingredients: [],
    sub_components: [
      {
        id: gid(),
        type: 'preparation',
        source_id: etapa1Id,
        name: "1º Etapa: Blend + Temperos",
        assembly_weight_kg: "0.180",
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
    notes: [
      {
        id: gid(),
        title: "",
        content: "<p><em>RENDIMENTO FINAL:</em></p><p>- Blend total: 1.025 kg de carne temperada</p><p>- Discos de 180g por unidade</p><p>- Rendimento: ~5 discos por batelada</p><p>- Perda de modelagem e sobras: aprox. 2%</p><p></p><p><em>NOTAS DE GRELHA:</em></p><p>- Grelhar a 250°C por 3 min de cada lado para ponto ao ponto</p><p>- Para ponto mal passado: 2 min cada lado</p><p>- Nunca pressionar o hambúrguer na grelha — perde sucos</p>",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };

  // Buscar o category_id da categoria Hamburguers
  const catSnap = await getDocsFromServer(collection(db, 'Category'));
  let categoryId = null;
  catSnap.forEach(d => {
    if (d.data().name && d.data().name.toLowerCase().includes('hamburguer') ||
        d.data().name && d.data().name.toLowerCase().includes('hambúrguer')) {
      categoryId = d.id;
      console.log(`✅ Categoria encontrada: ${d.data().name} (${d.id})`);
    }
  });

  const recipePayload = {
    name: "Hambúrguer Blend Especial (180g)",
    category: "Hamburguers",
    category_id: categoryId || null,
    type: "receitas",
    prep_time: 20,
    production_time: 20,
    portion_size: 180,
    video_url: "",
    notes: "",
    preparations: [prep1, prep2],
    // Status e código serão gerados pelo Recipe.create() na API
  };

  console.log("🌐 Enviando para a API (POST http://localhost:3000/api/recipes)...");
  const res = await fetch('http://localhost:3000/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipePayload)
  });

  const result = await res.json();

  if (result.success) {
    console.log("✅ Receita criada com sucesso!");
    console.log("   ID:", result.data?.id);
    console.log("   Code:", result.data?.code || result.data?.displayId || '(gerado pelo sistema)');
    console.log("   Status:", result.data?.status || result.data?.active);
  } else {
    console.error("❌ Erro na API:", result.error);
    console.log("Payload enviado:", JSON.stringify(recipePayload, null, 2));
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
