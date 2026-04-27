'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Settings, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMenuData } from '@/hooks/cardapio/useMenuData';
import { WeeklyMenu as WeeklyMenuEntity } from "@/app/api/entities";
import DailyNutritionPanel from './DailyNutritionPanel';
import { useAvailableDays, DAY_NAMES } from '@/hooks/useAvailableDays';
import WeekNavigator from '@/components/shared/WeekNavigator';
import WeekDaySelector from '@/components/shared/WeekDaySelector';
import { useNutritionCalculator } from './NutritionCalculator';

export default function NutritionalTableComponent() {
  const { toast } = useToast();
  const availableDays = useAvailableDays();

  // Estados principais
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentDay, setCurrentDay] = useState(availableDays.length > 0 ? availableDays[0] : 1);
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  
  // Estado para armazenar as modificações de porção (overrides)
  const [portionOverrides, setPortionOverrides] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Hook de dados
  const {
    categories,
    recipes,
    weeklyMenu,
    customers,
    menuConfig,
    loading,
    loadWeeklyMenu
  } = useMenuData(currentDate);

  // Carrega os dados nutricionais globais apenas uma vez!
  const { 
    calculateItemsNutrition, 
    calculateRecipeNutrition, 
    loading: nutritionLoading 
  } = useNutritionCalculator();

  // Sincroniza o currentDay com availableDays do menuConfig
  useEffect(() => {
    if (menuConfig?.available_days && !menuConfig.available_days.includes(currentDay)) {
      if (menuConfig.available_days.length > 0) {
        setCurrentDay(menuConfig.available_days[0]);
      }
    }
  }, [menuConfig?.available_days, currentDay]);

  // Carrega os overrides do menu quando ele mudar
  useEffect(() => {
    if (weeklyMenu?.portion_overrides) {
      setPortionOverrides(weeklyMenu.portion_overrides);
    } else {
      setPortionOverrides({});
    }
  }, [weeklyMenu?.id]); // Depende do ID para recarregar ao trocar de semana

  // Handlers de navegação
  const handleDateChange = useCallback((newDate) => {
    setCurrentDate(newDate);
    loadWeeklyMenu(newDate);
  }, [loadWeeklyMenu]);

  // Handler para alteração do input de porção
  const handlePortionChange = (recipeId, newValue) => {
    // Permite vazio enquanto digita, converte para número ao salvar
    const val = newValue === '' ? '' : Number(newValue);
    
    setPortionOverrides(prev => ({
      ...prev,
      [currentDay]: {
        ...(prev[currentDay] || {}),
        [recipeId]: val
      }
    }));
  };

  // Salvar overrides no Firestore
  const handleSaveOverrides = async (day) => {
    if (!weeklyMenu?.id) {
      toast({ title: "Erro", description: "Menu semanal não encontrado.", variant: "destructive" });
      return;
    }

    try {
      setIsSaving(true);
      
      // Limpa os vazios antes de salvar
      const cleanOverrides = { ...portionOverrides };
      if (cleanOverrides[day]) {
        Object.keys(cleanOverrides[day]).forEach(recipeId => {
          if (cleanOverrides[day][recipeId] === '' || cleanOverrides[day][recipeId] <= 0) {
            delete cleanOverrides[day][recipeId];
          }
        });
      }

      await WeeklyMenuEntity.update(weeklyMenu.id, {
        portion_overrides: cleanOverrides
      });

      toast({
        title: "Pesos Salvos!",
        description: `As porções de ${DAY_NAMES[day]} foram atualizadas para este cardápio.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: "Houve um problema ao salvar os pesos da porção.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || nutritionLoading || !categories || !recipes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium">Carregando tabela nutricional...</p>
      </div>
    );
  }

  // Filtrar clientes ativos
  const activeCustomers = customers?.filter(c => c.active) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          
          {/* Header Section */}
          <div className="flex justify-center mb-6 print:hidden">
            <WeekNavigator
              currentDate={currentDate}
              onDateChange={handleDateChange}
              weekRange={menuConfig?.available_days?.some(d => d === 0 || d === 6) ? 'full' : 'workdays'}
              showCalendar={true}
            />
          </div>

          {/* Navegação de Dias da Semana */}
          {weeklyMenu ? (
            <>
              <div className="mb-6">
                <WeekDaySelector
                  currentDate={currentDate}
                  currentDayIndex={currentDay}
                  availableDays={availableDays}
                  onDayChange={setCurrentDay}
                />
              </div>

              {/* Controle e Seletor de Cliente (Movido para baixo do calendário) */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Planejamento Nutricional
                  </h2>
                  <p className="text-sm text-gray-500">Defina os pesos e analise as refeições dia a dia</p>
                </div>
                
                <div className="w-full md:w-auto flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Visualizando Refeição de:</span>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="w-full md:w-[250px] bg-white">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Clientes (Geral)</SelectItem>
                      {activeCustomers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <DailyNutritionPanel 
                  currentDay={currentDay}
                  weeklyMenu={weeklyMenu}
                  recipes={recipes}
                  categories={categories}
                  menuConfig={menuConfig}
                  selectedCustomer={selectedCustomer}
                  portionOverrides={portionOverrides[currentDay] || {}}
                  onPortionChange={handlePortionChange}
                  onSaveOverrides={handleSaveOverrides}
                  isSaving={isSaving}
                  calculateItemsNutrition={calculateItemsNutrition}
                  calculateRecipeNutrition={calculateRecipeNutrition}
                />
              </div>
            </>
          ) : (
            <div className="bg-white p-12 text-center rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-500 text-lg">Nenhum cardápio criado para esta semana.</p>
              <p className="text-sm text-gray-400 mt-2">Vá para a aba "Produção Semanal" e crie o cardápio primeiro.</p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}