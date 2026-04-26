import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, UtensilsCrossed, AlertCircle } from "lucide-react";
import { renderFormattedRecipeName } from '@/lib/textHelpers';
import { useNutritionCalculator } from './NutritionCalculator';

export default function DailyNutritionPanel({
  currentDay,
  weeklyMenu,
  recipes,
  selectedCustomer,
  portionOverrides,
  onPortionChange,
  onSaveOverrides,
  isSaving
}) {
  const { calculateItemsNutrition, calculateRecipeNutrition } = useNutritionCalculator();
  const [dayItems, setDayItems] = useState([]);

  // Extrai os itens do cardápio para o dia atual e cliente atual
  useEffect(() => {
    let items = [];
    if (weeklyMenu?.menu_data) {
      Object.keys(weeklyMenu.menu_data).forEach(mealType => {
        const mealData = weeklyMenu.menu_data[mealType];
        if (typeof mealData !== 'object' || mealType.startsWith('_')) return;
        
        const dayData = mealData?.[currentDay];
        if (dayData && typeof dayData === 'object') {
          Object.keys(dayData).forEach(categoryId => {
            const catItems = dayData[categoryId];
            if (Array.isArray(catItems)) {
              catItems.forEach(item => {
                if (item.recipe_id) {
                  // Filtra por cliente
                  if (selectedCustomer === 'all' || item.locations?.includes(selectedCustomer)) {
                    items.push({ ...item, categoryId, mealType });
                  }
                }
              });
            }
          });
        }
      });
    }
    setDayItems(items);
  }, [weeklyMenu, currentDay, selectedCustomer]);

  // Calcula totais do dia
  const dayTotals = calculateItemsNutrition(dayItems, recipes, portionOverrides);

  // Calcula a porcentagem dos macronutrientes para o mini-gráfico
  const totalMacros = (dayTotals.carbohydrate_g || 0) + (dayTotals.protein_g || 0) + (dayTotals.lipid_g || 0);
  const getPercentage = (value) => totalMacros > 0 ? ((value || 0) / totalMacros) * 100 : 0;
  const pCarbo = getPercentage(dayTotals.carbohydrate_g);
  const pProtein = getPercentage(dayTotals.protein_g);
  const pFat = getPercentage(dayTotals.lipid_g);

  if (dayItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
        <UtensilsCrossed className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-lg font-medium text-gray-600">Nenhuma receita planejada</p>
        <p className="text-sm">Adicione receitas para este dia no Cardápio Semanal para visualizar o valor nutricional.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bloco Superior: Resumo (Totais) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex justify-between items-center">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            Resumo Nutricional da Refeição
          </h3>
          <Button 
            onClick={() => onSaveOverrides(currentDay)} 
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm"
            size="sm"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Pesos do Dia'}
          </Button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full">
              <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">Calorias</span>
              <span className="text-3xl font-bold text-blue-900 mt-1">{dayTotals.energy_kcal}</span>
              <span className="text-xs text-blue-500 font-medium">kcal</span>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50/50 border-orange-100">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 bg-orange-400" style={{ width: `${pCarbo}%` }}></div>
              <span className="text-sm font-medium text-orange-600 uppercase tracking-wider">Carboidratos</span>
              <span className="text-3xl font-bold text-orange-900 mt-1">{dayTotals.carbohydrate_g}</span>
              <span className="text-xs text-orange-500 font-medium">g ({pCarbo.toFixed(1)}%)</span>
            </CardContent>
          </Card>
          
          <Card className="bg-red-50/50 border-red-100">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 bg-red-400" style={{ width: `${pProtein}%` }}></div>
              <span className="text-sm font-medium text-red-600 uppercase tracking-wider">Proteínas</span>
              <span className="text-3xl font-bold text-red-900 mt-1">{dayTotals.protein_g}</span>
              <span className="text-xs text-red-500 font-medium">g ({pProtein.toFixed(1)}%)</span>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-50/50 border-yellow-100">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 bg-yellow-400" style={{ width: `${pFat}%` }}></div>
              <span className="text-sm font-medium text-yellow-600 uppercase tracking-wider">Gorduras</span>
              <span className="text-3xl font-bold text-yellow-900 mt-1">{dayTotals.lipid_g}</span>
              <span className="text-xs text-yellow-500 font-medium">g ({pFat.toFixed(1)}%)</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Aviso */}
      <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md flex gap-2 items-start">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <p>
          O sistema carrega os pesos da Ficha Técnica. Caso você altere a "Porção Servida" abaixo, o valor será modificado <strong>apenas para o cardápio deste dia</strong>, sem afetar o padrão do restaurante. Não esqueça de clicar em <strong>"Salvar Pesos do Dia"</strong>!
        </p>
      </div>

      {/* Bloco Inferior: Detalhamento por Receita */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <h3 className="text-gray-800 font-medium flex items-center gap-2">
            Detalhamento da Refeição (Raio-X)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3">Receita</th>
                <th className="px-4 py-3 w-40 text-center">Porção Servida (g)</th>
                <th className="px-4 py-3 text-right">Kcal</th>
                <th className="px-4 py-3 text-right">Carbo (g)</th>
                <th className="px-4 py-3 text-right">Prot (g)</th>
                <th className="px-4 py-3 text-right">Gord (g)</th>
              </tr>
            </thead>
            <tbody>
              {dayItems.map((item, index) => {
                const recipe = recipes.find(r => r.id === item.recipe_id);
                if (!recipe) return null;

                const defaultPortion = parseFloat(recipe.portion_size) || 100;
                const currentPortion = portionOverrides[recipe.id] !== undefined 
                  ? parseFloat(portionOverrides[recipe.id]) 
                  : defaultPortion;

                const portionNutrition = calculateRecipeNutrition(recipe, currentPortion);

                return (
                  <tr key={`${recipe.id}-${index}`} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {renderFormattedRecipeName(recipe.name)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <Input 
                          type="number" 
                          min="0"
                          step="1"
                          value={currentPortion || ''}
                          onChange={(e) => onPortionChange(recipe.id, e.target.value)}
                          className={`w-24 text-center font-medium ${currentPortion !== defaultPortion ? 'bg-yellow-50 border-yellow-300' : ''}`}
                        />
                      </div>
                      {currentPortion !== defaultPortion && (
                        <p className="text-[10px] text-center text-yellow-600 mt-1">
                          Modificado (Padrão: {defaultPortion}g)
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-medium">{portionNutrition.energy_kcal}</td>
                    <td className="px-4 py-4 text-right text-gray-600">{portionNutrition.carbohydrate_g}</td>
                    <td className="px-4 py-4 text-right text-gray-600">{portionNutrition.protein_g}</td>
                    <td className="px-4 py-4 text-right text-gray-600">{portionNutrition.lipid_g}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
