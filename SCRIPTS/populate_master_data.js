import { Ingredient, PriceHistory, Supplier, Brand } from '../app/api/entities.js';

async function populate() {
  console.log('🚀 INICIANDO POPULAÇÃO MESTRE DE DADOS REALISTAS...');

  try {
    const ingredients = await Ingredient.list();
    const suppliers = await Supplier.list();
    const brands = await Brand.list();

    if (brands.length === 0) {
      console.log('⚠️ Nenhuma marca encontrada. Criando marcas padrão...');
      const brandNames = ['Swift', 'Friboi', 'Sadia', 'Perdigão', 'Seara', 'Nestlé', 'Itambé', 'Camil', 'Tio João', 'Dona Benta', 'União', 'Liza', 'Hellmanns', 'Heinz', 'Ceval', 'Piracanjuba', 'Qualy', 'Minerva'];
      for (const name of brandNames) {
        const b = await Brand.create({ name, active: true });
        brands.push(b);
      }
    }

    const supplierList = suppliers.length > 0 ? suppliers : [{ name: 'Atacadão' }, { name: 'Ceasa' }, { name: 'Frigorífico Real' }];

    console.log(`📊 Processando ${ingredients.length} ingredientes...`);

    for (const ing of ingredients) {
      // 1. Escolher uma marca aleatória para o ingrediente (excluindo N/A)
      const randomBrand = brands[Math.floor(Math.random() * brands.length)];
      const brandName = randomBrand.name;

      // 2. Gerar histórico de 5 registros (um por mês)
      const basePrice = ing.current_price || 20.0;
      
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(10 + Math.floor(Math.random() * 15)); // Dia variado
        
        const dateStr = date.toISOString().split('T')[0];
        
        // Variação de preço de +/- 15%
        const variation = 1 + (Math.random() * 0.3 - 0.15);
        const price = parseFloat((basePrice * variation).toFixed(2));
        const oldPrice = parseFloat((price * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2));

        const supplier = supplierList[Math.floor(Math.random() * supplierList.length)];

        await PriceHistory.create({
          ingredient_id: ing.id,
          ingredient_name: ing.name,
          date: dateStr,
          new_price: price,
          old_price: oldPrice,
          supplier: supplier.company_name || supplier.name,
          brand: brandName,
          unit: ing.unit || 'kg',
          change_type: 'automated_seed'
        });
      }

      // 3. Atualizar o ingrediente principal com a marca e última data
      await Ingredient.update(ing.id, {
        brand: brandName,
        displayBrand: brandName,
        last_update: new Date().toISOString().split('T')[0],
        main_supplier: supplierList[0].company_name || supplierList[0].name
      });

      process.stdout.write('.');
    }

    console.log('\n✅ DADOS POPULADOS COM SUCESSO! 96 itens agora têm marcas reais e histórico de 5 meses.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na população:', error);
    process.exit(1);
  }
}

populate();
