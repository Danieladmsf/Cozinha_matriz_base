/**
 * Lógica centralizada para cálculos de peso
 */

import { parseQuantity } from "./orderUtils";
import { calculateItemWeight } from "@/lib/weightCalculator";

export class CategoryLogic {

  /**
   * Calcula todos os valores de um item
   * @param {Object} item - Item do pedido
   * @param {string} field - Campo sendo alterado
   * @param {any} value - Novo valor
   * @param {number} mealsExpected - Refeições esperadas
   * @returns {Object} Item atualizado
   */
  static calculateItemValues(item, field, value, mealsExpected) {
    const updatedItem = { ...item };

    // ✅ PRESERVAR dados de peso da receita original antes de qualquer alteração
    const originalCubaWeight = item.cuba_weight;
    const originalTotalWeight = item.total_weight;
    const originalYieldWeight = item.yield_weight;

    // Aplicar mudança no campo específico
    if (field === 'base_quantity') {
      const inputValue = parseQuantity(value);

      // Sempre usar o valor digitado pelo usuário (permite edição total)
      // Se for string numérica (ex: "0.490"), preserva para manter formatação visual
      updatedItem.base_quantity = (typeof value === 'string' && value.trim() !== '' && !isNaN(inputValue))
        ? value
        : inputValue;

    } else if (field === 'sales_window') {
      updatedItem.sales_window = value;
      return updatedItem; // Janela não afeta cálculos imediatos de peso
    } else {
      updatedItem[field] = value;
    }

    // ✅ GARANTIR que os dados de peso da receita sejam preservados
    if (originalCubaWeight !== undefined) updatedItem.cuba_weight = originalCubaWeight;
    if (originalTotalWeight !== undefined) updatedItem.total_weight = originalTotalWeight;
    if (originalYieldWeight !== undefined) updatedItem.yield_weight = originalYieldWeight;

    // A quantidade final é sempre base_quantity
    updatedItem.quantity = updatedItem.base_quantity || 0;

    // Recalcular preço total
    updatedItem.total_price = updatedItem.quantity * (updatedItem.unit_price || 0);

    // ✅ CORREÇÃO: Calcular peso total preservando campos de peso da receita
    const calculatedWeight = calculateItemWeight(updatedItem);
    updatedItem.total_weight = calculatedWeight;

    return updatedItem;
  }

  /**
   * Verifica se deve mostrar colunas especiais
   * Mantido apenas para compatibilidade legada temporária - tudo desativado
   * @param {string} categoryName - Nome da categoria
   * @returns {Object} Configuração de colunas
   */
  static getCategoryColumnConfig(categoryName) {
    return {
      showPorcionamento: false,
      showTotalPedido: false,
      isCarneCategory: false
    };
  }

  /**
   * Gera cabeçalhos da tabela
   * @returns {Array} Array de objetos com configuração dos cabeçalhos
   */
  static getTableHeaders() {
    return [
      { key: 'item', label: 'Item', className: 'text-left p-2 text-xs font-medium text-blue-700 min-w-[150px]' },
      { key: 'suggestion_quantity', label: 'Sugestão', className: 'text-center p-2 text-xs font-medium text-amber-600 min-w-[60px]' },
      { key: 'quantity', label: 'Quantidade', className: 'text-center p-2 text-xs font-medium text-blue-700 min-w-[60px]' },
      { key: 'subtotal', label: 'Subtotal', className: 'text-center p-2 text-xs font-medium text-blue-700 min-w-[70px]' },
      { key: 'peso_total', label: 'Peso Total', className: 'text-center p-2 text-xs font-medium text-blue-700 min-w-[70px]' },
      { key: 'sales_window', label: 'Janela de Oferta', className: 'text-center p-2 text-xs font-medium text-blue-700 min-w-[130px]' }
    ];
  }

  /**
   * Formata linha da tabela para exportação
   */
  static formatExportRow(item, isCarneCategory, formatCurrency, formattedQuantity, formatWeight) {
    const baseQty = formattedQuantity(item.base_quantity || 0);
    const subtotal = formatCurrency(item.total_price || 0);
    const pesoTotal = formatWeight ? formatWeight(item.total_weight || 0) : '0 kg';
    const salesWindow = item.sales_window || 'Dia Todo';
    const unitPrice = formatCurrency(item.unit_price || 0);
    const itemHeader = `${item.recipe_name}\n${unitPrice}/${item.unit_type}`;

    return `${itemHeader} | ${baseQty} | ${subtotal} | ${pesoTotal} | ${salesWindow}`;
  }

  /**
   * Gera cabeçalho da tabela para exportação
   */
  static getExportHeader() {
    return "Item | Quantidade | Subtotal | Peso Total | Janela de Venda";
  }
}