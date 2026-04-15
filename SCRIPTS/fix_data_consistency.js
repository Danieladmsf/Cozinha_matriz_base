import { Ingredient, PriceHistory, Supplier, Brand } from '../app/api/entities.js';

async function repair() {
  console.log('🔧 Iniciando REPARO TÉCNICO DEFINITIVO...');

  try {
    const ingredients = await Ingredient.list();
    const histories = await PriceHistory.list();
    const suppliers = await Supplier.list();
    const brands = await Brand.list();

    console.log(`📊 Analisando ${ingredients.length} ingredientes e ${histories.length} registros de histórico...`);

    // 1. Corrigir Históricos
    for (const h of histories) {
      const sup = suppliers.find(s => s.id === h.supplier_id);
      const brd = brands.find(b => b.id === h.brand_id);
      
      // Converter data para string YYYY-MM-DD
      let dateStr = '';
      if (h.date) {
        if (h.date.toDate) {
          dateStr = h.date.toDate().toISOString().split('T')[0];
        } else if (h.date instanceof Date) {
          dateStr = h.date.toISOString().split('T')[0];
        } else {
          dateStr = String(h.date).split('T')[0];
        }
      } else {
        dateStr = new Date().toISOString().split('T')[0];
      }

      const updatePayload = {
        date: dateStr,
        new_price: h.new_price || h.price || 0,
        old_price: h.old_price || h.price || 0,
        supplier: h.supplier || (sup ? (sup.company_name || sup.name) : 'N/A'),
        brand: h.brand || (brd ? brd.name : 'N/A'),
        change_type: h.change_type || 'manual_update'
      };

      await PriceHistory.update(h.id, updatePayload);
      process.stdout.write('h');
    }

    // 2. Corrigir Ingredientes
    for (const ing of ingredients) {
      const ingHistories = histories.filter(h => h.ingredient_id === ing.id);
      
      let dateStr = '';
      if (ing.last_update) {
         if (ing.last_update.toDate) {
            dateStr = ing.last_update.toDate().toISOString().split('T')[0];
         } else if (ing.last_update instanceof Date) {
            dateStr = ing.last_update.toISOString().split('T')[0];
         } else {
            dateStr = String(ing.last_update).split('T')[0];
         }
      } else {
        dateStr = new Date().toISOString().split('T')[0];
      }

      // Pegar a marca do primeiro registro de histórico se não existir
      let brandName = ing.brand;
      if (!brandName || brandName === 'N/A' || brandName === 'N/a') {
        const firstWithBrand = ingHistories.find(h => h.brand && h.brand !== 'N/A');
        brandName = firstWithBrand ? firstWithBrand.brand : 'Marca Própria';
      }

      await Ingredient.update(ing.id, {
        last_update: dateStr,
        brand: brandName,
        displayBrand: brandName // Redundância para garantir
      });
      process.stdout.write('i');
    }

    console.log('\n✅ REPARO CONCLUÍDO! Tudo agora está no formato YYYY-MM-DD e com marcas vinculadas.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no reparo:', error);
    process.exit(1);
  }
}

repair();
