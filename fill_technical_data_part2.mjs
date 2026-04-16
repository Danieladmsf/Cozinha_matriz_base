/**
 * Parte 2: Preenche os 31 ingredientes restantes sem mapeamento
 * e aciona a propagação para todas as receitas existentes.
 */
import { db } from './lib/firebase.js';
import { collection, getDocsFromServer, doc, updateDoc } from "firebase/firestore";

// Mapeamento manual dos itens restantes
// key = nome exato do ingrediente no banco (case-insensitive)
const MANUAL_MAP = {
  // ── AÇÚCARES ──────────────────────────────────────────────────
  'açúcar mascavo':         { thaw: 0, clean: 0, cook: 0,   time: 0   },
  'açúcar refinado':        { thaw: 0, clean: 0, cook: 0,   time: 0   },
  'açúcar cristal':         { thaw: 0, clean: 0, cook: 0,   time: 0   },

  // ── CARNES PROCESSADAS ────────────────────────────────────────
  'calabresa defumada':     { thaw: 0, clean: 5,  cook: 25, time: 60  },
  'chouriço':               { thaw: 0, clean: 5,  cook: 25, time: 60  },
  'salsicha':               { thaw: 0, clean: 0,  cook: 20, time: 30  },
  'presunto de parma':      { thaw: 0, clean: 0,  cook: 10, time: 0   },
  'presunto':               { thaw: 0, clean: 0,  cook: 10, time: 0   },
  'cupim':                  { thaw: 0, clean: 15, cook: 30, time: 480 }, // muito tecido conectivo e gordura

  // ── LATICÍNIOS (sem "queijo" no nome) ─────────────────────────
  'muçarela':               { thaw: 0, clean: 0,  cook: 20, time: 60  },
  'muçarela de búfala':     { thaw: 0, clean: 0,  cook: 15, time: 60  },
  'cheddar fatiado':        { thaw: 0, clean: 0,  cook: 20, time: 30  },
  'requeijão cremoso':      { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'requijão cremoso':       { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'parmesão ralado':        { thaw: 0, clean: 0,  cook: 20, time: 0   },

  // ── ERVAS E TEMPEROS ──────────────────────────────────────────
  'cheiro verde':           { thaw: 0, clean: 15, cook: 15, time: 60  }, // mix salsinha+cebolinha
  'colorau':                { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'colorífico':             { thaw: 0, clean: 0,  cook: 0,  time: 0   },

  // ── CONDIMENTOS PRONTOS ───────────────────────────────────────
  'ketchup':                { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'maionese':               { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'mostarda':               { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'mostarda amarela':       { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'molho inglês':           { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'molho shoyu':            { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'shoyu':                  { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'vinagre':                { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'molho inglês':           { thaw: 0, clean: 0,  cook: 0,  time: 0   },

  // ── FERMENTOS E LEVEDURAS ─────────────────────────────────────
  'fermento biológico seco':{ thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'fermento químico':       { thaw: 0, clean: 0,  cook: 0,  time: 0   },

  // ── PÃES ──────────────────────────────────────────────────────
  'pão de brioche':         { thaw: 0, clean: 0,  cook: 5,  time: 0   }, // tostar seca um pouco
  'pão de hambúrguer':      { thaw: 0, clean: 0,  cook: 5,  time: 0   },
  'pão francês':            { thaw: 0, clean: 0,  cook: 5,  time: 0   },
  'pão de forma':           { thaw: 0, clean: 0,  cook: 5,  time: 0   },

  // ── EMBALAGENS E DESCARTÁVEIS (sem perda técnica) ─────────────
  'caixa de pizza':         { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'copo descartável 200ml': { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'embalagem para fritas':  { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'embalagem batata assada':{ thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'garfo x faca':           { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'marmitex 1200ml':        { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'marmitex 500ml':         { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'marmitex 750ml':         { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'papel acoplado lanche':  { thaw: 0, clean: 0,  cook: 0,  time: 0   },
  'saco kraft lanche':      { thaw: 0, clean: 0,  cook: 0,  time: 0   },
};

function normalize(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function findManual(name) {
  const n = normalize(name);
  for (const [key, val] of Object.entries(MANUAL_MAP)) {
    if (normalize(key) === n) return val;
  }
  // Partial match como fallback
  for (const [key, val] of Object.entries(MANUAL_MAP)) {
    if (n.includes(normalize(key)) || normalize(key).includes(n)) return val;
  }
  return null;
}

async function callPropagationAPI(ingredientId, ingredient) {
  try {
    const res = await fetch(`http://localhost:3000/api/ingredients/propagate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredient_id: ingredientId, ingredient })
    });
    if (!res.ok) return { count: 0 };
    return await res.json();
  } catch {
    return { count: 0 };
  }
}

async function main() {
  console.log('📥 Carregando todos os ingredientes...');
  const snap = await getDocsFromServer(collection(db, 'Ingredient'));

  const ingredients = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(i => i.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`\n📦 ${ingredients.length} ingredientes ativos.\n`);

  // ── PASSO 1: Preencher os sem mapeamento ─────────────────────
  console.log('═══════════════════════════════════════');
  console.log('PASSO 1: Preenchendo ingredientes restantes');
  console.log('═══════════════════════════════════════\n');

  let filled = 0;
  const withoutTech = ingredients.filter(i => {
    const td = i.technical_data || {};
    return !td.cleaning_loss_pct && !td.cooking_loss_pct && !td.thawing_loss_pct;
  });

  for (const ing of withoutTech) {
    const tech = findManual(ing.name);
    if (!tech) {
      console.log(`⚠️  SEM DADOS: ${ing.name}`);
      continue;
    }

    await updateDoc(doc(db, 'Ingredient', ing.id), {
      technical_data: {
        thawing_loss_pct:     tech.thaw,
        cleaning_loss_pct:    tech.clean,
        cooking_loss_pct:     tech.cook,
        cleaning_time_per_kg: tech.time,
      },
      updatedAt: new Date()
    });

    const cookLabel = tech.cook < 0
      ? `⬆ +${Math.abs(tech.cook)}% absorção`
      : `⬇ ${tech.cook}%`;
    console.log(`✅ ${ing.name} — Descongelamento: ${tech.thaw}% | Limpeza: ${tech.clean}% | Cocção: ${cookLabel} | Tempo: ${tech.time/60}min/kg`);
    filled++;
  }

  console.log(`\n✅ ${filled} ingredientes preenchidos nesta rodada.`);

  // ── PASSO 2: Propagar todos os técnicos para as receitas ──────
  console.log('\n═══════════════════════════════════════');
  console.log('PASSO 2: Propagando para todas as receitas');
  console.log('═══════════════════════════════════════\n');

  // Recarregar ingredientes com dados novos
  const snap2 = await getDocsFromServer(collection(db, 'Ingredient'));
  const allIngredients = snap2.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(i => {
      const td = i.technical_data || {};
      return (td.cleaning_loss_pct > 0 || td.cooking_loss_pct !== 0 || td.thawing_loss_pct > 0);
    });

  console.log(`🔄 Propagando ${allIngredients.length} ingredientes com dados técnicos...\n`);

  let totalRecipesUpdated = 0;

  for (const ing of allIngredients) {
    const result = await callPropagationAPI(ing.id, ing);
    if (result && result.count > 0) {
      console.log(`📡 ${ing.name} → ${result.count} receita(s) atualizada(s)`);
      totalRecipesUpdated += result.count;
    }
  }

  console.log(`\n══════════════════════════════════════════════`);
  console.log(`✅ Propagação concluída!`);
  console.log(`   Total de atualizações em receitas: ${totalRecipesUpdated}`);
  console.log(`══════════════════════════════════════════════`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
