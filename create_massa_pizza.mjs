/**
 * Cria a receita: Massa de Pizza Napolitana
 * Segue o padrão da skill receitas_em_massa
 */
import { db } from './lib/firebase.js';
import { collection, getDocsFromServer, doc, updateDoc } from "firebase/firestore";

// ── Utilidades ────────────────────────────────────────────────────
const gid = () => Math.random().toString(36).slice(2, 18) + Date.now().toString(36);

function generateRecipeCode(recipeName, allCodes = []) {
  const prefix = recipeName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
  let maxN = 0;
  allCodes.forEach(code => { const m = (code || '').match(/\d+/); if (m) { const n = parseInt(m[0], 10); if (n > maxN) maxN = n; } });
  let counter = maxN + 1;
  let newCode = `${prefix}${String(counter).padStart(3, '0')}`;
  while (allCodes.includes(newCode)) { counter++; newCode = `${prefix}${String(counter).padStart(3, '0')}`; }
  return newCode;
}

// ── Dados dos Ingredientes (obtidos do banco) ─────────────────────
const INGREDIENTS = {
  farinha: {
    id: 'PI5IwEEQS47ZQ7DCdJON',
    name: 'Farinha de Trigo Especial',
    unit: 'Kg',
    current_price: 8.5,
    category: 'Mercearia',
    ingredient_type: 'traditional',
    brand: 'Venturelli',
    main_supplier: 'Moinho Regional',
  },
  agua: {
    id: '16QjBw676cIazFHnv72P',
    name: 'Aguá',
    unit: 'kg',
    current_price: 0,
    category: '',
    ingredient_type: 'both',
    brand: '',
    main_supplier: '',
  },
  fermento: {
    id: 'WdUD6iNqnJyyJU5hcPi8',
    name: 'Fermento Biológico Seco',
    unit: 'Kg',
    current_price: 65,
    category: 'Mercearia',
    ingredient_type: 'traditional',
    brand: 'Fleshman',
    main_supplier: 'Distribuidora Master',
  },
  sal: {
    id: 'Slb5zAQH6QW6fAzYX6LN',
    name: 'Sal Refinado',
    unit: 'Kg',
    current_price: 33.11,
    category: 'Miscelâneas',
    ingredient_type: 'traditional',
    brand: 'Sal Diana',
    main_supplier: 'Atacadão',
  },
  acucar: {
    id: 'SprKGPCFdkjai0XS4SS6',
    name: 'Açúcar Refinado',
    unit: 'Kg',
    current_price: 33.5,
    category: 'Mercearia',
    ingredient_type: 'traditional',
    brand: 'Guarani',
    main_supplier: 'Atacadão',
  },
};

// ── Monta ingrediente com campos de processo ───────────────────────
// Para esta receita: todos são secos/líquidos sem perda (são incorporados na massa)
function buildIngredient(ing, weightRawKg) {
  return {
    ingredient_id: ing.id,
    id: ing.id,
    name: ing.name,
    unit: ing.unit,
    current_price: ing.current_price,
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
    // Campos de processo
    quantity:           weightRawKg,
    weight_frozen:      '',
    weight_thawed:      '',
    weight_raw:         parseFloat(weightRawKg.toFixed(5)),
    weight_clean:       parseFloat(weightRawKg.toFixed(5)), // sem perda de limpeza
    weight_pre_cooking: parseFloat(weightRawKg.toFixed(5)),
    weight_cooked:      parseFloat(weightRawKg.toFixed(5)), // incorporados na massa
    weight_portioned:   '',
    dndId:              `dnd-${ing.id}-${Date.now()}`,
  };
}

// ── Etapa 1: Preparo da Massa ─────────────────────────────────────
// Rendimentos em kg:
// Farinha de Trigo Especial  : 500g  = 0.500 kg
// Água                       : 350ml = 0.350 kg
// Fermento Biológico Seco    : 150g  = 0.150 kg (fermento natural/levain)
// Sal Refinado               : 10g   = 0.010 kg
// Açúcar Refinado            : 5g    = 0.005 kg
// Total massa crua           : 1.015 kg

const etapa1Id = gid();

