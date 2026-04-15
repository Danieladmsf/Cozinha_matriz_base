import { Ingredient, PriceHistory } from '../app/api/entities.js';

async function fixSpecificBrands() {
  console.log('🔍 INICIANDO REVISÃO FINA DE MARCAS (NOME POR NOME)...');

  const brandDict = [
    // Carnes Bovinas
    { match: /(Acém|Alcatra|Patinho|Contra-filé|Mignon|Picanha|Músculo|Costela Bovina|Cupim)/i, brands: ['Swift', 'Friboi', 'Minerva', 'Maturatta'] },
    // Aves
    { match: /(Frango)/i, brands: ['Seara', 'Sadia', 'Perdigão', 'Copacol', 'Korin'] },
    // Suínos
    { match: /(Suín|Pernil|Bacon|Calabresa)/i, brands: ['Seara', 'Sadia', 'Pamplona', 'Aurora'] },
    // Pescados
    { match: /(Salmão|Tilápia|Camarão|Lula|Pescada|Posta)/i, brands: ['Swift', 'Qualimar', 'Costa Sul'] },
    
    // Hortifruti
    { match: /(Alho|Cebola|Batata|Cenoura|Tomate|Pimentão|Abobrinha|Abóbora|Chuchu|Berinjela|Mandioca|Gengibre|Brócolis|Couve|Alface|Rúcula|Espinafre|Cheiro Verde|Vegetal|Fruta)/i, brands: ['Ceasa', 'Produtor Local', 'Fazenda São José'] },

    // Laticínios Mapeamento Específico
    { match: /(Leite Condensado)/i, brands: ['Moça', 'Itambé', 'Piracanjuba'] },
    { match: /(Creme de Leite)/i, brands: ['Nestlé', 'Italac', 'Piracanjuba'] },
    { match: /(Leite Integral|Leite Desnatado)/i, brands: ['Itambé', 'Parmalat', 'Piracanjuba', 'Paulista'] },
    { match: /(Manteiga)/i, brands: ['Aviação', 'President', 'Itambé'] },
    { match: /(Queijo Parmesão)/i, brands: ['Faixa Azul', 'Scala', 'Vigor'] },
    { match: /(Queijo Muçarela|Queijo Prato)/i, brands: ['Tirolez', 'Scala', 'Sadia', 'Quatá'] },
    { match: /(Requijão)/i, brands: ['Catupiry', 'Vigor', 'Danone'] },

    // Secos / Mercearia Básica
    { match: /(Sal.*Refinado|Sal Grosso)/i, brands: ['Cisne', 'Lebre', 'Sal Diana'] },
    { match: /(Açúcar)/i, brands: ['União', 'Da Barra', 'Guarani'] },
    { match: /(Farinha de Trigo)/i, brands: ['Dona Benta', 'Rosa Branca', 'Renata'] },
    { match: /(Farinha de Milho|Farinha de Mandioca)/i, brands: ['Yoki', 'Amafil'] },
    { match: /(Amido)/i, brands: ['Maizena', 'Yoki'] },
    { match: /(Arroz)/i, brands: ['Camil', 'Tio João', 'Prato Fino'] },
    { match: /(Feijão)/i, brands: ['Camil', 'Kicaldo', 'Broto Legal'] },
    { match: /(Óleo)/i, brands: ['Liza', 'Soya', 'Concórdia'] },
    { match: /(Azeite)/i, brands: ['Gallo', 'Andorinha', 'Borges', 'Carbonell'] },

    // Enlatados / Conservas
    { match: /(Azeitona)/i, brands: ['La Pastina', 'Gomes da Costa', 'Rivoli'] },
    { match: /(Palmito)/i, brands: ['Hemmer', 'Rigomel', 'Bonduelle'] },
    { match: /(Milho|Ervilha)/i, brands: ['Bonduelle', 'Quero', 'Predilecta'] },
    { match: /(Extrato.*Tomate)/i, brands: ['Elefante', 'Pomarola', 'Heinz'] },

    // Condimentos
    { match: /(Ketchup|Mostarda|Maionese)/i, brands: ['Heinz', 'Hellmanns', 'Hemmer'] },
    { match: /(Molho.*Tomate)/i, brands: ['Heinz', 'Sacciali', 'Tarantella'] },
    { match: /(Molho Inglês|Molho Shoyu)/i, brands: ['Sakura', 'Hemmer', 'Castelo'] },

    // Temperos Secos
    { match: /(Pimenta|Chimichurri|Colorau|Páprica|Cominho|Louro|Manjericão|Orégano|Canela|Cravo|Noz Moscada)/i, brands: ['Kitano', 'Bombay', 'Masterfood', 'BR Spices'] }
  ];

  try {
    const ingredients = await Ingredient.list();
    const history = await PriceHistory.list();
    let updatedCount = 0;

    for (const ing of ingredients) {
      let matchedBrandList = ['Marca Genérica'];

      for (const rule of brandDict) {
        if (rule.match.test(ing.name)) {
          matchedBrandList = rule.brands;
          break; // Pega a primeira regra que bater
        }
      }

      // Escolher a marca baseada no ID para ser determinístico
      const brandIndex = Math.abs(ing.id.charCodeAt(0)) % matchedBrandList.length;
      let newBrand = matchedBrandList[brandIndex];

      // Exceções e fallbacks caso algo passe direto
      if(newBrand === 'Marca Genérica') {
         if(ing.category === 'Hortifruti') newBrand = 'Ceasa';
         else if(ing.category === 'Laticínios') newBrand = 'Italac';
      }

      if (ing.brand !== newBrand) {
        console.log(`🏷️ Ajustando [${ing.name}]: ${ing.brand} -> ${newBrand}`);
        
        await Ingredient.update(ing.id, {
          brand: newBrand,
          displayBrand: newBrand
        });

        // Atualizar também todo o histórico desse ingrediente para consistência
        const ingHistories = history.filter(h => h.ingredient_id === ing.id);
        for (const h of ingHistories) {
          await PriceHistory.update(h.id, { brand: newBrand });
        }
        updatedCount++;
      }
    }

    console.log(`\n✅ CONCLUÍDO! ${updatedCount} itens receberam marcas hiper-específicas corretas.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na revisão:', error);
    process.exit(1);
  }
}

fixSpecificBrands();
