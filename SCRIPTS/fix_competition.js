import { Ingredient, PriceHistory, Supplier } from '../app/api/entities.js';

async function fixCompetition() {
  console.log('⚖️ Balanceando concorrência e fornecedores...');

  try {
    const ingredients = await Ingredient.list();
    const histories = await PriceHistory.list();
    const suppliers = await Supplier.list();

    if (suppliers.length < 2) {
      console.log('⚠️ Poucos fornecedores para gerar concorrência.');
      process.exit(0);
    }

    for (const ing of ingredients) {
      const ingHistories = histories.filter(h => h.ingredient_id === ing.id);
      
      if (ingHistories.length === 0) continue;

      // Escolher um dos registros de histórico para ser o "Preço Atual" aleatoriamente
      // Isso garante que os fornecedores variem na lista principal
      const randomIndex = Math.floor(Math.random() * ingHistories.length);
      const chosenRecord = ingHistories[randomIndex];
      
      const supplier = suppliers.find(s => s.id === chosenRecord.supplier_id);
      
      if (supplier) {
        console.log(`📍 Atualizando ${ing.name}: Fornecedor Atual -> ${supplier.name}`);
        
        await Ingredient.update(ing.id, {
          current_price: chosenRecord.price,
          main_supplier: supplier.name,
          last_update: new Date()
        });

        // Garantir que esse registro escolhido tenha a data mais recente no histórico
        await PriceHistory.update(chosenRecord.id, {
          date: new Date()
        });
      }
    }

    console.log('✨ CONCORRÊNCIA AJUSTADA! Agora os fornecedores estão variados.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no ajuste:', error);
    process.exit(1);
  }
}

fixCompetition();
