/**
 * Recipe Propagation Service
 * 
 * Serviço centralizado para propagar mudanças de uma receita pai para suas filhas.
 * Este é o ÚNICO ponto de entrada para atualização em cadeia.
 * 
 * @module lib/services/recipePropagationService
 */

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { RecipeEngine } from "@/lib/recipe-engine/RecipeEngine";
import { getCollectionRef, getDocRef } from "@/app/api/entities";

/**
 * Propaga mudanças de uma receita pai para todas as filhas
 * 
 * @param {string} parentId - ID da receita pai que foi alterada
 * @param {object} parentData - Dados atualizados da receita pai
 * @returns {Promise<{count: number, updated: string[], errors: string[]}>}
 */
export async function propagateChangesToChildren(parentId, parentData) {
    const result = {
        count: 0,
        updated: [],
        errors: []
    };

    try {
        console.log(`[PROPAGATION] Iniciando propagação para filhos de: ${parentData.name} (${parentId})`);

        // 1. Construir mapa de ingredientes do pai para lookup rápido
        const parentIngredientMap = buildIngredientMap(parentData);

        if (parentIngredientMap.size === 0) {
            console.log('[PROPAGATION] Receita pai não tem ingredientes. Nada a propagar.');
            return result;
        }

        // 2. Buscar todas as receitas que têm este pai registrado
        const childrenQuery = query(
            getCollectionRef('Recipe'),
            where('parent_recipes', 'array-contains-any', [
                { id: parentId },
                // Firestore não suporta partial object match, então precisamos de outra estratégia
            ])
        );

        // Alternativa: Query por campo simples
        // Como array-contains-any não funciona com objetos parciais,
        // vamos fazer uma query mais ampla e filtrar client-side
        const allRecipesSnap = await getDocs(collection(db, 'Recipe'));

        const childDocs = [];
        allRecipesSnap.forEach(docSnap => {
            const data = docSnap.data();
            // Verificar se parent_recipes contém o parentId
            const hasParent = (data.parent_recipes || []).some(p => p.id === parentId);
            // Também verificar se alguma preparação tem source_recipe_id
            const hasSourcePrep = (data.preparations || []).some(p => p.source_recipe_id === parentId);

            if (hasParent || hasSourcePrep) {
                childDocs.push({ id: docSnap.id, data });
            }
        });

        console.log(`[PROPAGATION] Encontradas ${childDocs.length} receitas filhas.`);

        if (childDocs.length === 0) {
            return result;
        }

        // 3. Atualizar cada receita filha
        for (const child of childDocs) {
            try {
                const updateResult = await updateChildRecipe(child, parentId, parentIngredientMap);
                if (updateResult.changed) {
                    result.count++;
                    result.updated.push(child.data.name || child.id);
                    console.log(`[PROPAGATION] Atualizada: ${child.data.name}`);
                }
            } catch (err) {
                console.error(`[PROPAGATION] Erro ao atualizar ${child.data.name}:`, err);
                result.errors.push(child.data.name || child.id);
            }
        }

        return result;

    } catch (error) {
        console.error('[PROPAGATION] Falha geral:', error);
        result.errors.push(error.message);
        return result;
    }
}

/**
 * Constrói mapa de ingredientes do pai para lookup rápido
 * Chave: ID original do ingrediente | Valor: Dados atualizados
 */
function buildIngredientMap(parentData) {
    const map = new Map();

    const parseNum = (val) => {
        if (val === undefined || val === null) return 0;
        return parseFloat(String(val).replace(',', '.')) || 0;
    };

    (parentData.preparations || []).forEach(prep => {
        (prep.ingredients || []).forEach(ing => {
            // CRÍTICO: Usar ingredient_id como chave primária
            const key = ing.ingredient_id || ing.id;
            if (key) {
                const data = {
                    price: parseNum(ing.price),
                    cost_clean: parseNum(ing.cost_clean),
                    weight_raw: parseNum(ing.weight_raw),
                    weight_clean: parseNum(ing.weight_clean) || parseNum(ing.weight_raw),
                    weight_pre_cooking: parseNum(ing.weight_pre_cooking) || parseNum(ing.weight_clean) || parseNum(ing.weight_raw),
                    weight_cooked: parseNum(ing.weight_cooked),
                    yield_percent: parseNum(ing.yield_percent)
                };
                console.log(`[PROPAGATION] Ingrediente ${ing.name}: raw=${data.weight_raw}, pre_cook=${data.weight_pre_cooking}, cooked=${data.weight_cooked}`);
                map.set(key, data);
            }
        });
    });

    console.log(`[PROPAGATION] Mapa construído com ${map.size} ingredientes`);
    return map;
}

