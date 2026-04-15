import { Ingredient, PriceHistory } from '../app/api/entities.js';

async function sanitize() {
  console.log('🧹 Iniciando limpeza e simplificação de nomes...');

  try {
    const ingredients = await Ingredient.list();
    const priceHistories = await PriceHistory.list();
    
    // Lista de sufixos de "versão" a serem removidos
    const suffixes = [
      ' Galão', ' Balde', ' Maço', ' Inteiro', ' Moído', ' s/ Casca', 
      ' Ninja', ' M Médio', ' em Ralado', ' em Conserva', ' c/ Sal', 
      ' s/ Sal', ' s/ Caroço', ' em Folha', ' em Pó', ' Seco', 
      ' Italiano', ' Americana', ' Crespa', ' Extra Virgem', ' Parboilizado', ' Branco', ' Preto', ' Carioca', ' Ralado'
    ];

    for (const ing of ingredients) {
      let cleanName = ing.name;
      
      // Aplicar limpeza
      suffixes.forEach(suffix => {
        if (cleanName.endsWith(suffix)) {
          cleanName = cleanName.replace(suffix, '');
        }
      });

      // Caso especial: Prevenir nomes vazios ou erros
      if (!cleanName || cleanName === ing.name) continue;

      console.log(`🔄 Simplificando: "${ing.name}" -> "${cleanName}"`);

      // Verificar se o nome simplificado já existe
      const existing = ingredients.find(i => i.name.toLowerCase() === cleanName.toLowerCase() && i.id !== ing.id);

      if (existing) {
        console.log(`🔗 Mesclando "${ing.name}" com "${existing.name}" (ID existente: ${existing.id})`);
        
        // 1. Mover todo o histórico de preço para o ID existente
        const relatedHistory = priceHistories.filter(ph => ph.ingredient_id === ing.id);
        for (const history of relatedHistory) {
          await PriceHistory.update(history.id, { ingredient_id: existing.id });
        }
        
        // 2. Deletar o item "sujo"
        await Ingredient.delete(ing.id);
        console.log(`✅ Mesclagem concluída e item removido.`);
      } else {
        // Apenas renomear
        await Ingredient.update(ing.id, { name: cleanName });
        console.log(`✅ Renomeado com sucesso.`);
      }
    }

    console.log('✨ LIMPEZA FINALIZADA! O banco está com nomes puros.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    process.exit(1);
  }
}

sanitize();
