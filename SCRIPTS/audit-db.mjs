/**
 * Script de Auditoria Direta do Firestore
 * Acessa as coleções Recipe e Ingredient e verifica integridade
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

const p = (v) => {
  if (v === undefined || v === null || v === '') return 0;
  return parseFloat(String(v).replace(',', '.')) || 0;
};

async function audit() {
  console.log('='.repeat(60));
  console.log('  AUDITORIA DO BANCO DE DADOS FIRESTORE');
  console.log('  ' + new Date().toLocaleString('pt-BR'));
  console.log('='.repeat(60));

  // ---- 1. Carregar coleções ----
  const recipesSnap = await getDocs(collection(db, 'Recipe'));
  const ingredientsSnap = await getDocs(collection(db, 'Ingredient'));

  const recipes = [];
  recipesSnap.forEach(doc => recipes.push({ id: doc.id, ...doc.data() }));

  const ingredients = [];
  ingredientsSnap.forEach(doc => ingredients.push({ id: doc.id, ...doc.data() }));

  console.log(`\n📊 Total: ${recipes.length} receitas | ${ingredients.length} ingredientes\n`);

  // ---- 2. Verificar duplicação de ingredientes ----
  console.log('─'.repeat(60));
  console.log('🔍 INGREDIENTES DUPLICADOS');
  console.log('─'.repeat(60));
  const ingMap = new Map();
  ingredients.forEach(i => {
    const key = (i.name || '').trim().toLowerCase();
    if (!key) return;
    if (!ingMap.has(key)) ingMap.set(key, []);
    ingMap.get(key).push(i);
  });

  let dupCount = 0;
  ingMap.forEach((items, name) => {
    if (items.length > 1) {
      dupCount++;
      console.log(`  ⚠️  "${name}" → ${items.length} cópias`);
      items.forEach(i => console.log(`      ID: ${i.id} | Preço: ${i.current_price}`));
    }
  });
  if (dupCount === 0) console.log('  ✅ Nenhum ingrediente duplicado!');

  // ---- 3. Verificar duplicação de receitas ----
  console.log('\n' + '─'.repeat(60));
  console.log('🔍 RECEITAS DUPLICADAS');
  console.log('─'.repeat(60));
  const recMap = new Map();
  recipes.forEach(r => {
    const key = (r.name || r.title || '').trim().toLowerCase();
    if (!key) return;
    if (!recMap.has(key)) recMap.set(key, []);
    recMap.get(key).push(r);
  });

  let recDupCount = 0;
  recMap.forEach((items, name) => {
    if (items.length > 1) {
      recDupCount++;
      console.log(`  ⚠️  "${name}" → ${items.length} cópias`);
      items.forEach(i => console.log(`      ID: ${i.id}`));
    }
  });
  if (recDupCount === 0) console.log('  ✅ Nenhuma receita duplicada!');

  // ---- 4. Strings fantasmas em ingredientes ----
  console.log('\n' + '─'.repeat(60));
  console.log('👻 STRINGS FANTASMAS (Ingredientes)');
  console.log('─'.repeat(60));
  const ghostPatterns = [/undefined/i, /null/i, /NaN/, /\[object/, /^\s+$/, /^0\d/];
  let ghostCount = 0;

  ingredients.forEach(ing => {
    const fields = ['name', 'current_price', 'category', 'unit'];
    fields.forEach(f => {
      const val = String(ing[f] || '');
      for (const pat of ghostPatterns) {
        if (pat.test(val)) {
          ghostCount++;
          console.log(`  👻 Ingrediente [${ing.id}] "${ing.name}" → campo "${f}" = "${val}"`);
          break;
        }
      }
    });

    // Nome vazio
    if (!ing.name || ing.name.trim() === '') {
      ghostCount++;
      console.log(`  👻 Ingrediente [${ing.id}] → NOME VAZIO!`);
    }

    // Preço negativo
    const price = p(ing.current_price);
    if (price < 0) {
      ghostCount++;
      console.log(`  👻 Ingrediente [${ing.id}] "${ing.name}" → PREÇO NEGATIVO: ${ing.current_price}`);
    }
  });
  if (ghostCount === 0) console.log('  ✅ Nenhuma string fantasma nos ingredientes!');

  // ---- 5. Strings fantasmas e inconsistências nas receitas ----
  console.log('\n' + '─'.repeat(60));
  console.log('👻 STRINGS FANTASMAS (Dentro das Receitas)');
  console.log('─'.repeat(60));
  let recGhostCount = 0;

  recipes.forEach(recipe => {
    const rName = recipe.name || recipe.title || 'SEM NOME';
    const preps = recipe.preparations || [];

    // Receita sem preparações
    if (preps.length === 0) {
      recGhostCount++;
      console.log(`  ⚠️  Receita "${rName}" [${recipe.id}] → SEM ETAPAS/PREPARAÇÕES`);
    }

    preps.forEach((prep, pi) => {
      const ings = prep.ingredients || [];
      ings.forEach((ing, ii) => {
        const iName = ing.name || 'SEM NOME';
        const weightFields = ['weight_raw', 'weight_clean', 'weight_pre_cooking', 'weight_cooked', 'weight_frozen', 'weight_thawed', 'current_price'];

        weightFields.forEach(f => {
          if (ing[f] !== undefined && ing[f] !== null) {
            const val = String(ing[f]);
            for (const pat of ghostPatterns) {
              if (pat.test(val)) {
                recGhostCount++;
                console.log(`  👻 "${rName}" > Etapa ${pi + 1} > "${iName}" → ${f} = "${val}"`);
                break;
              }
            }
          }
        });

        // Ingrediente sem nome
        if (!ing.name || ing.name.trim() === '') {
          recGhostCount++;
          console.log(`  👻 "${rName}" > Etapa ${pi + 1} > Ingrediente[${ii}] → NOME VAZIO`);
        }
      });
    });
  });
  if (recGhostCount === 0) console.log('  ✅ Nenhuma string fantasma nas receitas!');

  // ---- 6. Detalhe específico: "Arroz Branco" ----
  console.log('\n' + '='.repeat(60));
  console.log('📋 DETALHE: RECEITA "ARROZ BRANCO" (verificação manual)');
  console.log('='.repeat(60));

  const arrozRecipe = recipes.find(r => (r.name || r.title || '').toLowerCase().includes('arroz branco'));
  if (!arrozRecipe) {
    console.log('  ❌ Receita "Arroz Branco" NÃO encontrada no banco!');
  } else {
    console.log(`  ID: ${arrozRecipe.id}`);
    console.log(`  Nome: ${arrozRecipe.name || arrozRecipe.title}`);
    console.log(`  Categoria: ${arrozRecipe.category || 'N/A'}`);
    console.log(`  total_weight (salvo): ${arrozRecipe.total_weight}`);
    console.log(`  yield_weight (salvo): ${arrozRecipe.yield_weight}`);
    console.log(`  total_cost (salvo): ${arrozRecipe.total_cost}`);
    console.log(`  cost_per_kg_raw (salvo): ${arrozRecipe.cost_per_kg_raw}`);
    console.log(`  cost_per_kg_yield (salvo): ${arrozRecipe.cost_per_kg_yield}`);

    const preps = arrozRecipe.preparations || [];
    console.log(`\n  Etapas: ${preps.length}`);

    preps.forEach((prep, pi) => {
      console.log(`\n  --- Etapa ${pi + 1}: "${prep.title || 'sem título'}" ---`);
      console.log(`  Processos: ${(prep.processes || []).join(', ')}`);

      const ings = prep.ingredients || [];
      console.log(`  Ingredientes: ${ings.length}`);

      ings.forEach((ing, ii) => {
        console.log(`\n    [${ii}] ${ing.name || 'SEM NOME'}`);
        console.log(`        current_price: ${ing.current_price}`);
        console.log(`        weight_raw: ${ing.weight_raw}`);
        console.log(`        weight_clean: ${ing.weight_clean}`);
        console.log(`        weight_pre_cooking: ${ing.weight_pre_cooking}`);
        console.log(`        weight_cooked: ${ing.weight_cooked}`);
        console.log(`        ingredient_id: ${ing.ingredient_id || 'N/A'}`);
      });

      // Notas
      const notes = prep.notes || [];
      if (notes.length > 0) {
        console.log(`\n  Notas: ${notes.length}`);
        notes.forEach((n, ni) => {
          const preview = (n.content || '').replace(/<[^>]*>/g, '').substring(0, 80);
          console.log(`    [${ni}] "${n.title || 'sem título'}" → "${preview}..."`);
        });
      }
    });
  }

  // ---- RESUMO FINAL ----
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(60));
  console.log(`  Ingredientes duplicados: ${dupCount}`);
  console.log(`  Receitas duplicadas: ${recDupCount}`);
  console.log(`  Strings fantasmas (ingredientes): ${ghostCount}`);
  console.log(`  Strings fantasmas (receitas): ${recGhostCount}`);
  console.log(`  TOTAL DE PROBLEMAS: ${dupCount + recDupCount + ghostCount + recGhostCount}`);
  console.log('='.repeat(60));

  process.exit(0);
}

audit().catch(err => {
  console.error('❌ Erro na auditoria:', err);
  process.exit(1);
});
