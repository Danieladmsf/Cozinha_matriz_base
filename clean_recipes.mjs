/**
 * Script de limpeza completa de documentos órfãos do Firestore.
 * Apaga documentos de categorias/configurações que ficam quando uma receita é deletada.
 */
import { db } from './lib/firebase.js';
import {
  collection, getDocs, doc, deleteDoc, getDocsFromServer
} from "firebase/firestore";

async function cleanOrphanRecipeData() {
  // IDs de documentos órfãos confirmados pelo usuário
  const orphanRecipeIds = [
    'UQicJHkZ0alfhrcfDLOx',
    'recipe_1776299998954',
    'recipe_blend_pending' // caso tenha sido criado parcialmente
  ];

  // Collections para varrer procurando referências órfãs para esses IDs
  const collectionsToCheck = [
    'Recipe',
    'Category',
    'CategoryTree',
    'RecipeNutritionConfig',
    'RecipeProcess',
    'RecipeIngredient',
  ];

  console.log('🧹 Iniciando limpeza de dados órfãos...\n');

  // 1. Deletar os documentos Recipe direto pelos IDs
  for (const id of orphanRecipeIds) {
    try {
      const ref = doc(db, 'Recipe', id);
      await deleteDoc(ref);
      console.log(`✅ Deletado de Recipe: ${id}`);
    } catch (e) {
      // Pode não existir, tudo bem
      console.log(`⚠️ Não encontrado em Recipe: ${id} (${e.message})`);
    }
  }

  // 2. Varrer a collection Category buscando o lixo do Hamburger criado pela UI
  console.log('\n🔍 Procurando categorias/configs órfãs...');
  try {
    const catSnap = await getDocsFromServer(collection(db, 'Category'));
    for (const d of catSnap.docs) {
      const data = d.data();
      // Deletar qualquer categoria chamada Hamburger que não tem receitas associadas
      if ((data.name === 'Hamburger' || data.name === 'Hamburguers') && data.total_cost === 0) {
        console.log(`🗑️ Categoria órfã encontrada: ${data.name} (${d.id}) - deletando...`);
        await deleteDoc(doc(db, 'Category', d.id));
      }
    }
  } catch (e) {
    console.log('⚠️ Erro ao verificar Category:', e.message);
  }

  // 3. Varrer RecipeNutritionConfig procurando configs órfãs
  try {
    const configSnap = await getDocsFromServer(collection(db, 'RecipeNutritionConfig'));
    
    // Pegar todos os IDs de receitas existentes
    const recipeSnap = await getDocsFromServer(collection(db, 'Recipe'));
    const existingRecipeIds = new Set(recipeSnap.docs.map(d => d.id));

    for (const d of configSnap.docs) {
      const data = d.data();
      if (data.recipe_id && !existingRecipeIds.has(data.recipe_id)) {
        console.log(`🗑️ Config nutricional órfã encontrada para receita: ${data.recipe_id} - deletando...`);
        await deleteDoc(doc(db, 'RecipeNutritionConfig', d.id));
      }
    }
  } catch (e) {
    console.log('⚠️ Erro ao verificar RecipeNutritionConfig:', e.message);
  }

  console.log('\n✅ Limpeza completa!');
  process.exit(0);
}

cleanOrphanRecipeData().catch(e => {
  console.error('❌ Erro na limpeza:', e);
  process.exit(1);
});
