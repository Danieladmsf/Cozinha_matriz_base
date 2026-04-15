import { Ingredient, PriceHistory } from '../app/api/entities.js';

async function debug() {
  console.log('🔍 Iniciando diagnóstico de dados atualizado...');

  try {
    const ingredients = await Ingredient.list();
    console.log(`📋 Total de ingredientes: ${ingredients.length}`);

    // Procurar itens criados pelo script (os que têm main_supplier definido e não são N/A)
    const seededItems = ingredients.filter(i => i.main_supplier && i.main_supplier !== 'N/A' && i.main_supplier !== 'Carregando...');
    
    console.log('\n🧪 Amostra de ingredientes populados:');
    seededItems.slice(0, 5).forEach(i => {
      console.log(`- ${i.name} (ID: ${i.id})`);
      console.log(`  Categoria: ${i.category}`);
      console.log(`  current_price: ${i.current_price}`);
      console.log(`  main_supplier: ${i.main_supplier}`);
    });

    const prices = await PriceHistory.list();
    console.log(`\n💰 Total de registros de preço: ${prices.length}`);
    
    if (seededItems.length > 0) {
      const firstId = seededItems[0].id;
      const ingPrices = prices.filter(p => p.ingredient_id === firstId);
      console.log(`📊 Preços para ${seededItems[0].name}: ${ingPrices.length} registros`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    process.exit(1);
  }
}

debug();
