import { db } from './lib/firebase.js';
import { collection, getDocsFromServer } from "firebase/firestore";

async function inspect() {
  const snap = await getDocsFromServer(collection(db, 'Recipe'));
  for (const d of snap.docs) {
    const data = d.data();
    if (data.name === 'Arroz Branco' || data.name === 'Feijão') {
      console.log(`\n=== ${data.name} ===`);
      // Mostrar apenas campos de qualidade/controle
      const qualityFields = [
        'shelf_life', 'shelf_life_days', 'validade', 'validity',
        'storage', 'armazenamento', 'storage_instructions',
        'allergens', 'alergenos', 'allergen_list',
        'pcc', 'critical_control_points', 'haccp',
        'quality', 'qualidade', 'quality_control',
        'temperature', 'temperatura'
      ];
      qualityFields.forEach(field => {
        if (data[field] !== undefined) {
          console.log(`  ${field}:`, JSON.stringify(data[field]));
        }
      });
      
      // Mostrar TODOS os campos da receita (sem preparations) para descobrir nomes
      const { preparations, ...rootFields } = data;
      console.log('\n  TODOS OS CAMPOS RAIZ:');
      Object.keys(rootFields).forEach(k => {
        console.log(`  ${k}:`, JSON.stringify(rootFields[k])?.slice(0, 100));
      });
    }
  }
  process.exit(0);
}
inspect().catch(e => { console.error(e); process.exit(1); });
