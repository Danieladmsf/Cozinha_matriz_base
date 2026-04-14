import fs from 'fs';
import path from 'path';

const TACO_PATH = path.join(process.cwd(), 'data', 'taco.json');

function search(query) {
  if (!fs.existsSync(TACO_PATH)) {
    console.error('Erro: Arquivo taco.json não encontrado em data/');
    return;
  }

  const data = JSON.parse(fs.readFileSync(TACO_PATH, 'utf8'));
  const results = data.filter(item => 
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  if (results.length === 0) {
    console.log(`Nenhum alimento encontrado para: "${query}"`);
    return;
  }

  console.log(`\nEncontrados ${results.length} resultados para "${query}":\n`);
  results.slice(0, 10).forEach(item => {
    console.log(`[ID ${item.id}] ${item.description} (${item.category})`);
    console.log(`   - Energia: ${item.energy_kcal?.toFixed(1) || '0'} kcal`);
    console.log(`   - Proteína: ${item.protein_g?.toFixed(1) || '0'} g`);
    console.log(`   - Carboidratos: ${item.carbohydrate_g?.toFixed(1) || '0'} g`);
    console.log(`   - Lipídios: ${item.lipid_g?.toFixed(1) || '0'} g`);
    console.log('--------------------------------------------------');
  });

  if (results.length > 10) {
    console.log(`... e mais ${results.length - 10} itens.`);
  }
}

const query = process.argv.slice(2).join(' ');
if (!query) {
  console.log('Uso: node search_taco.mjs [termo de busca]');
} else {
  search(query);
}
