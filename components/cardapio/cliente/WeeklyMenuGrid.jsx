'use client';

import React from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { renderFormattedRecipeName } from '@/lib/textHelpers';
import { useLocationSelection } from '@/hooks/cardapio/useLocationSelection';
import { useAvailableDays, DAY_NAMES_FULL } from '@/hooks/useAvailableDays';

export default function WeeklyMenuGrid({
  currentDate,
  weeklyMenu,
  activeCategories,
  recipes,
  selectedCustomer,
  getFilteredItemsForClient,
  getCategoryColor,
  customers,
  locations,
  getAllClientIds
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const locationSelection = useLocationSelection(getAllClientIds());

  // Hook centralizado para dias disponíveis
  const availableDays = useAvailableDays();

  // Log para debug
  console.log('📊 [WeeklyMenuGrid] Props recebidas:', {
    currentDate: currentDate.toLocaleDateString(),
    weeklyMenu: weeklyMenu ? {
      id: weeklyMenu.id,
      weekKey: weeklyMenu.week_key,
      menuData: weeklyMenu.menu_data ? 'presente' : 'ausente',
      diasComDados: weeklyMenu.menu_data ? Object.keys(weeklyMenu.menu_data).length : 0
    } : 'null',
    activeCategories: activeCategories?.length || 0,
    recipes: recipes?.length || 0,
    selectedCustomer: selectedCustomer ? selectedCustomer.name : 'null'
  });

  // Função para obter clientes desmarcados de uma receita
  const getUncheckedClients = (item) => {
    if (!item || !item.locations || !locations) return [];

    return locations.filter(location => {
      const isSelected = locationSelection.isLocationSelected(item.locations, location.id);
      return !isSelected; // Retorna apenas os NÃO selecionados
    });
  };

  // Determinar número de colunas do grid
  const getGridCols = () => {
    const numDays = availableDays.length;
    if (numDays <= 3) return 'repeat(3, 1fr)';
    if (numDays === 4) return 'repeat(4, 1fr)';
    if (numDays === 5) return 'repeat(5, 1fr)';
    if (numDays === 6) return 'repeat(6, 1fr)';
    return 'repeat(7, 1fr)';
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: getGridCols(),
      gap: '12px',
      minHeight: 'auto',
      padding: '0',
      width: '100%',
      overflow: 'visible'
    }}>
      {availableDays.map(day => {
        // Agregar dados de TODOS os grupos (mealTypes) para este dia
        // Estrutura: menu_data[mealType][dayIndex][categoryId] = [items]
        let dayItems = {};
        if (weeklyMenu?.menu_data) {
          Object.keys(weeklyMenu.menu_data).forEach(mealType => {
            const mealData = weeklyMenu.menu_data[mealType];
            // Pula chaves internas (ex: _metadata)
            if (typeof mealData !== 'object' || mealType.startsWith('_')) return;
            const dayData = mealData?.[day];
            if (dayData && typeof dayData === 'object') {
              Object.keys(dayData).forEach(categoryId => {
                if (!dayItems[categoryId]) {
                  dayItems[categoryId] = [];
                }
                const items = dayData[categoryId];
                if (Array.isArray(items)) {
                  dayItems[categoryId] = [...dayItems[categoryId], ...items];
                }
              });
            }
          });
        }

        console.log(`📅 [WeeklyMenuGrid] Dia ${day} (${DAY_NAMES_FULL[day]}):`, {
          temDados: Object.keys(dayItems).length > 0,
          categorias: Object.keys(dayItems).length,
          dayItems
        });

        const dayDate = addDays(weekStart, day);

        return (
          <div key={day} style={{
            border: '2px solid #000',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 'auto',
            height: 'auto',
            overflow: 'visible'
          }}>
            <div style={{
              borderBottom: '1px solid #ccc',
              paddingBottom: '5px',
              marginBottom: '8px',
              flexShrink: 0
            }}>
              <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0', textAlign: 'center' }}>{DAY_NAMES_FULL[day].toUpperCase().replace('-FEIRA', '')} - {format(dayDate, 'dd/MM/yyyy', { locale: ptBR })}</h2>
            </div>

            <div style={{ flex: 1, overflow: 'visible' }}>
              {activeCategories.map((category, categoryIndex) => {
                const items = Array.isArray(dayItems[category.id]) ? dayItems[category.id] : [];
                const filteredItems = selectedCustomer?.id === 'all'
                  ? items
                  : getFilteredItemsForClient(items, category.id, selectedCustomer?.id);

                return (
                  <div key={category.id} style={{ marginBottom: '8px' }}>
                    <h3 style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      margin: '0 0 4px 0',
                      backgroundColor: '#f0f0f0',
                      padding: '2px 4px',
                      borderBottom: '1px solid #ccc'
                    }}>{category.name}</h3>

                    <div>
                      {filteredItems.length > 0 ? (
                        <div>
                          {filteredItems.map((item, idx) => {
                            const recipe = recipes.find(r => r.id === item.recipe_id);
                            if (!recipe) return null;

                            return (
                              <div key={`${category.id}-${idx}`}>
                                <div style={{
                                  fontSize: '10px',
                                  marginBottom: '2px',
                                  lineHeight: '1.2'
                                }}>
                                  {renderFormattedRecipeName(recipe.name)}
                                </div>
                                {selectedCustomer?.id === 'all' && getUncheckedClients(item).length > 0 && (
                                  <div style={{
                                    fontSize: '8px',
                                    color: '#d00',
                                    textDecoration: 'line-through',
                                    marginLeft: '2px',
                                    lineHeight: '1.1'
                                  }}>
                                    {getUncheckedClients(item).map(client => client.name).join(', ')}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: '#999' }}>-</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Estado vazio */}
              {!Object.keys(dayItems).some(categoryId => {
                const items = dayItems[categoryId] || [];
                const filteredItems = getFilteredItemsForClient(items, categoryId, selectedCustomer?.id);
                return filteredItems.length > 0;
              }) && (
                  <div style={{
                    textAlign: 'center',
                    color: '#999',
                    fontSize: '10px',
                    marginTop: '20px'
                  }}>
                    <p>
                      {!selectedCustomer || selectedCustomer.id === 'all'
                        ? 'Nenhum item cadastrado'
                        : 'Sem itens para este cliente'
                      }
                    </p>
                    <p>neste dia</p>
                  </div>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}