import { APP_CONSTANTS } from './constants.js';

/**
 * Trunca texto se exceder o comprimento máximo
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Comprimento máximo (padrão: 30)
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength = APP_CONSTANTS.DEFAULT_TEXT_TRUNCATE_LENGTH) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

/**
 * Formata nome de receita de forma consistente
 * @param {string} recipeName - Nome da receita
 * @param {number} maxLength - Comprimento máximo
 * @returns {string} Nome formatado
 */
export const formatRecipeName = (recipeName, maxLength = APP_CONSTANTS.DEFAULT_TEXT_TRUNCATE_LENGTH) => {
  if (!recipeName) return "";
  return truncateText(recipeName.trim(), maxLength);
};

/**
 * Renderiza nome de receita formatado para JSX (manter compatibilidade)
 * @param {string} name - Nome da receita
 * @returns {JSX.Element} Elemento JSX formatado
 */
export const renderFormattedRecipeName = (name) => {
  if (!name) return "";
  return name;
};

/**
 * Retorna o texto descritivo do rendimento (Porções) a partir da Ficha Técnica
 * @param {Object} recipe - Objeto completo da Receita com preparations
 * @returns {string} Texto mágico do rendimento
 */
export const getRecipeYieldDescription = (recipe) => {
  if (!recipe || !recipe.preparations || !Array.isArray(recipe.preparations) || recipe.preparations.length === 0) {
    return "";
  }

  // Encontrar a última preparação que tenha assembly_config
  const preps = [...recipe.preparations].reverse();
  let assemblyConfig = null;
  
  for (const prep of preps) {
    if (prep.assembly_config && prep.assembly_config.units_quantity) {
      assemblyConfig = prep.assembly_config;
      break;
    }
  }

  // Tentar pegar o peso total da receita (geralmente total_weight ou yield_weight)
  const totalWeight = parseFloat(recipe.yield_weight) || parseFloat(recipe.total_weight) || 0;

  if (assemblyConfig) {
    const qty = parseFloat(assemblyConfig.units_quantity) || 1;
    const type = assemblyConfig.unit_type || 'un';

    if (type === 'un' && qty > 1) {
       if (totalWeight > 0) {
           const unitWeight = (totalWeight / qty) * 1000; // em gramas
           return `Contém ${qty} unidades de ~${Math.round(unitWeight)}g cada. (Total: ${totalWeight.toFixed(3).replace('.',',')}kg)`;
       }
       return `Contém ${qty} unidades`;
    } else if (type === 'kg') {
       // Se o yield config for em KG, qty  o proprio peso da porcao
       return `Porção de ${totalWeight > 0 ? totalWeight.toFixed(3).replace('.',',') : qty.toFixed(3).replace('.',',')}kg`;
    }
  }
  
  // Fallback generico caso nao tenha assembly_config
  if (totalWeight > 0) {
      return `Total: ${totalWeight.toFixed(3).replace('.',',')}kg`;
  }

  return "";
};