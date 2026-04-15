import { Ingredient, PriceHistory } from '../app/api/entities.js';

async function nuke() {
  console.log('☢️ INICIANDO LIMPEZA RADICAL (NUKE)...');

  try {
    const ingredients = await Ingredient.list();
    const history = await PriceHistory.list();

    console.log(`🗑️ Removendo ${ingredients.length} ingredientes...`);
    for (const ing of ingredients) {
      await Ingredient.delete(ing.id);
      process.stdout.write('i');
    }

    console.log(`\n🗑️ Removendo ${history.length} registros de histórico...`);
    for (const h of history) {
      await PriceHistory.delete(h.id);
      process.stdout.write('h');
    }

    console.log('\n✨ BANCO DE DADOS 100% LIMPO.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    process.exit(1);
  }
}

nuke();
