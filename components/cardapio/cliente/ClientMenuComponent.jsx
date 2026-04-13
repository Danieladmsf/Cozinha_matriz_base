'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Printer } from 'lucide-react';
import MenuHeader from '@/components/shared/MenuHeader';
import SectionContainer, { Section } from '@/components/shared/SectionContainer';
import { useMenuData } from '@/hooks/cardapio/useMenuData';
import { useClientConfig } from '@/hooks/cardapio/useClientConfig';
import { useMenuHelpers } from '@/hooks/cardapio/useMenuHelpers';
import { usePrintMenu } from '@/hooks/cardapio/usePrintMenu';
import { useMenuLocations } from '@/hooks/cardapio/useMenuLocations';
import { useMenuInterface } from '@/hooks/cardapio/useMenuInterface';
import { useAvailableDays } from '@/hooks/useAvailableDays';

// Componentes UI separados
import ClientTabs from './ClientTabs';
import WeeklyMenuGrid from './WeeklyMenuGrid';

export default function ClientMenuComponent() {
  const { toast } = useToast();
  const menuInterface = useMenuInterface();

  // Estados
  const [selectedCustomer, setSelectedCustomer] = useState({ id: "all", name: "Todos os Clientes" });
  const [visibleDays, setVisibleDays] = useState(7);

  // Hooks
  const {
    categories,
    recipes,
    weeklyMenu,
    customers,
    menuConfig,
    loading
  } = useMenuData(menuInterface.currentDate);

  // Log para debug
  console.log('🖥️ [ClientMenuComponent] Dados recebidos:', {
    currentDate: menuInterface.currentDate.toLocaleDateString(),
    categories: categories?.length || 0,
    recipes: recipes?.length || 0,
    customers: customers?.length || 0,
    weeklyMenu: weeklyMenu ? `ID: ${weeklyMenu.id}` : 'null',
    menuConfig: menuConfig ? 'presente' : 'null',
    loading
  });

  const { locations, loading: locationsLoading, getLocationById, getAllClientIds } = useMenuLocations();
  const { applyClientConfig, getFilteredItemsForClient } = useClientConfig(menuConfig, getAllClientIds());
  const menuHelpers = useMenuHelpers();
  const { handlePrintCardapio: printMenu } = usePrintMenu();
  const availableDays = useAvailableDays();


  // Handler de navegação - Otimizado para não recarregar tudo
  const handleDateChange = useCallback((newDate) => {
    // Atualiza apenas a data, o useEffect do useMenuData se encarrega de carregar o menu
    menuInterface.setCurrentDate(newDate);
  }, [menuInterface]);

  // Funções utilitárias
  const getActiveCategories = useMemo(() => {
    // Se temos category_groups configurados, usar os itens dos grupos (nível 2)
    if (menuConfig?.category_groups && menuConfig.category_groups.length > 0) {
      const allGroupItems = menuConfig.category_groups.flatMap(g => g.items || []);
      const uniqueItemIds = [...new Set(allGroupItems)];

      let cats = uniqueItemIds
        .map(id => categories.find(c => c.id === id))
        .filter(Boolean)
        .filter(cat => menuConfig.active_categories?.[cat.id] !== false);

      if (selectedCustomer && selectedCustomer.id !== 'all') {
        cats = applyClientConfig(cats, selectedCustomer.id);
      }
      return cats;
    }

    // Fallback para comportamento legado (categorias nível 1)
    let activeCategories = menuHelpers.getActiveCategories(categories, menuConfig);

    if (selectedCustomer && selectedCustomer.id !== 'all') {
      activeCategories = applyClientConfig(activeCategories, selectedCustomer.id);
    }

    return activeCategories;
  }, [categories, menuConfig, selectedCustomer, menuHelpers, applyClientConfig]);

  const getCategoryColor = useCallback((categoryId) => {
    return menuHelpers.getCategoryColor(categoryId, categories, menuConfig);
  }, [menuHelpers, categories, menuConfig]);

  const handlePrintCardapio = (customerId) => {
    if (!weeklyMenu) {
      toast({
        title: "Erro",
        description: "Nenhum cardápio disponível para impressão.",
        variant: "destructive"
      });
      return;
    }

    try {
      printMenu(
        weeklyMenu,
        getActiveCategories,
        recipes,
        customers,
        locations,
        customerId,
        menuInterface.currentDate,
        getCategoryColor,
        visibleDays,
        availableDays
      );

      toast({
        title: "Impressão",
        description: `Cardápio${customerId !== 'all' ? ' personalizado' : ''} enviado para impressão.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar impressão do cardápio.",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (loading || locationsLoading || !categories || !recipes) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex">
        {/* Sidebar Independente - Seleção de Clientes */}
        <div className="w-52 flex-shrink-0 p-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-lg sticky top-6">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Seleção de Cliente</h3>
              <p className="text-xs text-gray-600">Escolha o cliente para visualizar o cardápio</p>
            </div>
            <ClientTabs
              selectedCustomer={selectedCustomer}
              locations={locations}
              customers={customers}
              getLocationById={getLocationById}
              onCustomerChange={setSelectedCustomer}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="container mx-auto px-3 py-6">
            {/* Cardápio Semanal Card Simplificado */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-lg">
              {/* Header unificado com título, navegação e botão de impressão */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  {/* Título e subtítulo à esquerda */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">Cardápio Semanal</h2>
                    <p className="text-sm text-gray-600">
                      {selectedCustomer?.id === 'all' ?
                        'Visualização completa do cardápio' :
                        `Cardápio personalizado para ${selectedCustomer?.name || 'cliente selecionado'}`
                      }
                    </p>
                  </div>

                  {/* Navegação centralizada */}
                  <div className="flex-1 flex justify-center">
                    <MenuHeader
                      currentDate={menuInterface.currentDate}
                      onDateChange={handleDateChange}
                      weekRange={menuConfig?.available_days?.some(d => d === 0 || d === 6) ? 'full' : 'workdays'}
                    />
                  </div>

                  {/* Botão de impressão à direita */}
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintCardapio(selectedCustomer?.id || 'all')}
                      className="gap-2 bg-white hover:bg-gray-50 border-gray-300"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimir Cardápio
                    </Button>
                  </div>
                </div>
              </div>

              {/* Botões de modo de exibição */}
              <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Exibir:</span>
                {[1, 2, 3, 4, 5, 6, 7].map(n => (
                  <button
                    key={n}
                    onClick={() => setVisibleDays(n)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      visibleDays === n
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {n} dias
                  </button>
                ))}
              </div>

              {/* Grid do cardápio */}
              <div className="p-4">
                <WeeklyMenuGrid
                  currentDate={menuInterface.currentDate}
                  weeklyMenu={weeklyMenu}
                  activeCategories={getActiveCategories}
                  recipes={recipes}
                  selectedCustomer={selectedCustomer}
                  getFilteredItemsForClient={getFilteredItemsForClient}
                  getCategoryColor={getCategoryColor}
                  customers={customers}
                  locations={locations}
                  getAllClientIds={getAllClientIds}
                  visibleDays={visibleDays}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}