import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
    try {
        // ========================================
        // 1. CARREGAR TODAS AS COLEÇÕES
        // ========================================
        const recipesSnap = await getDocs(collection(db, 'Recipe'));
        const ingredientsSnap = await getDocs(collection(db, 'Ingredient'));

        const recipes = [];
        recipesSnap.forEach(doc => {
            recipes.push({ id: doc.id, ...doc.data() });
        });

        const ingredients = [];
        ingredientsSnap.forEach(doc => {
            ingredients.push({ id: doc.id, ...doc.data() });
        });

        const report = {
            timestamp: new Date().toISOString(),
            totals: {
                recipes: recipes.length,
                ingredients: ingredients.length
            },
            duplicateRecipes: [],
            duplicateIngredients: [],
            ghostStrings: [],
            invalidFields: [],
            orphanIngredients: [],
            emptyRecipes: [],
            suspiciousValues: []
        };

        // ========================================
        // 2. VERIFICAR DUPLICAÇÃO DE RECEITAS
        // ========================================
        const recipeNameMap = new Map();
        recipes.forEach(r => {
            const name = (r.name || r.title || '').trim().toLowerCase();
            if (!name) return;
            if (!recipeNameMap.has(name)) {
                recipeNameMap.set(name, []);
            }
            recipeNameMap.get(name).push({ id: r.id, name: r.name || r.title });
        });

        recipeNameMap.forEach((items, name) => {
            if (items.length > 1) {
                report.duplicateRecipes.push({
                    name,
                    count: items.length,
                    ids: items.map(i => i.id)
                });
            }
        });

        // ========================================
        // 3. VERIFICAR DUPLICAÇÃO DE INGREDIENTES
        // ========================================
        const ingNameMap = new Map();
        ingredients.forEach(ing => {
            const name = (ing.name || '').trim().toLowerCase();
            if (!name) return;
            if (!ingNameMap.has(name)) {
                ingNameMap.set(name, []);
            }
            ingNameMap.get(name).push({ id: ing.id, name: ing.name });
        });

        ingNameMap.forEach((items, name) => {
            if (items.length > 1) {
                report.duplicateIngredients.push({
                    name,
                    count: items.length,
                    ids: items.map(i => i.id),
                    details: items
                });
            }
        });

        // ========================================
        // 4. STRINGS FANTASMAS E CAMPOS SUJOS
        // ========================================
        const ghostPatterns = [
            /undefined/i,
            /null/,
            /NaN/,
            /\[object Object\]/,
            /^\s+$/,        // Apenas espaços
            /^0+\d/,        // Zero à esquerda (ex: "01")
            /^\.,/,         // Começa com ponto e vírgula
        ];

        const checkGhostString = (value, context) => {
            if (typeof value !== 'string') return;
            for (const pattern of ghostPatterns) {
                if (pattern.test(value)) {
                    report.ghostStrings.push({
                        context,
                        value: value.substring(0, 100),
                        pattern: pattern.toString()
                    });
                    break;
                }
            }
        };

        // Verificar em ingredientes do banco
        ingredients.forEach(ing => {
            checkGhostString(ing.name, `Ingrediente [${ing.id}] - name`);
            checkGhostString(String(ing.current_price || ''), `Ingrediente [${ing.id}] ${ing.name} - current_price`);

            // Preço negativo ou absurdo
            const price = parseFloat(String(ing.current_price || '0').replace(',', '.'));
            if (price < 0) {
                report.suspiciousValues.push({
                    context: `Ingrediente [${ing.id}] ${ing.name}`,
                    field: 'current_price',
                    value: ing.current_price,
                    reason: 'Preço negativo'
                });
            }
            if (price > 500) {
                report.suspiciousValues.push({
                    context: `Ingrediente [${ing.id}] ${ing.name}`,
                    field: 'current_price',
                    value: ing.current_price,
                    reason: 'Preço acima de R$500/kg (verificar se é correto)'
                });
            }

            // Nome vazio
            if (!ing.name || ing.name.trim() === '') {
                report.invalidFields.push({
                    collection: 'Ingredient',
                    id: ing.id,
                    field: 'name',
                    reason: 'Nome vazio ou ausente'
                });
            }
        });

        // Verificar em receitas
        recipes.forEach(recipe => {
            const recipeName = recipe.name || recipe.title || 'SEM NOME';
            checkGhostString(recipeName, `Receita [${recipe.id}] - name`);

            // Receita sem preparações
            if (!recipe.preparations || recipe.preparations.length === 0) {
                report.emptyRecipes.push({
                    id: recipe.id,
                    name: recipeName,
                    reason: 'Sem preparações (etapas)'
                });
            }

            // Verificar ingredientes dentro das preparações
            const preps = recipe.preparations || [];
            preps.forEach((prep, prepIdx) => {
                const prepTitle = prep.title || `Etapa ${prepIdx + 1}`;

                // Check: preparação sem processos
                if (!prep.processes || prep.processes.length === 0) {
                    report.invalidFields.push({
                        collection: 'Recipe',
                        id: recipe.id,
                        field: `preparations[${prepIdx}].processes`,
                        reason: `"${recipeName}" > "${prepTitle}" — Etapa sem processos definidos`
                    });
                }

                const ings = prep.ingredients || [];
                ings.forEach((ing, ingIdx) => {
                    const ingName = ing.name || 'SEM NOME';
                    const ctx = `Receita "${recipeName}" > "${prepTitle}" > Ing[${ingIdx}] "${ingName}"`;

                    // Verificar strings fantasmas em todos os campos de peso
                    const weightFields = [
                        'weight_raw', 'weight_clean', 'weight_pre_cooking',
                        'weight_cooked', 'weight_frozen', 'weight_thawed',
                        'weight_portioned', 'current_price'
                    ];

                    weightFields.forEach(field => {
                        if (ing[field] !== undefined && ing[field] !== null) {
                            checkGhostString(String(ing[field]), `${ctx} - ${field}`);

                            // Verificar valores numéricos negativos
                            const val = parseFloat(String(ing[field]).replace(',', '.'));
                            if (val < 0) {
                                report.suspiciousValues.push({
                                    context: ctx,
                                    field,
                                    value: ing[field],
                                    reason: 'Valor negativo'
                                });
                            }
                        }
                    });

                    // Ingrediente sem nome
                    if (!ing.name || ing.name.trim() === '') {
                        report.invalidFields.push({
                            collection: 'Recipe',
                            id: recipe.id,
                            field: `preparations[${prepIdx}].ingredients[${ingIdx}].name`,
                            reason: `Ingrediente sem nome na receita "${recipeName}"`
                        });
                    }

                    // Ingrediente com ID mas sem referência válida no banco
                    if (ing.ingredient_id) {
                        const exists = ingredients.some(i => i.id === ing.ingredient_id);
                        if (!exists) {
                            report.orphanIngredients.push({
                                recipeId: recipe.id,
                                recipeName,
                                prepTitle,
                                ingredientName: ingName,
                                ingredientRefId: ing.ingredient_id,
                                reason: 'ingredient_id aponta para um documento que não existe no banco'
                            });
                        }
                    }
                });

                // Verificar notas com conteúdo fantasma
                const notes = prep.notes || [];
                notes.forEach((note, noteIdx) => {
                    if (note.content) {
                        checkGhostString(note.content, `Receita "${recipeName}" > "${prepTitle}" > Nota[${noteIdx}]`);
                    }
                    if (note.title) {
                        checkGhostString(note.title, `Receita "${recipeName}" > "${prepTitle}" > NotaTitle[${noteIdx}]`);
                    }
                });
            });
        });

        // ========================================
        // 5. RESUMO
        // ========================================
        report.summary = {
            totalIssues:
                report.duplicateRecipes.length +
                report.duplicateIngredients.length +
                report.ghostStrings.length +
                report.invalidFields.length +
                report.orphanIngredients.length +
                report.emptyRecipes.length +
                report.suspiciousValues.length,
            breakdown: {
                duplicateRecipes: report.duplicateRecipes.length,
                duplicateIngredients: report.duplicateIngredients.length,
                ghostStrings: report.ghostStrings.length,
                invalidFields: report.invalidFields.length,
                orphanIngredients: report.orphanIngredients.length,
                emptyRecipes: report.emptyRecipes.length,
                suspiciousValues: report.suspiciousValues.length
            }
        };

        return NextResponse.json(report, { status: 200 });
    } catch (err) {
        console.error('Audit error:', err);
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
    }
}
