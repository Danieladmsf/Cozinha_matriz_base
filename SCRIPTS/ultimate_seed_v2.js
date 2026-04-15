import { Ingredient, PriceHistory } from '../app/api/entities.js';

async function seed() {
  console.log('🏗️ INICIANDO RECONSTRUÇÃO MESTRE DA MATRIZ DE INSUMOS...');

  const mappings = {
    'Hortifruti': {
      brands: ['Ceasa', 'Produtor Local', 'Hortifruti Selecionado', 'Fazenda São José'],
      suppliers: ['Ceasa Regional', 'Hortifruti do Bairro', 'Distribuidora Verde Vida']
    },
    'Proteínas': {
      brands: ['Friboi', 'Swift', 'Seara', 'Sadia', 'Minerva', 'Perdigão'],
      suppliers: ['Frigorífico Real', 'Swift Business', 'Distribuidora Boi Gordo']
    },
    'Laticínios': {
      brands: ['Nestlé', 'Itambé', 'Piracanjuba', 'Vigor', 'Catupiry', 'Tirol'],
      suppliers: ['Laticínios de Ouro', 'Mega G Atacado', 'Distribuidora de Frios']
    },
    'Temperos': {
      brands: ['Kitano', 'Cisne', 'Bombay', 'Masterfood'],
      suppliers: ['Empório das Especiarias', 'Distribuidora Giro', 'Mercado Municipal']
    },
    'Condimentos': {
      brands: ['Heinz', 'Hellmanns', 'Sacciali', 'Hemmer', 'Castelo'],
      suppliers: ['Atacadão dos Insumos', 'Distribuidora Central', 'Assaí Negócios']
    },
    'Mercearia': {
      brands: ['Camil', 'Tio João', 'Dona Benta', 'União', 'Liza', 'Bunge'],
      suppliers: ['Atacadão', 'Assaí', 'Distribuidora Geral']
    }
  };

  const matrix = [
    // Proteínas
    { name: 'Acém', unit: 'Kg', category: 'Proteínas', price: 17.85 },
    { name: 'Alcatra', unit: 'Kg', category: 'Proteínas', price: 20.37 },
    { name: 'Patinho', unit: 'Kg', category: 'Proteínas', price: 25.41 },
    { name: 'Contra-filé', unit: 'Kg', category: 'Proteínas', price: 25.97 },
    { name: 'Filé Mignon', unit: 'Kg', category: 'Proteínas', price: 32.65 },
    { name: 'Picanha', unit: 'Kg', category: 'Proteínas', price: 41.67 },
    { name: 'Músculo', unit: 'Kg', category: 'Proteínas', price: 43.04 },
    { name: 'Costela Bovina', unit: 'Kg', category: 'Proteínas', price: 37.47 },
    { name: 'Cupim', unit: 'Kg', category: 'Proteínas', price: 9.36 },
    { name: 'Peito de Frango', unit: 'Kg', category: 'Proteínas', price: 33.32 },
    { name: 'Sobrecoxa de Frango', unit: 'Kg', category: 'Proteínas', price: 53.01 },
    { name: 'Coração de Frango', unit: 'Kg', category: 'Proteínas', price: 8.52 },
    { name: 'Asa de Frango', unit: 'Kg', category: 'Proteínas', price: 40.21 },
    { name: 'Pernil Suíno', unit: 'Kg', category: 'Proteínas', price: 6.75 },
    { name: 'Costela Suína', unit: 'Kg', category: 'Proteínas', price: 15.28 },
    { name: 'Lombo Suíno', unit: 'Kg', category: 'Proteínas', price: 6.02 },
    { name: 'Filé de Salmão', unit: 'Kg', category: 'Proteínas', price: 23.49 },
    { name: 'Filé de Tilápia', unit: 'Kg', category: 'Proteínas', price: 8.11 },
    { name: 'Camarão', unit: 'Kg', category: 'Proteínas', price: 47.11 },
    { name: 'Anéis de Lula', unit: 'Kg', category: 'Proteínas', price: 9.42 },

    // Hortifruti
    { name: 'Alho', unit: 'Kg', category: 'Hortifruti', price: 17.33 },
    { name: 'Cebola', unit: 'Kg', category: 'Hortifruti', price: 11.57 },
    { name: 'Batata Inglesa', unit: 'Kg', category: 'Hortifruti', price: 7.90 },
    { name: 'Cenoura', unit: 'Kg', category: 'Hortifruti', price: 10.13 },
    { name: 'Tomate', unit: 'Kg', category: 'Hortifruti', price: 14.40 },
    { name: 'Pimentão Verde', unit: 'Kg', category: 'Hortifruti', price: 30.49 },
    { name: 'Pimentão Vermelho', unit: 'Kg', category: 'Hortifruti', price: 10.19 },
    { name: 'Pimentão Amarelo', unit: 'Kg', category: 'Hortifruti', price: 31.77 },
    { name: 'Abobrinha Italiana', unit: 'Kg', category: 'Hortifruti', price: 37.23 },
    { name: 'Abóbora Cabotiá', unit: 'Kg', category: 'Hortifruti', price: 33.17 },
    { name: 'Chuchu', unit: 'Kg', category: 'Hortifruti', price: 5.89 },
    { name: 'Berinjela', unit: 'Kg', category: 'Hortifruti', price: 50.69 },
    { name: 'Mandioca', unit: 'Kg', category: 'Hortifruti', price: 31.61 },
    { name: 'Gengibre', unit: 'Kg', category: 'Hortifruti', price: 34.18 },
    { name: 'Brócolis', unit: 'Un', category: 'Hortifruti', price: 32.37 },
    { name: 'Couve-flor', unit: 'Un', category: 'Hortifruti', price: 42.45 },
    { name: 'Alface', unit: 'Un', category: 'Hortifruti', price: 38.23 },
    { name: 'Rúcula', unit: 'Un', category: 'Hortifruti', price: 34.28 },
    { name: 'Espinafre', unit: 'Un', category: 'Hortifruti', price: 28.30 },
    { name: 'Couve Manteiga', unit: 'Un', category: 'Hortifruti', price: 26.75 },
    { name: 'Cheiro Verde', unit: 'Un', category: 'Hortifruti', price: 40.26 },

    // Laticínios
    { name: 'Leite Integral', unit: 'L', category: 'Laticínios', price: 5.36 },
    { name: 'Creme de Leite', unit: 'Kg', category: 'Laticínios', price: 21.76 },
    { name: 'Leite Condensado', unit: 'Kg', category: 'Laticínios', price: 42.29 },
    { name: 'Manteiga Sem Sal', unit: 'Kg', category: 'Laticínios', price: 33.13 },
    { name: 'Queijo Muçarela', unit: 'Kg', category: 'Laticínios', price: 7.95 },
    { name: 'Queijo Prato', unit: 'Kg', category: 'Laticínios', price: 20.92 },
    { name: 'Queijo Parmesão', unit: 'Kg', category: 'Laticínios', price: 14.44 },
    { name: 'Requijão Cremoso', unit: 'Kg', category: 'Laticínios', price: 26.33 },

    // Temperos / Condimentos
    { name: 'Sal Refinado', unit: 'Kg', category: 'Mercearia', price: 33.11 },
    { name: 'Pimenta do Reino', unit: 'Kg', category: 'Temperos', price: 19.47 },
    { name: 'Chimichurri', unit: 'Kg', category: 'Temperos', price: 25.85 },
    { name: 'Colorau', unit: 'Kg', category: 'Temperos', price: 17.10 },
    { name: 'Páprica Doce', unit: 'Kg', category: 'Temperos', price: 6.63 },
    { name: 'Páprica Defumada', unit: 'Kg', category: 'Temperos', price: 24.94 },
    { name: 'Cominho', unit: 'Kg', category: 'Temperos', price: 33.78 },
    { name: 'Louro', unit: 'Un', category: 'Temperos', price: 12.63 },
    { name: 'Manjericão', unit: 'Kg', category: 'Temperos', price: 42.31 },
    { name: 'Orégano', unit: 'Kg', category: 'Temperos', price: 44.53 },
    { name: 'Canela', unit: 'Kg', category: 'Temperos', price: 13.49 },
    { name: 'Cravo da Índia', unit: 'Kg', category: 'Temperos', price: 12.51 },
    { name: 'Noz Moscada', unit: 'Un', category: 'Temperos', price: 23.36 },
    { name: 'Ketchup', unit: 'Kg', category: 'Condimentos', price: 25.09 },
    { name: 'Maionese', unit: 'Kg', category: 'Condimentos', price: 48.09 },
    { name: 'Mostarda', unit: 'Kg', category: 'Condimentos', price: 40.27 },
    { name: 'Molho de Tomate', unit: 'Kg', category: 'Condimentos', price: 14.43 },
    { name: 'Molho Inglês', unit: 'L', category: 'Condimentos', price: 17.45 },
    { name: 'Molho Shoyu', unit: 'L', category: 'Condimentos', price: 9.41 },

    // Mercearia
    { name: 'Arroz', unit: 'Kg', category: 'Mercearia', price: 25.72 },
    { name: 'Feijão Carioca', unit: 'Kg', category: 'Mercearia', price: 19.06 },
    { name: 'Óleo de Soja', unit: 'L', category: 'Mercearia', price: 39.20 },
    { name: 'Azeite', unit: 'L', category: 'Mercearia', price: 36.92 },
    { name: 'Açúcar Refinado', unit: 'Kg', category: 'Mercearia', price: 33.50 },
    { name: 'Açúcar Mascavo', unit: 'Kg', category: 'Mercearia', price: 31.60 },
    { name: 'Farinha de Trigo', unit: 'Kg', category: 'Mercearia', price: 53.19 },
    { name: 'Farinha de Milho', unit: 'Kg', category: 'Mercearia', price: 31.79 },
    { name: 'Farinha de Mandioca', unit: 'Kg', category: 'Mercearia', price: 32.81 },
    { name: 'Amido de Milho', unit: 'Kg', category: 'Mercearia', price: 17.00 },
    { name: 'Extrato de Tomate', unit: 'Kg', category: 'Mercearia', price: 53.32 },
    { name: 'Azeitona', unit: 'Kg', category: 'Mercearia', price: 29.94 },
    { name: 'Palmito', unit: 'Kg', category: 'Mercearia', price: 27.56 },
    { name: 'Milho', unit: 'Kg', category: 'Mercearia', price: 30.31 },
    { name: 'Ervilha', unit: 'Kg', category: 'Mercearia', price: 43.46 }
  ];

  try {
    for (const item of matrix) {
      const mapping = mappings[item.category] || mappings['Mercearia'];
      
      // Escolha inicial coerente
      const mainBrand = mapping.brands[0];
      const mainSupplier = mapping.suppliers[0];

      // Data de última atualização escalonada (últimos 15 dias)
      const lastUpdate = new Date();
      lastUpdate.setDate(lastUpdate.getDate() - Math.floor(Math.random() * 15));
      const lastUpdateStr = lastUpdate.toISOString().split('T')[0];

      // Criar Ingrediente
      const ing = await Ingredient.create({
        name: item.name,
        unit: item.unit,
        category: item.category,
        current_price: item.price,
        main_supplier: mainSupplier,
        brand: mainBrand,
        displayBrand: mainBrand,
        displaySupplier: mainSupplier,
        last_update: lastUpdateStr,
        active: true,
        ingredient_type: 'traditional'
      });

      console.log(`✅ Ingrediente criado: ${item.name} | ID: ${ing.id}`);

      // Criar Histórico de 5 meses
      for (let i = 0; i < 5; i++) {
        const histDate = new Date();
        histDate.setMonth(histDate.getMonth() - i);
        histDate.setDate(1 + Math.floor(Math.random() * 25));
        
        const histDateStr = histDate.toISOString().split('T')[0];

        // Variação de preço
        const variation = 1 + (Math.random() * 0.2 - 0.1); // +/- 10%
        const price = parseFloat((item.price * variation).toFixed(2));
        const oldPrice = parseFloat((price * 1.05).toFixed(2));

        // Rotacionar marcas e fornecedores no histórico para realismo
        const histBrand = mapping.brands[Math.floor(Math.random() * mapping.brands.length)];
        const histSupplier = mapping.suppliers[Math.floor(Math.random() * mapping.suppliers.length)];

        await PriceHistory.create({
          ingredient_id: ing.id,
          ingredient_name: ing.name,
          date: histDateStr,
          new_price: price,
          old_price: oldPrice,
          supplier: histSupplier,
          brand: histBrand,
          unit: item.unit,
          change_type: 'automated_seed_v2'
        });
      }
      process.stdout.write('.');
    }

    console.log('\n🌟 RECONSTRUÇÃO MESTRE CONCLUÍDA COM SUCESSO! 🌟');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na reconstrução:', error);
    process.exit(1);
  }
}

seed();