const prep1 = {
  id: etapa1Id,
  title: '1ª Etapa: Preparo da Massa',
  processes: ['cleaning', 'cooking'],
  ingredients: [
    buildIngredient(INGREDIENTS.farinha,  0.500),
    buildIngredient(INGREDIENTS.agua,     0.350),
    buildIngredient(INGREDIENTS.fermento, 0.150),
    buildIngredient(INGREDIENTS.sal,      0.010),
    buildIngredient(INGREDIENTS.acucar,   0.005),
  ],
  notes: [
    {
      id: gid(),
      title: 'MATÉRIA-PRIMA',
      content: '<ul><li>Produto: Farinha, Água, Fermento, Sal e Açúcar</li><li>Peso cru: 1,015 kg</li><li>Peso final: 1,015 kg</li><li>Rendimento: 100%</li></ul>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: gid(),
      title: 'ATIVAR O FERMENTO',
      content: '1. Em uma tigela grande, dissolva o fermento na água junto com o açúcar.<br>2. Aguarde 5 minutos até espumar levemente.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: gid(),
      title: 'INCORPORAR A FARINHA',
      content: '3. Adicione a farinha e o sal, misturando de dentro para fora até incorporar tudo.<br>4. Cubra com plástico filme e leve à geladeira por 1 hora.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: gid(),
      title: 'DOBRAS DA MASSA',
      content: '5. Retire da geladeira e realize as dobras: dobre a massa sobre ela mesma dos 4 lados.<br>6. Cubra e aguarde 30 minutos.<br>7. Repita o processo 4 vezes com intervalos de 30 minutos entre cada dobra.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: gid(),
      title: 'FERMENTAÇÃO LENTA',
      content: '8. Transfira a massa para um pote retangular borrifado com água, tampe e leve para a geladeira por até 24 horas.<br>9. Se preferir, divida e boleie antes de levar à geladeira, colocando as porções em potes untados com óleo.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: gid(),
      title: 'ABERTURA E ASSAMENTO',
      content: '10. Polvilhe semolina ou fubá na bancada e abra a massa com as mãos em movimentos circulares suaves, partindo do centro para as bordas.<br>11. Não use rolo — preserve as bolhas de fermentação.<br>12. Adicione o molho de tomate e os ingredientes de sua preferência.<br>13. Leve ao forno preaquecido na temperatura máxima (250–280°C) por 10–15 minutos, até a massa estar dourada.<br>14. Substituto (Forno a lenha): 400–450°C por 90 segundos.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
};

// ── Etapa 2: Porcionamento (bolas de massa) ───────────────────────
// 1.015 kg de massa → 2 bolas de ~500g
const prep2 = {
  id: gid(),
  title: '2ª Etapa: Porcionamento (Bolas de Massa)',
  processes: ['portioning'],
  ingredients: [],
  sub_components: [
    {
      id: gid(),
      type: 'preparation',
      source_id: etapa1Id,
      name: prep1.title,
      assembly_weight_kg: '0.500',  // 500g por bola de massa
      yield_weight: 0,
      total_cost: 0,
    },
  ],
  assembly_config: {
    container_type: 'unidade',
    unit_type: 'kg',
    units_quantity: '2',        // rende 2 bolas de 500g
    total_weight: '1.015',
    notes: 'Cada bola de 500g é suficiente para uma pizza redonda de 30–35cm.',
  },
  notes: [
    {
      id: gid(),
      title: 'PORCIONAMENTO',
      content: '1. Divida a massa em 2 porções de aproximadamente 500g.<br>2. Boleie cada porção fazendo movimentos circulares sobre a bancada, criando tensão superficial.<br>3. Coloque em potes untados com óleo e leve à geladeira por 24 horas antes de usar.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
};

// ── Payload da receita ────────────────────────────────────────────
const recipePayload = {
  name: 'Massa de Pizza Napolitana',
  category: 'Massas',
  category_id: '',
  type: 'receitas',
  prep_time: 180,           // 3h de dobras
  production_time: 1440,    // 24h de fermentação na geladeira
  portion_size: 500,        // 500g por bola de massa
  video_url: '',
  notes: 'Receita de massa de pizza napolitana com fermentação lenta (até 24h) usando fermento natural. Hidratação de 70%. Rende 2 bolas de 500g.',
  // Controle de Qualidade
  shelf_life: '24 horas refrigerada (crua); 5 dias congelada',
  storage_temperature: 'Refrigerada entre 2°C e 4°C',
  allergens: 'Glúten (trigo). Pode conter traços de ovos e leite conforme ambiente de produção.',
  ccp_notes: 'Temperatura interna mínima de cocção: 85°C. Verificar regularmente a temperatura de fermentação. Não usar massa com odor ácido forte ou alteração de cor.',
  preparations: [prep1, prep2],
};

// ── POST para a API ───────────────────────────────────────────────
async function main() {
  console.log('🍕 Criando receita: Massa de Pizza Napolitana...\n');

  const res = await fetch('http://localhost:3000/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipePayload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API retornou ${res.status}: ${err}`);
  }

  const json = await res.json();
  const newId = json.data?.id || json.id;
  console.log(`✅ Receita criada! ID: ${newId}`);

  // Gerar código sequencial
  const snap = await getDocsFromServer(collection(db, 'Recipe'));
  const allCodes = snap.docs.map(d => d.data().code).filter(Boolean);
  const code = generateRecipeCode('MAS', allCodes); // Prefixo MAS de Massa

  await updateDoc(doc(db, 'Recipe', newId), {
    code,
    active: true,
    status: 'active',
    updatedAt: new Date(),
  });

  console.log(`✅ Código gerado: ${code}`);
  console.log(`\n📋 Resumo:`);
  console.log(`   Nome    : Massa de Pizza Napolitana`);
  console.log(`   Código  : ${code}`);
  console.log(`   Rendimento: 2 bolas de 500g (~1.015 kg total)`);
  console.log(`   Etapas  : 2 (Preparo + Porcionamento)`);
  console.log(`   Status  : Ativo ✅`);
  process.exit(0);
}

main().catch(e => { console.error('❌ Erro:', e.message); process.exit(1); });
