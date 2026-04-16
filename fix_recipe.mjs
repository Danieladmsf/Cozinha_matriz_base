/**
 * Atualiza os pesos dos ingredientes da ficha do Hambúrguer com perdas reais:
 * - Limpeza: remoção de gordura excessiva e nervos
 * - Cocção (chapa): perda de umidade e gordura no calor
 */
import { db } from './lib/firebase.js';
import { doc, getDoc, updateDoc } from "firebase/firestore";

const RECIPE_ID = 'rFaWQRjxaVsc83VQ06QN';

// Tabela de perdas reais por ingrediente
// Perda limpeza (% do bruto que é descartado na limpeza)
// Perda cocção (% do pré-cocção que é perdido na chapa)
const LOSSES = {
  'Carne Moída - Acém':       { cleanLoss: 0.05, cookLoss: 0.25 }, // 5% limpeza (gordura/nervo), 25% na chapa
  'Carne Moída - Fraldinha':  { cleanLoss: 0.03, cookLoss: 0.22 }, // 3% limpeza, 22% na chapa
  'Sal Refinado':              { cleanLoss: 0.00, cookLoss: 0.00 }, // sem perda
  'Pimenta do Reino':          { cleanLoss: 0.00, cookLoss: 0.00 }, // sem perda
};

function applyLosses(name, weightRaw) {
  const loss = LOSSES[name] || { cleanLoss: 0, cookLoss: 0 };

  const weightClean      = weightRaw * (1 - loss.cleanLoss);         // pós limpeza
  const weightPreCooking = weightClean;                               // pré-cocção = pós limpeza
  const weightCooked     = weightPreCooking * (1 - loss.cookLoss);   // pós chapa

  return {
    weight_raw:         weightRaw,
    weight_clean:       parseFloat(weightClean.toFixed(5)),
    weight_pre_cooking: parseFloat(weightPreCooking.toFixed(5)),
    weight_cooked:      parseFloat(weightCooked.toFixed(5)),
    quantity:           weightRaw,
  };
}

async function fixIngredientLosses() {
  console.log(`📥 Carregando receita ${RECIPE_ID}...`);
  const snap = await getDoc(doc(db, 'Recipe', RECIPE_ID));
  if (!snap.exists()) { console.error('Receita não encontrada!'); process.exit(1); }

  const data = snap.data();
  const preparations = data.preparations || [];

  const updatedPreparations = preparations.map(prep => {
    // Só atualiza a etapa de blend (etapa com ingredientes, não a de porcionamento)
    if (!prep.ingredients || prep.ingredients.length === 0) return prep;

    const updatedIngredients = prep.ingredients.map(ing => {
      const lossData = applyLosses(ing.name, parseFloat(ing.weight_raw) || 0);
      if (lossData.weight_raw === 0) return ing; // skip se sem peso

      console.log(`  ✏️  ${ing.name}:`);
      console.log(`       Bruto: ${lossData.weight_raw} kg`);
      console.log(`       Pós limpeza: ${lossData.weight_clean} kg  (${((1 - lossData.weight_clean/lossData.weight_raw)*100).toFixed(1)}% de perda)`);
      console.log(`       Pós chapa: ${lossData.weight_cooked} kg  (${((1 - lossData.weight_cooked/lossData.weight_pre_cooking)*100).toFixed(1)}% de perda)`);
      console.log(`       Rendimento total: ${(lossData.weight_cooked/lossData.weight_raw*100).toFixed(1)}%`);

      return { ...ing, ...lossData };
    });

    return { ...prep, ingredients: updatedIngredients };
  });

  await updateDoc(doc(db, 'Recipe', RECIPE_ID), {
    preparations: updatedPreparations,
    updatedAt: new Date()
  });

  console.log('\n✅ Perdas aplicadas com sucesso!');
  process.exit(0);
}

fixIngredientLosses().catch(e => { console.error(e); process.exit(1); });
