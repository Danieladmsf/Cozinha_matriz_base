import { Ingredient, Supplier, Brand, PriceHistory } from '../app/api/entities.js';

async function seed() {
  console.log('🚀 INICIANDO POPULAÇÃO EXAUSTIVA DE DADOS (PROFISSIONAL)...');

  try {
    // 1. Fornecedores Especializados
    const supplierNames = [
      'Atacadão dos Insumos', 'Distribuidora Central', 'Swift Business', 'Hortifruti Premium',
      'Frigorífico Real', 'Peixaria Águas Claras', 'Casa das Especiarias', 'Laticínios de Ouro'
    ];
    
    const allSuppliers = await Supplier.list();
    const suppliers = [];
    for (const name of supplierNames) {
      let s = allSuppliers.find(existing => existing.name === name);
      if (!s) s = await Supplier.create({ name, contact: 'vendas@' + name.toLowerCase().replace(/ /g, '') + '.com' });
      suppliers.push(s);
    }

    // 2. Marcas Profissionais
    const brandNames = ['Nestlé', 'Heinz', 'Hellmanns', 'Sadi', 'Seara', 'Camil', 'Tio João', 'Unilever', 'Cargill', 'Bunge', 'Marca Própria'];
    const allBrands = await Brand.list();
    const brands = [];
    for (const name of brandNames) {
      let b = allBrands.find(existing => existing.name === name);
      if (!b) b = await Brand.create({ name });
      brands.push(b);
    }

    // 3. LISTA EXAUSTIVA DE INGREDIENTES (~100 items)
    const ingredientData = [
      // PROTEÍNAS - GADO
      { name: 'Acém', unit: 'kg', category: 'Proteínas' },
      { name: 'Alcatra', unit: 'kg', category: 'Proteínas' },
      { name: 'Patinho', unit: 'kg', category: 'Proteínas' },
      { name: 'Contra-filé', unit: 'kg', category: 'Proteínas' },
      { name: 'Filé Mignon', unit: 'kg', category: 'Proteínas' },
      { name: 'Músculo Moído', unit: 'kg', category: 'Proteínas' },
      { name: 'Costela Bovina', unit: 'kg', category: 'Proteínas' },
      { name: 'Cupim', unit: 'kg', category: 'Proteínas' },
      { name: 'Picanha', unit: 'kg', category: 'Proteínas' },

      // PROTEÍNAS - AVES
      { name: 'Peito de Frango', unit: 'kg', category: 'Proteínas' },
      { name: 'Sobrecoxa de Frango', unit: 'kg', category: 'Proteínas' },
      { name: 'Asa de Frango', unit: 'kg', category: 'Proteínas' },
      { name: 'Coração de Frango', unit: 'kg', category: 'Proteínas' },
      { name: 'Frango Inteiro', unit: 'kg', category: 'Proteínas' },

      // PROTEÍNAS - SUÍNO
      { name: 'Costela Suína', unit: 'kg', category: 'Proteínas' },
      { name: 'Lombo Suíno', unit: 'kg', category: 'Proteínas' },
      { name: 'Pernil Suíno', unit: 'kg', category: 'Proteínas' },
      { name: 'Bacon Inteiro', unit: 'kg', category: 'Proteínas' },
      { name: 'Linguiça Calabresa', unit: 'kg', category: 'Proteínas' },

      // PROTEÍNAS - PEIXES E FRUTOS DO MAR
      { name: 'Filé de Tilápia', unit: 'kg', category: 'Proteínas' },
      { name: 'Filé de Salmão', unit: 'kg', category: 'Proteínas' },
      { name: 'Camarão M Médio', unit: 'kg', category: 'Proteínas' },
      { name: 'Anéis de Lula', unit: 'kg', category: 'Proteínas' },
      { name: 'Posta de Pintado', unit: 'kg', category: 'Proteínas' },

      // HORTIFRUTI - VEGETAIS PESADOS
      { name: 'Cebola', unit: 'kg', category: 'Hortifruti' },
      { name: 'Alho', unit: 'kg', category: 'Hortifruti' },
      { name: 'Batata Inglesa', unit: 'kg', category: 'Hortifruti' },
      { name: 'Cenoura', unit: 'kg', category: 'Hortifruti' },
      { name: 'Mandioca s/ Casca', unit: 'kg', category: 'Hortifruti' },
      { name: 'Abóbora Cabotiá', unit: 'kg', category: 'Hortifruti' },
      { name: 'Tomate Italiano', unit: 'kg', category: 'Hortifruti' },
      { name: 'Pimentão Verde', unit: 'kg', category: 'Hortifruti' },
      { name: 'Pimentão Amarelo', unit: 'kg', category: 'Hortifruti' },
      { name: 'Pimentão Vermelho', unit: 'kg', category: 'Hortifruti' },
      { name: 'Gengibre', unit: 'kg', category: 'Hortifruti' },
      { name: 'Berinjela', unit: 'kg', category: 'Hortifruti' },
      { name: 'Abobrinha Italiana', unit: 'kg', category: 'Hortifruti' },
      { name: 'Chuchu', unit: 'kg', category: 'Hortifruti' },

      // HORTIFRUTI - FOLHAS E FLORES
      { name: 'Alface Crespa', unit: 'un', category: 'Hortifruti' },
      { name: 'Alface Americana', unit: 'un', category: 'Hortifruti' },
      { name: 'Rúcula', unit: 'un', category: 'Hortifruti' },
      { name: 'Espinafre Maço', unit: 'un', category: 'Hortifruti' },
      { name: 'Couve Manteiga', unit: 'un', category: 'Hortifruti' },
      { name: 'Brócolis Ninja', unit: 'un', category: 'Hortifruti' },
      { name: 'Couve-Flor', unit: 'un', category: 'Hortifruti' },
      { name: 'Cheiro Verde Maço', unit: 'un', category: 'Hortifruti' },

      // MERCEARIA - BÁSICOS
      { name: 'Arroz Branco', unit: 'kg', category: 'Mercearia' },
      { name: 'Arroz Parboilizado', unit: 'kg', category: 'Mercearia' },
      { name: 'Feijão Carioca', unit: 'kg', category: 'Mercearia' },
      { name: 'Feijão Preto', unit: 'kg', category: 'Mercearia' },
      { name: 'Óleo de Soja', unit: 'L', category: 'Mercearia' },
      { name: 'Azeite Extra Virgem', unit: 'L', category: 'Mercearia' },
      { name: 'Sal Refinado', unit: 'kg', category: 'Mercearia' },
      { name: 'Sal Grosso', unit: 'kg', category: 'Mercearia' },
      { name: 'Açúcar Refinado', unit: 'kg', category: 'Mercearia' },
      { name: 'Açúcar Mascavo', unit: 'kg', category: 'Mercearia' },
      { name: 'Farinha de Trigo', unit: 'kg', category: 'Mercearia' },
      { name: 'Farinha de Milho', unit: 'kg', category: 'Mercearia' },
      { name: 'Farinha de Mandioca', unit: 'kg', category: 'Mercearia' },
      { name: 'Amido de Milho', unit: 'kg', category: 'Mercearia' },

      // MERCEARIA - CONSERVAS E ENLATADOS
      { name: 'Milho em Conserva', unit: 'kg', category: 'Mercearia' },
      { name: 'Ervilha em Conserva', unit: 'kg', category: 'Mercearia' },
      { name: 'Azeitona s/ Caroço', unit: 'kg', category: 'Mercearia' },
      { name: 'Palmito Inteiro', unit: 'kg', category: 'Mercearia' },
      { name: 'Extrato de Tomate', unit: 'kg', category: 'Mercearia' },
      { name: 'Atum em Ralado', unit: 'kg', category: 'Mercearia' },

      // LATICÍNIOS E FRIOS
      { name: 'Leite Integral', unit: 'L', category: 'Laticínios' },
      { name: 'Creme de Leite', unit: 'kg', category: 'Laticínios' },
      { name: 'Leite Condensado', unit: 'kg', category: 'Laticínios' },
      { name: 'Manteiga c/ Sal', unit: 'kg', category: 'Laticínios' },
      { name: 'Manteiga s/ Sal', unit: 'kg', category: 'Laticínios' },
      { name: 'Queijo Muçarela', unit: 'kg', category: 'Laticínios' },
      { name: 'Queijo Prato', unit: 'kg', category: 'Laticínios' },
      { name: 'Queijo Parmesão', unit: 'kg', category: 'Laticínios' },
      { name: 'Requijão Cremoso', unit: 'kg', category: 'Laticínios' },

      // MOLHOS E CONDIMENTOS
      { name: 'Maionese Balde', unit: 'kg', category: 'Condimentos' },
      { name: 'Ketchup Galão', unit: 'kg', category: 'Condimentos' },
      { name: 'Mostarda Galão', unit: 'kg', category: 'Condimentos' },
      { name: 'Molho Shoyu', unit: 'L', category: 'Condimentos' },
      { name: 'Molho Inglês', unit: 'L', category: 'Condimentos' },
      { name: 'Molho de Pimenta', unit: 'L', category: 'Condimentos' },

      // TEMPEROS E ESPECIARIAS
      { name: 'Pimenta do Reino', unit: 'kg', category: 'Temperos' },
      { name: 'Cominho em Pó', unit: 'kg', category: 'Temperos' },
      { name: 'Orégano Seco', unit: 'kg', category: 'Temperos' },
      { name: 'Chimichurri', unit: 'kg', category: 'Temperos' },
      { name: 'Colorau', unit: 'kg', category: 'Temperos' },
      { name: 'Páprica Doce', unit: 'kg', category: 'Temperos' },
      { name: 'Páprica Defumada', unit: 'kg', category: 'Temperos' },
      { name: 'Açafrão/Cúrcuma', unit: 'kg', category: 'Temperos' },
      { name: 'Noz Moscada', unit: 'un', category: 'Temperos' },
      { name: 'Canela em Pó', unit: 'kg', category: 'Temperos' },
      { name: 'Cravo da Índia', unit: 'kg', category: 'Temperos' },
      { name: 'Manjericão Seco', unit: 'kg', category: 'Temperos' },
    ];

    console.log(`🥗 Processando ${ingredientData.length} insumos...`);
    
    // Obter lista atual para evitar duplicatas em nomes já existentes
    const existing = await Ingredient.list();

    for (const item of ingredientData) {
      let ing = existing.find(ei => ei.name.toLowerCase() === item.name.toLowerCase());
      
      if (!ing) {
        ing = await Ingredient.create({
          ...item,
          active: true,
          current_price: 0,
          main_supplier: 'Pendente',
          last_update: new Date()
        });
      }

      // Histórico de Preços (5 registros)
      const basePrice = Math.random() * 40 + 5;
      const variations = [0, 0, 0.2, -0.1, 0.05];
      let latestPrice = 0, latestSupplier = '';

      for (let i = 0; i < 5; i++) {
        const sup = suppliers[i % suppliers.length];
        const brd = brands[i % brands.length];
        const price = basePrice * (1 + variations[i]);
        const date = new Date();
        date.setDate(date.getDate() - (i * 10));

        await PriceHistory.create({
          ingredient_id: ing.id, supplier_id: sup.id, brand_id: brd.id,
          price, date, unit: item.unit
        });

        if (i === 0) { latestPrice = price; latestSupplier = sup.name; }
      }

      await Ingredient.update(ing.id, {
        current_price: latestPrice,
        main_supplier: latestSupplier,
        last_update: new Date()
      });
      
      process.stdout.write('.'); // Barra de progresso visual simples
    }

    console.log('\n✨ OPERAÇÃO FINALIZADA: O banco de dados está repleto e pronto!');
    process.exit(0);

  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    process.exit(1);
  }
}

seed();