/**
 * Atualiza uma receita filha com os dados do pai
 */
async function updateChildRecipe(child, parentId, parentIngredientMap) {
    let hasChanges = false;
    const updatedPreparations = [];

    for (const prep of (child.data.preparations || [])) {
        // Só processar preparações que vêm deste pai
        if (prep.source_recipe_id !== parentId) {
            updatedPreparations.push(prep);
            continue;
        }

        // Atualizar ingredientes desta preparação
        const updatedIngredients = (prep.ingredients || []).map(ing => {
            // Buscar no mapa do pai pelo source_ingredient_id
            const parentIng = parentIngredientMap.get(ing.source_ingredient_id);

            if (!parentIng) {
                // Não encontrou correspondência, manter como está
                return ing;
            }

            // Calcular novos valores
            const updates = calculateIngredientUpdates(ing, parentIng);

            if (updates.changed) {
                hasChanges = true;
                return { ...ing, ...updates.values };
            }

            return ing;
        });

        updatedPreparations.push({
            ...prep,
            ingredients: updatedIngredients
        });
    }

    // 4. Salvar se houve mudanças
    if (hasChanges) {
        const childRef = getDocRef('Recipe', child.id);
        await updateDoc(childRef, {
            preparations: updatedPreparations,
            last_propagation: new Date(),
            propagated_from: parentId
        });
    }

    return { changed: hasChanges };
}

/**
 * Calcula atualizações para um ingrediente baseado nas PROPORÇÕES do pai
 */
function calculateIngredientUpdates(childIng, parentIng) {
    const updates = { changed: false, values: {} };
    const tolerance = 0.0001;

    const parseNum = (val) => {
        if (val === undefined || val === null) return 0;
        return parseFloat(String(val).replace(',', '.')) || 0;
    };

    // 1. Atualizar preço bruto
    const childPrice = parseNum(childIng.price);
    if (Math.abs(childPrice - parentIng.price) > tolerance) {
        updates.values.price = parentIng.price;
        updates.changed = true;
    }

    // 2. Atualizar custo limpo
    const childCostClean = parseNum(childIng.cost_clean);
    if (Math.abs(childCostClean - parentIng.cost_clean) > tolerance) {
        updates.values.cost_clean = parentIng.cost_clean;
        updates.changed = true;
    }

    // 3. Calcular proporções do pai
    const parentRaw = parentIng.weight_raw;
    const parentClean = parentIng.weight_clean || parentRaw;
    const parentPreCook = parentIng.weight_pre_cooking || parentClean;
    const parentCooked = parentIng.weight_cooked || parentPreCook;

    if (parentRaw > 0) {
        const cleanRatio = parentRaw > 0 ? parentClean / parentRaw : 1;
        const preCookRatio = parentClean > 0 ? parentPreCook / parentClean : 1;
        const cookRatio = parentPreCook > 0 ? parentCooked / parentPreCook : 1;

        const childRaw = parseNum(childIng.weight_raw);

        if (childRaw > 0) {
            // Aplicar proporções
            const expectedClean = childRaw * cleanRatio;
            const expectedPreCook = expectedClean * preCookRatio;
            const expectedCooked = expectedPreCook * cookRatio;

            // Verificar weight_clean
            const currentClean = parseNum(childIng.weight_clean);
            if (Math.abs(currentClean - expectedClean) > 0.001) {
                updates.values.weight_clean = expectedClean.toFixed(3);
                updates.changed = true;
            }

            // Verificar weight_pre_cooking
            const currentPreCook = parseNum(childIng.weight_pre_cooking);
            if (Math.abs(currentPreCook - expectedPreCook) > 0.001) {
                updates.values.weight_pre_cooking = expectedPreCook.toFixed(3);
                updates.changed = true;
            }

            // Verificar weight_cooked
            const currentCooked = parseNum(childIng.weight_cooked);
            if (Math.abs(currentCooked - expectedCooked) > 0.001) {
                updates.values.weight_cooked = expectedCooked.toFixed(3);
                updates.changed = true;
            }
        }
    }

    return updates;
}

