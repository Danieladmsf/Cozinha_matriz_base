import { Ingredient, PriceHistory } from '../app/api/entities.js';

async function seedEmbalagens() {
  console.log('📦 INICIANDO CADASTRO DE EMBALAGENS...');

  const embalagens = [
    { name: 'Marmitex 500ml', unit: 'Cento', price: 45.00, brand: 'Wyda' },
    { name: 'Marmitex 750ml', unit: 'Cento', price: 55.00, brand: 'Wyda' },
    { name: 'Marmitex 1200ml', unit: 'Cento', price: 72.00, brand: 'Wyda' },
    { name: 'Saco Kraft Lanche', unit: 'Cento', price: 25.50, brand: 'Klabin' },
    { name: 'Embalagem para Fritas', unit: 'Cento', price: 35.00, brand: 'Papelex' },
    { name: 'Papel Acoplado Lanche', unit: 'Cento', price: 18.00, brand: 'Papelex' },
    { name: 'Garfo x Faca', unit: 'Cento', price: 32.50, brand: 'Galo' },
    { name: 'Copo Descartável 200ml', unit: 'Cento', price: 12.50, brand: 'Copobras' },
    { name: 'Caixa de Pizza', unit: 'Un', price: 2.50, brand: 'Klabin' },
    { name: 'Embalagem Batata Assada', unit: 'Cento', price: 48.00, brand: 'Wyda' }
  ];

  const suppliers = ['Embalagens Central', 'Papeleira São João', 'Distribuidora Premium Pack'];

  try {
    for (const item of embalagens) {
      const mainSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];

      const lastUpdateOrig = new Date();
      lastUpdateOrig.setDate(lastUpdateOrig.getDate() - Math.floor(Math.random() * 10));
      const lastUpdateStr = lastUpdateOrig.toISOString().split('T')[0];

      // Criar a Embalagem
      const ing = await Ingredient.create({
        name: item.name,
        unit: item.unit,
        category: 'Embalagens', // Pode ser útil manter a string igual
        item_type: 'embalagem', // <--- CRÍTICO para cair na aba certa
        current_price: item.price,
        main_supplier: mainSupplier,
        brand: item.brand,
        displayBrand: item.brand,
        displaySupplier: mainSupplier,
        last_update: lastUpdateStr,
        active: true,
        ingredient_type: 'packaging' // Caso use essa notação em backend
      });

      console.log(`✅ Embalagem criada: ${item.name}`);

      // Gerar o Histórico
      for (let i = 0; i < 5; i++) {
        const histDate = new Date();
        histDate.setMonth(histDate.getMonth() - i);
        histDate.setDate(5 + Math.floor(Math.random() * 20));
        const histDateStr = histDate.toISOString().split('T')[0];

        // Simulando variação de preço (+/- 5%) das embalagens
        const variation = 1 + (Math.random() * 0.1 - 0.05);
        const newP = parseFloat((item.price * variation).toFixed(2));
        const oldP = parseFloat((newP * 1.03).toFixed(2));

        const histSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];

        await PriceHistory.create({
          ingredient_id: ing.id,
          ingredient_name: ing.name,
          date: histDateStr,
          new_price: newP,
          old_price: oldP,
          supplier: histSupplier,
          brand: item.brand,
          unit: item.unit,
          change_type: 'automated_seed_embalagens'
        });
      }
    }

    console.log('🌟 EMBALAGENS CADASTRADAS COM SUCESSO! 🌟');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no cadastro:', error);
    process.exit(1);
  }
}

seedEmbalagens();
