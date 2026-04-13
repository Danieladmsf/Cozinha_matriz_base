import { useCallback } from 'react';
import { format, addDays, startOfWeek, endOfWeek, getWeek, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { renderFormattedRecipeName } from '@/lib/textHelpers';
import { DAY_NAMES_FULL } from '@/hooks/useAvailableDays';

export const usePrintMenu = () => {
  // Função para obter clientes desmarcados de uma receita
  const getUncheckedClients = useCallback((item, locations, allClientIds) => {
    if (!item || !item.locations || !locations || !allClientIds) return [];

    const isLocationSelected = (itemLocations, locationId) => {
      if (!itemLocations || itemLocations.length === 0) return true;
      if (itemLocations.includes('__NONE_SELECTED__')) return false;
      const validIds = itemLocations.filter(id => allClientIds.includes(id));
      if (validIds.length === allClientIds.length) return true;
      else if (validIds.length === 0) return false;
      else return itemLocations.includes(locationId);
    };

    return locations.filter(location => {
      const isSelected = isLocationSelected(item.locations, location.id);
      return !isSelected;
    });
  }, []);

  const getCustomerName = useCallback((customerId, customers, locations) => {
    const customer = customers?.find(c => c.id === customerId);
    const location = locations?.find(l => l.id === customerId);
    return customer?.name || customer?.razao_social || location?.name || 'Cliente não encontrado';
  }, []);

  // Agregar dados de todos os mealTypes para um dia específico
  const aggregateDayItems = useCallback((weeklyMenu, day) => {
    let dayItems = {};
    if (weeklyMenu?.menu_data) {
      Object.keys(weeklyMenu.menu_data).forEach(mealType => {
        const mealData = weeklyMenu.menu_data[mealType];
        if (typeof mealData !== 'object' || mealType.startsWith('_')) return;
        const dayData = mealData?.[day];
        if (dayData && typeof dayData === 'object') {
          Object.keys(dayData).forEach(categoryId => {
            if (!dayItems[categoryId]) dayItems[categoryId] = [];
            const items = dayData[categoryId];
            if (Array.isArray(items)) {
              dayItems[categoryId] = [...dayItems[categoryId], ...items];
            }
          });
        }
      });
    }
    return dayItems;
  }, []);

  const getPrintStyles = useCallback((colsPerPage) => {
    return `
      @page {
        size: A4 landscape;
        margin: 15mm;
      }
      
      * { box-sizing: border-box; }
      
      body {
        font-size: 11px;
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        width: 100%;
      }
      
      .page-chunk {
        page-break-after: always;
        display: flex;
        flex-direction: column;
        min-height: 100%;
      }
      
      .page-chunk:last-child {
        page-break-after: auto;
      }
      
      .header {
        text-align: center;
        margin-bottom: 15px;
        flex-shrink: 0;
        padding: 10px 0;
      }
      
      .header-line {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-bottom: 10px;
      }
      
      .title { font-size: 18px; font-weight: bold; }
      
      h2 {
        font-size: 14px;
        font-weight: bold;
        margin: 0 0 5px 0;
        text-align: center;
      }
      
      h3 {
        font-size: 12px;
        font-weight: 600;
        margin: 0 0 4px 0;
        background-color: #f0f0f0;
        padding: 2px 4px;
        border-bottom: 1px solid #ccc;
      }
      
      .print-grid {
        display: grid;
        gap: 8px;
        flex: 1;
      }
      
      .print-day {
        border: 2px solid #000;
        padding: 4px;
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .day-header {
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
        margin-bottom: 8px;
        flex-shrink: 0;
      }
      
      .day-content { flex: 1; overflow: hidden; }
      .category-section { margin-bottom: 8px; }
      .recipe-name { font-size: 10px; margin-bottom: 2px; line-height: 1.2; }
      .unchecked-clients { font-size: 8px; color: #d00; text-decoration: line-through; margin-left: 2px; line-height: 1.1; }
      
      .generation-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9px;
        max-width: 800px;
        margin: 0 auto;
      }
      
      .brand { font-weight: 600; color: #333; }
      .week-number { font-size: 14px; font-weight: 600; }
      .date-range { font-size: 12px; color: #555; }
      .client-info { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
    `;
  }, []);

  const generatePrintableMenu = useCallback((weeklyMenu, categories, recipes, customers, locations, customerId, currentDate, getCategoryColor, visibleDays, availableDays) => {
    if (!weeklyMenu) return '';

    // Defaults
    const daysToUse = availableDays || [1, 2, 3, 4, 5];
    const daysPerPage = visibleDays || daysToUse.length;

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const weekNumber = getWeek(currentDate, { weekStartsOn: 1 });
    const year = getYear(currentDate);

    const allClientIds = locations?.filter(loc => loc.active !== false).map(loc => loc.id) || [];

    // Agrupar dias em chunks de daysPerPage para paginação
    const dayChunks = [];
    for (let i = 0; i < daysToUse.length; i += daysPerPage) {
      dayChunks.push(daysToUse.slice(i, i + daysPerPage));
    }

    let html = '';

    dayChunks.forEach((chunk) => {
      // Cada chunk é uma "página" separada na impressão
      html += '<div class="page-chunk">';

      // Cabeçalho repetido em cada página
      html += `
        <div class="header">
          <div class="header-line">
            <span class="title">Cardápio Semanal</span>
            <span class="week-number">Semana ${weekNumber}/${year}</span>
            <span class="date-range">${format(weekStart, 'dd/MM/yyyy', { locale: ptBR })} - ${format(weekEnd, 'dd/MM/yyyy', { locale: ptBR })}</span>
          </div>
          ${customerId !== 'all' ? `<div class="client-info">Cliente: ${getCustomerName(customerId, customers, locations)}</div>` : ''}
          <div class="generation-info" style="margin-top: 5px;">
            <span>Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
            <span class="brand">Cozinha & Afeto</span>
          </div>
        </div>
      `;

      // Grid com N colunas = tamanho do chunk
      html += `<div class="print-grid" style="grid-template-columns: repeat(${chunk.length}, 1fr);">`;

      chunk.forEach(day => {
        const dayDate = addDays(weekStart, day);
        const dayItems = aggregateDayItems(weeklyMenu, day);
        const dayName = (DAY_NAMES_FULL && DAY_NAMES_FULL[day]) || `Dia ${day}`;

        html += `
          <div class="print-day">
            <div class="day-header">
              <h2>${dayName.toUpperCase().replace('-FEIRA', '')} - ${format(dayDate, 'dd/MM/yyyy', { locale: ptBR })}</h2>
            </div>
            <div class="day-content">
        `;

        categories?.forEach(category => {
          const categoryItems = Array.isArray(dayItems[category.id]) ? dayItems[category.id] : [];

          const filteredItems = customerId === 'all'
            ? categoryItems
            : categoryItems.filter(item =>
                !item.locations ||
                item.locations.length === 0 ||
                item.locations.includes(customerId)
              );

          html += `
            <div class="category-section">
              <h3>${category.name}</h3>
              <div>
          `;

          if (filteredItems.length > 0) {
            filteredItems.forEach(item => {
              const recipe = recipes?.find(r => r.id === item.recipe_id);
              if (recipe) {
                const uncheckedClients = customerId === 'all' ? getUncheckedClients(item, locations, allClientIds) : [];
                html += `
                  <div>
                    <div class="recipe-name">${renderFormattedRecipeName(recipe.name)}</div>
                    ${uncheckedClients.length > 0 ? `
                      <div class="unchecked-clients">${uncheckedClients.map(client => client.name).join(', ')}</div>
                    ` : ''}
                  </div>
                `;
              }
            });
          } else {
            html += '<div>-</div>';
          }

          html += '</div></div>';
        });

        html += '</div></div>'; // fecha day-content e print-day
      });

      html += '</div>'; // fecha print-grid
      html += '</div>'; // fecha page-chunk
    });

    return html;
  }, [getCustomerName, getUncheckedClients, aggregateDayItems]);

  const handlePrintCardapio = useCallback((weeklyMenu, categories, recipes, customers, locations, customerId, currentDate, getCategoryColor, visibleDays, availableDays) => {
    if (!weeklyMenu) return;

    const daysToUse = availableDays || [1, 2, 3, 4, 5];
    const daysPerPage = visibleDays || daysToUse.length;
    const colsPerPage = Math.min(daysPerPage, daysToUse.length);

    const printContent = generatePrintableMenu(weeklyMenu, categories, recipes, customers, locations, customerId, currentDate, getCategoryColor, visibleDays, daysToUse);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cardápio Semanal</title>
          <style>
            ${getPrintStyles(colsPerPage)}
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, [generatePrintableMenu, getPrintStyles]);

  return {
    handlePrintCardapio
  };
};