/**
 * Propaga atualizações de um ingrediente para TODAS as receitas que o utilizam.
 * Recalcula pesos, custos e métricas das receitas afetadas.
 * 
 * @param {string} ingredientId - ID do ingrediente atualizado
 * @param {object} ingredientData - Dados novos do ingrediente (price, technical_data, unit)
 * @returns {Promise<{count: number, updated: string[], errors: string[]}>}
 */
export async function propagateIngredientUpdate(ingredientId, ingredientData) {
    const result = {
        count: 0,
        updated: [],
        errors: []
    };

    console.log(`[PROPAGATION] ========================================`);
    console.log(`[PROPAGATION] Iniciando propagação para: "${ingredientData.name}" (ID: ${ingredientId})`);
    console.log(`[PROPAGATION] technical_data recebido:`, JSON.stringify(ingredientData.technical_data, null, 2));
    console.log(`[PROPAGATION] current_price:`, ingredientData.current_price);

    try {
        // 1. Buscar TODAS as receitas
        const allRecipesSnap = await getDocs(getCollectionRef('Recipe'));
        console.log(`[PROPAGATION] Total de receitas no Firestore: ${allRecipesSnap.size}`);

        const affectedRecipes = [];
        allRecipesSnap.forEach(docSnap => {
            const data = docSnap.data();
            const preps = data.preparations || [];
            
            // Log detalhado de matching
            let foundMatch = false;
            preps.forEach((prep, pIdx) => {
                (prep.ingredients || []).forEach((ing, iIdx) => {
                    const matchById = ing.ingredient_id === ingredientId;
                    const matchByName = ing.name === ingredientData.name;
                    if (matchById || matchByName) {
                        foundMatch = true;
                        console.log(`[PROPAGATION] ✅ MATCH na receita "${data.name}" (${docSnap.id}), prep[${pIdx}], ing[${iIdx}]: ingredient_id="${ing.ingredient_id}", name="${ing.name}" | matchById=${matchById}, matchByName=${matchByName}`);
                    }
                });
            });

            if (foundMatch) {
                affectedRecipes.push({ id: docSnap.id, data });
            }
        });

        console.log(`[PROPAGATION] Receitas afetadas: ${affectedRecipes.length}`);
        if (affectedRecipes.length === 0) {
            console.log(`[PROPAGATION] ⚠️ NENHUMA receita encontrada com este ingrediente. Verifique se ingredient_id ou name batem.`);
            
            // Debug: listar amostras de ingredientes das primeiras 3 receitas
            let sampleCount = 0;
            allRecipesSnap.forEach(docSnap => {
                if (sampleCount >= 3) return;
                const data = docSnap.data();
                const preps = data.preparations || [];
                const ingNames = preps.flatMap(p => (p.ingredients || []).map(i => `"${i.name}" (ingredient_id: ${i.ingredient_id || 'N/A'})`));
                if (ingNames.length > 0) {
                    console.log(`[PROPAGATION] Amostra - Receita "${data.name}": [${ingNames.join(', ')}]`);
                    sampleCount++;
                }
            });
            
            return result;
        }

        // 2. Atualizar cada receita
        const parseNum = (v) => parseFloat(String(v).replace(',', '.')) || 0;
        const formatNum = (v) => String(v.toFixed(3)).replace('.', ',');

        for (const recipe of affectedRecipes) {
            try {
                let hasChanges = false;
                const updatedPreparations = (recipe.data.preparations || []).map(prep => {
                    const newIngredients = (prep.ingredients || []).map(ing => {
                        // Verifica match por ID ou Nome
                        if (ing.ingredient_id === ingredientId || ing.name === ingredientData.name) {
                            hasChanges = true;

                            // RECÁLCULO DE PESOS (Lógica "Enforce Standards")
                            const tech = ingredientData.technical_data || {};
                            let newWeights = {};

                            const hasValidTech = (v) => typeof v === 'number' && !isNaN(v);

                            // 1. Descongelamento
                            const weightFrozen = parseNum(ing.weight_frozen);
                            if (weightFrozen > 0) {
                                const loss = hasValidTech(tech.thawing_loss_pct) ? parseNum(tech.thawing_loss_pct) : 0;
                                const val = weightFrozen * (1 - loss / 100);
                                newWeights.weight_thawed = formatNum(val);
                            }

                            // 2. Limpeza
                            const weightThawed = newWeights.weight_thawed ? parseNum(newWeights.weight_thawed) : (parseNum(ing.weight_thawed) || parseNum(ing.weight_raw));
                            if (weightThawed > 0) {
                                const loss = hasValidTech(tech.cleaning_loss_pct) ? parseNum(tech.cleaning_loss_pct) : 0;
                                const val = weightThawed * (1 - loss / 100);
                                newWeights.weight_clean = formatNum(val);
                            }

                            // 3. Cocção
                            const weightClean = newWeights.weight_clean ? parseNum(newWeights.weight_clean) : (parseNum(ing.weight_clean) || parseNum(ing.weight_raw));
                            if (weightClean > 0) {
                                const loss = hasValidTech(tech.cooking_loss_pct) ? parseNum(tech.cooking_loss_pct) : 0;
                                const val = weightClean * (1 - loss / 100);
                                newWeights.weight_cooked = formatNum(val);
                            }

                            console.log(`[PROPAGATION] Recalculou pesos para "${ing.name}" na receita "${recipe.data.name}":`, JSON.stringify(newWeights));

                            return {
                                ...ing,
                                current_price: ingredientData.current_price,
                                unit: ingredientData.unit || ing.unit,
                                technical_data: ingredientData.technical_data, // Atualiza metadados
                                ...newWeights // Aplica novos pesos calculados
                            };
                        }
                        return ing;
                    });

                    return { ...prep, ingredients: newIngredients };
                });

                if (hasChanges) {
                    // Recalcular métricas da receita (Custo Total, etc)
                    const metrics = RecipeEngine.calculateRecipeMetrics(recipe.data, updatedPreparations);
                    console.log(`[PROPAGATION] Métricas recalculadas para "${recipe.data.name}":`, JSON.stringify(metrics));

                    // Sanitizar: Firestore rejeita undefined, trocar por 0
                    const safe = (v) => (v !== undefined && v !== null && !isNaN(v)) ? v : 0;

                    // Salvar no Firestore
                    await updateDoc(getDocRef('Recipe', recipe.id), {
                        preparations: updatedPreparations,
                        total_cost: safe(metrics.total_cost),
                        cost_per_kg_raw: safe(metrics.cost_per_kg_raw),
                        cost_per_kg_yield: safe(metrics.cost_per_kg_yield),
                        total_weight: safe(metrics.total_weight),
                        yield_weight: safe(metrics.yield_weight),
                        yield_percentage: safe(metrics.yield_percentage),
                        updatedAt: new Date()
                    });

                    console.log(`[PROPAGATION] ✅ Receita "${recipe.data.name}" (${recipe.id}) salva no Firestore com sucesso!`);

                    result.count++;
                    result.updated.push(recipe.data.name);

                    // CASCATA: Propagar mudança para filhas desta receita
                    const updatedRecipeData = {
                        ...recipe.data,
                        preparations: updatedPreparations,
                        ...metrics,
                        updatedAt: new Date()
                    };
                    await propagateChangesToChildren(recipe.id, updatedRecipeData);
                }

            } catch (err) {
                console.error(`[PROPAGATION] ❌ Erro ao atualizar receita "${recipe.data.name}":`, err);
                console.error(`[PROPAGATION] Stack:`, err.stack);
                result.errors.push(recipe.data.name + ': ' + err.message);
            }
        }

        console.log(`[PROPAGATION] ========================================`);
        console.log(`[PROPAGATION] RESULTADO FINAL: ${result.count} atualizadas, ${result.errors.length} erros`);
        console.log(`[PROPAGATION] Receitas atualizadas:`, result.updated);
        console.log(`[PROPAGATION] Erros:`, result.errors);
        return result;

    } catch (error) {
        console.error('[PROPAGATION] ❌ ERRO FATAL:', error);
        console.error('[PROPAGATION] Stack:', error.stack);
        result.errors.push(error.message);
        return result;
    }
}
