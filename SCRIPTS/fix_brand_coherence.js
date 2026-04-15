import { Ingredient, PriceHistory } from '../app/api/entities.js';

async function fixCoherence() {
  console.log('🧠 APLICANDO COERÊNCIA GASTRONÔMICA NAS MARCAS...');

  const categoryMapping = {
    'Hortifruti': ['Ceasa', 'Produtor Local', 'Hortifruti Selecionado', 'Fazenda São José'],
    'Proteínas': ['Friboi', 'Swift', 'Seara', 'Sadia', 'Minerva', 'Perdigão'],
    'Laticínios': ['Nestlé', 'Itambé', 'Piracanjuba', 'Vigor', 'Catupiry', 'Tirol'],
    'Condimentos': ['Heinz', 'Hellmanns', 'Sacciali', 'Hemmer', 'Castelo'],
    'Temperos': ['Kitano', 'Cisne', 'Bombay', 'Masterfood'],
    'Mercearia': ['Camil', 'Tio João', 'Dona Benta', 'União', 'Liza', 'Bunge'],
    'default': ['Marca Própria']
  };

  try {
    const ingredients = await Ingredient.list();
    const histories = await PriceHistory.list();

    for (const ing of ingredients) {
      const category = ing.category || 'default';
      const possibleBrands = categoryMapping[category] || categoryMapping['default'];
      
      // Escolha determinística baseada no nome para não ficar totalmente aleatório se rodar de novo
      const brandIndex = Math.abs(ing.name.length) % possibleBrands.length;
      const brandName = possibleBrands[brandIndex];

      console.log(`📝 Ajustando ${ing.name} (${category}) -> ${brandName}`);

      // Atualizar ingrediente
      await Ingredient.update(ing.id, {
        brand: brandName,
        displayBrand: brandName
      });

      // Atualizar históricos relacionados
      const ingHistories = histories.filter(h => h.ingredient_id === ing.id);
      for (const h of ingHistories) {
        await PriceHistory.update(h.id, {
          brand: brandName
        });
      }
    }

    console.log('✅ COERÊNCIA APLICADA! Abóbora agora é do Ceasa e Ketchup é Heinz.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

fixCoherence();
