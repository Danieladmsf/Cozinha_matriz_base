/**
 * Script para buscar os ingredientes da receita de massa de pizza
 * e seus dados atuais no banco.
 */
import { db } from './lib/firebase.js';
import { collection, getDocsFromServer } from "firebase/firestore";

const NEEDED = [
  'farinha de trigo',
  'água',
  'fermento biológico',
  'sal refinado',
  'açúcar',
  'glucose',
  'semolina',
  'fubá',
];

async function main() {
  const snap = await getDocsFromServer(collection(db, 'Ingredient'));
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(i => i.active !== false);

  const found = all.filter(i => {
    const n = (i.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return NEEDED.some(kw => n.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
  });

  found.forEach(i => {
    console.log(JSON.stringify({
      id: i.id,
      name: i.name,
      unit: i.unit,
      current_price: i.current_price,
      category: i.category,
      ingredient_type: i.ingredient_type,
      brand: i.brand,
      main_supplier: i.main_supplier,
      supplier_id: i.supplier_id,
      brand_id: i.brand_id,
      supplier_code: i.supplier_code,
      chosen_taco_id: i.chosen_taco_id,
      chosen_variation_name: i.chosen_variation_name,
    }));
  });
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
