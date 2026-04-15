import { useState, useCallback } from 'react';
import { CategoryTree } from '@/app/api/entities';

/**
 * Hook para gerenciar as funções exclusivas do SmartCategorySelector e sua árvore agrupada.
 */
export function useRecipeCategorization({
    recipeData,
    selectedFilterCategories,
    handleCategoryChange,
    setCategorySelectorOpen
}) {
    const [groupedCategories, setGroupedCategories] = useState([]);
    const [allCategories, setAllCategories] = useState([]);

    const loadCategoriesTree = useCallback(async (currentFilters = []) => {
        console.log("🧪 [DEBUG] loadCategoriesTree: Running Type-based Grouping with Custom Format (v2)");
        try {
            const data = await CategoryTree.list();
            setAllCategories(data); // Populate allCategories for the filter menu

            // Normalização canônica — garante compatibilidade com cache e dados antigos
            const normalizeType = (t) => {
                const raw = (t || '').toLowerCase().trim();
                const aliases = {
                    'recipe': 'receitas', 'recipes': 'receitas', 'receita': 'receitas',
                    'product': 'produtos', 'products': 'produtos', 'produto': 'produtos',
                    'ingredient': 'ingredientes', 'ingredients': 'ingredientes', 'ingrediente': 'ingredientes',
                };
                return aliases[raw] || raw || 'receitas';
            };

            // Filtrar categorias baseado nos CategoryTypes selecionados nas configurações
            // Se não houver seleção, mostrar todas. Se houver, filtrar pelo 'type' da categoria
            let recipeCats = data.filter(cat => cat.active !== false);

            if (currentFilters && currentFilters.length > 0) {
                // Normalizar filtros salvos (podem estar em formato antigo como 'recipe')
                const normalizedFilters = currentFilters.map(f => normalizeType(f));
                recipeCats = recipeCats.filter(cat => normalizedFilters.includes(normalizeType(cat.type)));
            }

            const roots = recipeCats
                .filter(c => c.level === 1)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            // 1. Agrupar Roots por Tipo (com normalização canônica)
            const rootsByType = {};
            roots.forEach(root => {
                const type = normalizeType(root.type);
                if (!rootsByType[type]) rootsByType[type] = [];
                rootsByType[type].push(root);
            });

            // 2. Definir Ordem e Labels dos Tipos
            const orderedTypes = ['produtos', 'receitas', 'ingredientes'];
            const typeLabels = {
                'produtos': 'PRODUTOS',
                'receitas': 'RECEITAS',
                'ingredientes': 'INGREDIENTES'
            };

            const presentTypes = Object.keys(rootsByType);

            const sortedTypes = [
                ...orderedTypes.filter(t => presentTypes.includes(t)),
                ...presentTypes.filter(t => !orderedTypes.includes(t))
            ];

            // 3. Criar Grupos (Type as Header -> Flattened Hierarchy as Items)
            const groups = sortedTypes.map(type => {
                const typeRoots = rootsByType[type];
                const typeLabel = typeLabels[type] || type.toUpperCase();

                let typeItems = [];

                // Helper to flatten descendants
                const buildDescendants = (cats, parentId, prefix) => {
                    let list = [];
                    const children = cats
                        .filter(c => c.parent_id === parentId)
                        .sort((a, b) => (a.order || 0) - (b.order || 0));

                    for (const child of children) {
                        // Label Format: PREFIX > CHILD
                        // (Prefix already contains "TYPE | ROOT")
                        const label = `${prefix} > ${child.name}`;

                        list.push({
                            value: child.id,
                            label: label,
                            originalName: child.name,
                            id: child.id
                        });
                        list = [...list, ...buildDescendants(cats, child.id, label)];
                    }
                    return list;
                };

                typeRoots.forEach(root => {
                    // Base Label: ROOT
                    const rootLabel = root.name;

                    // Add Root Item
                    typeItems.push({
                        value: root.id,
                        label: rootLabel,
                        originalName: root.name,
                        id: root.id,
                        isRoot: true
                    });

                    // Add Descendants
                    typeItems.push(...buildDescendants(recipeCats, root.id, rootLabel));
                });

                return {
                    groupName: typeLabel,
                    items: typeItems
                };
            });

            setGroupedCategories(groups);

        } catch (error) {
            console.error("Erro ao carregar árvore de categorias", error);
        }
    }, []);

    const getSelectedCategoryLabel = useCallback(() => {
        if (!recipeData.category) return "Selecione a categoria";
        const allItems = groupedCategories.flatMap(g => g.items);
        // Priorizar busca por category_id (único) para evitar conflito de nomes duplicados
        let found = null;
        if (recipeData.category_id) {
            found = allItems.find(c => c.id === recipeData.category_id);
        }
        if (!found) {
            found = allItems.find(c => c.originalName === recipeData.category);
        }
        return found ? found.label : recipeData.category;
    }, [recipeData.category, recipeData.category_id, groupedCategories]);

    const handleSmartCategorySelect = useCallback((originalName) => {
        handleCategoryChange(originalName);
        setCategorySelectorOpen(false);
    }, [handleCategoryChange, setCategorySelectorOpen]);

    return {
        allCategories,
        groupedCategories,
        loadCategoriesTree,
        getSelectedCategoryLabel,
        handleSmartCategorySelect
    };
}
