import { Ingredient, PriceHistory } from '../app/api/entities.js';

async function fixRealism() {
  console.log('🚚 APLICANDO REALISMO LOGÍSTICO (FORNECEDORES E DATAS)...');

  const supplierMapping = {
    'Hortifruti': ['Ceasa Regional', 'Hortifruti do Bairro', 'Distribuidora Verde Vida'],
    'Proteínas': ['Frigorífico Real', 'Swift Business', 'Distribuidora Boi Gordo'],
    'Laticínios': ['Laticínios de Ouro', 'Mega G Atacado', 'Distribuidora de Frios'],
    'Condimentos': ['Atacadão dos Insumos', 'Distribuidora Central', 'Assaí Negócios'],
    'Temperos': ['Empório das Especiarias', 'Distribuidora Giro', 'Mercado Municipal'],
    'Mercearia': ['Atacadão', 'Assaí', 'Distribuidora Geral'],
    'default': ['Fornecedor Geral']
  };

  try {
    const ingredients = await Ingredient.list();
    const histories = await PriceHistory.list();

    for (const ing of ingredients) {
      const category = ing.category || 'default';
      const possibleSuppliers = supplierMapping[category] || supplierMapping['default'];
      
      // Escolha determinística baseada no ID para consistência
      const supplierIndex = Math.abs(ing.id.charCodeAt(0)) % possibleSuppliers.length;
      const supplierName = possibleSuppliers[supplierIndex];

      // Gerar uma data de "Última Atualização" nos últimos 15 dias (não todos hoje)
      const daysAgo = Math.floor(Math.random() * 15);
      const lastUpdateDate = new Date();
      lastUpdateDate.setDate(lastUpdateDate.getDate() - daysAgo);
      const lastUpdateStr = lastUpdateDate.toISOString().split('T')[0];

      console.log(`🚚 ${ing.name} -> Fornecedor: ${supplierName} | Data: ${lastUpdateStr}`);

      // Atualizar ingrediente
      await Ingredient.update(ing.id, {
        main_supplier: supplierName,
        displaySupplier: supplierName,
        last_update: lastUpdateStr
      });

      // Atualizar o registro de histórico mais recente para bater com a data do ingrediente
      const ingHistories = histories
        .filter(h => h.ingredient_id === ing.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (ingHistories.length > 0) {
        // O registro mais recente (índice 0) assume a data de última atualização
        await PriceHistory.update(ingHistories[0].id, {
          date: lastUpdateStr,
          supplier: supplierName
        });
      }
    }

    console.log('✅ LOGÍSTICA CORRIGIDA! Fornecedores coerentes e datas escalonadas.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

fixRealism();
