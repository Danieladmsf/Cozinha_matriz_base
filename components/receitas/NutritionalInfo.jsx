import React, { useState, useEffect, useCallback, useMemo } from "react";
import { NutritionFood, Ingredient, RecipeNutritionConfig, Recipe } from "@/app/api/entities";
import { RecipeEngine, formatters as recipeFormatters } from "@/lib/recipe-engine/RecipeEngine";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Settings, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

export default function NutritionalInfo({ recipe, autoExpand = false }) {
  const [nutritionalData, setNutritionalData] = useState({});
  const [nutritionFoods, setNutritionFoods] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTableVisible, setIsTableVisible] = useState(autoExpand);
  const [selectedNutrients, setSelectedNutrients] = useState({});
  const [portionSize, setPortionSize] = useState('100');
  const [configId, setConfigId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [subRecipes, setSubRecipes] = useState({}); // Mapa de ID -> Objeto Receita
  const [isLoadingSubRecipes, setIsLoadingSubRecipes] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // Unidades para cada tipo de nutriente
  const NUTRIENT_UNITS = {
    energy_kcal: "kcal",
    energy_kj: "kJ",
    protein_g: "g",
    lipid_g: "g",
    cholesterol_mg: "mg",
    carbohydrate_g: "g",
    fiber_g: "g",
    calcium_mg: "mg",
    iron_mg: "mg",
    sodium_mg: "mg",
    potassium_mg: "mg",
    copper_mg: "mg",
    zinc_mg: "mg",
    retinol_mcg: "mcg",
    thiamine_mg: "mg",
    riboflavin_mg: "mg",
    pyridoxine_mg: "mg",
    niacin_mg: "mg",
    vitaminC_mg: "mg",
    saturated_g: "g",
    trans_fat_g: "g",
    total_sugars_g: "g",
    added_sugars_g: "g",
    monounsaturated_g: "g",
    polyunsaturated_g: "g",
    ashes_g: "g",
    magnesium_mg: "mg",
    manganese_mg: "mg",
    phosphorus_mg: "mg"
  };

  // Nome dos nutrientes para exibição
  const NUTRIENT_NAMES = {
    energy_kcal: "Valor Energético (kcal)",
    energy_kj: "Valor Energético (kJ)",
    protein_g: "Proteínas",
    lipid_g: "Gorduras Totais",
    cholesterol_mg: "Colesterol",
    carbohydrate_g: "Carboidratos",
    fiber_g: "Fibra Alimentar",
    calcium_mg: "Cálcio",
    iron_mg: "Ferro",
    sodium_mg: "Sódio",
    potassium_mg: "Potássio",
    copper_mg: "Cobre",
    zinc_mg: "Zinco",
    retinol_mcg: "Retinol",
    thiamine_mg: "Tiamina",
    riboflavin_mg: "Riboflavina",
    pyridoxine_mg: "Piridoxina",
    niacin_mg: "Niacina",
    vitaminC_mg: "Vitamina C",
    saturated_g: "Gorduras Saturadas",
    trans_fat_g: "Gorduras Trans",
    total_sugars_g: "Açúcares Totais",
    added_sugars_g: "Açúcares Adicionados",
    monounsaturated_g: "Gorduras Monoinsaturadas",
    polyunsaturated_g: "Gorduras Poli-insaturadas",
    ashes_g: "Cinzas",
    magnesium_mg: "Magnésio",
    manganese_mg: "Manganês",
    phosphorus_mg: "Fósforo"
  };

  // Organizar nutrientes em categorias
  const CATEGORY_MAP = {
    "Composição Centesimal": [
      "energy_kcal", "energy_kj", "protein_g", 
      "carbohydrate_g", "total_sugars_g", "added_sugars_g", "lipid_g", "fiber_g", "ashes_g"
    ],
    "Minerais": [
      "calcium_mg", "iron_mg", "sodium_mg", "potassium_mg", "copper_mg", "zinc_mg", "magnesium_mg", "manganese_mg", "phosphorus_mg"
    ],
    "Vitaminas": [
      "retinol_mcg", "thiamine_mg", "riboflavin_mg", "pyridoxine_mg", "niacin_mg", "vitaminC_mg"
    ],
    "Gorduras": [
      "saturated_g", "trans_fat_g", "monounsaturated_g", "polyunsaturated_g", "cholesterol_mg"
    ]
  };

  // Carregar dados necessários
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Carregar dados nutricionais e ingredientes
        const [foods, ingredientsData] = await Promise.all([
          NutritionFood.list(),
          Ingredient.list()
        ]);
        
        setNutritionFoods(foods);
        setIngredients(ingredientsData);

        // Carregar configurações da receita
        if (recipe?.id) {
          const configs = await RecipeNutritionConfig.filter({
            recipe_id: recipe.id
          });
          
          if (configs.length > 0) {
            const config = configs[0];
            setPortionSize(config.portion_size || recipe.portion_size || 100);
            setSelectedNutrients(config.selected_nutrients || {});
            setConfigId(config.id);
          } else {
            setPortionSize(recipe.portion_size || 100);
            setDefaultNutrients();
          }
        }
      } catch (error) {setError("Não foi possível carregar os dados nutricionais");
      } finally {
        setLoading(false);
        setIsConfigLoaded(true);
      }
    }
    
    loadData();
  }, [recipe?.id]);

  // Efeito para carregar as sub-receitas vinculadas
  useEffect(() => {
    async function fetchSubRecipes() {
      if (!recipe?.preparations) return;

      const subRecipeIds = [];
      recipe.preparations.forEach(prep => {
        if (prep.recipes) {
          prep.recipes.forEach(r => {
            if (r.recipe_id && !subRecipes[r.recipe_id]) {
              subRecipeIds.push(r.recipe_id);
            }
          });
        }
      });

      if (subRecipeIds.length === 0) return;

      try {
        setIsLoadingSubRecipes(true);
        const uniqueIds = [...new Set(subRecipeIds)];
        const fetchedRecipes = {};
        
        await Promise.all(uniqueIds.map(async (id) => {
          try {
            const rData = await Recipe.getById(id);
            if (rData) fetchedRecipes[id] = rData;
          } catch (e) {
            console.error(`Erro ao carregar sub-receita ${id}:`, e);
          }
        }));

        setSubRecipes(prev => ({ ...prev, ...fetchedRecipes }));
      } finally {
        setIsLoadingSubRecipes(false);
      }
    }

    fetchSubRecipes();
  }, [recipe?.preparations]);

  const setDefaultNutrients = () => {
    const defaultNutrients = {
      energy_kcal: true,
      protein_g: true,
      carbohydrate_g: true,
      total_sugars_g: true,
      added_sugars_g: true,
      lipid_g: true,
      saturated_g: true,
      trans_fat_g: true,
      fiber_g: true,
      sodium_mg: true
    };
    setSelectedNutrients(defaultNutrients);
  };

// Função isolada e escalável para calcular valores nutricionais - MEMOIZADA
  const computeNutritionalValues = useCallback((
    targetRecipe, 
    allIngredients, 
    allSubRecipes, 
    currentNutritionFoods, 
    currentIngredients,
    pSize
  ) => {
    const values = {};
    let totalEffectiveWeight = 0;

    // 1. Processar Ingredientes Diretos
    allIngredients.forEach(recipeIng => {
      const ingredient = currentIngredients.find(i => i.id === (recipeIng.ingredient_id || recipeIng.id));
      if (!ingredient) return;

      const chosenTacoId = recipeIng.chosen_taco_id || ingredient.taco_id;
      const nutritionData = currentNutritionFoods.find(f => f.id === chosenTacoId || f.taco_id === chosenTacoId);
      
      if (!nutritionData) return;

      // USANDO O MOTOR DE CÁLCULO UNIFICADO
      let finalWeight = RecipeEngine.getFinalWeight(recipeIng);
      
      // Normalização para gramas (G)
      if (recipeIng.unit === 'kg' || !recipeIng.unit) {
        finalWeight *= 1000;
      }

      if (finalWeight <= 0) return;
      totalEffectiveWeight += finalWeight;

      console.log(`   🔸 Ingrediente: ${ingredient.name} | Peso: ${finalWeight.toFixed(1)}g`);

      Object.keys(NUTRIENT_UNITS).forEach(nutrient => {
        const val = parseFloat(nutritionData[nutrient]);
        if (!isNaN(val)) {
          const contribution = (val * finalWeight) / 100;
          values[nutrient] = (values[nutrient] || 0) + contribution;
        }
      });
    });

    // 2. Processar Sub-Receitas
    if (targetRecipe?.preparations) {
      targetRecipe.preparations.forEach(prep => {
        if (!prep.recipes) return;

        prep.recipes.forEach(subRecipeItem => {
          const subRecipe = allSubRecipes[subRecipeItem.recipe_id];
          if (!subRecipe) return;

          let quantityUsed = RecipeEngine.parseValue(subRecipeItem.used_weight);
          if (subRecipeItem.unit === 'kg' || !subRecipeItem.unit) quantityUsed *= 1000;
          
          if (quantityUsed <= 0) return;
          totalEffectiveWeight += quantityUsed;

          console.log(`   🔹 Sub-receita: ${subRecipe.name} | Usado: ${quantityUsed}g`);
          
          const subIngredients = [];
          if (subRecipe.preparations) {
            subRecipe.preparations.forEach(p => {
              if (p.ingredients) subIngredients.push(...p.ingredients);
            });
          }

          const subTotalWeight = RecipeEngine.parseValue(subRecipe.yield_weight || subRecipe.total_weight) * 1000;
          if (subTotalWeight <= 0) return;

          const subValues = {};
          subIngredients.forEach(sIng => {
            const sBase = currentIngredients.find(i => i.id === (sIng.ingredient_id || sIng.id));
            if (!sBase) return;
            const sNutri = currentNutritionFoods.find(f => f.id === (sIng.chosen_taco_id || sBase.taco_id));
            if (!sNutri) return;

            let sWeight = RecipeEngine.getFinalWeight(sIng);
            if (sIng.unit === 'kg' || !sIng.unit) sWeight *= 1000;

            Object.keys(NUTRIENT_UNITS).forEach(n => {
              const v = parseFloat(sNutri[n]);
              if (!isNaN(v)) subValues[n] = (subValues[n] || 0) + (v * sWeight) / 100;
            });
          });

          const ratio = quantityUsed / subTotalWeight;
          Object.keys(subValues).forEach(n => {
            values[n] = (values[n] || 0) + (subValues[n] * ratio);
          });
        });
      });
    }

    // 3. Resultado Final
    // Retornamos os valores TOTAIS da receita e o peso efetivo total
    return { values, totalEffectiveWeight };
  }, []); // NUTRIENT_UNITS e RecipeEngine são estáveis

  const calculateNutrition = useCallback(() => {
    if (!isTableVisible || !isConfigLoaded || !nutritionFoods.length || !ingredients.length) return;

    // Achatar ingredientes
    let allIngredients = [];
    if (recipe?.preparations) {
      recipe.preparations.forEach(prep => {
        if (prep.ingredients) {
          allIngredients = [...allIngredients, ...prep.ingredients];
        }
      });
    }

    if (!allIngredients.length && (!recipe?.preparations || !recipe.preparations.some(p => p.recipes?.length))) {
      return;
    }

    console.group(`🥗 [Cálculo Nutricional] - ${recipe?.name || 'Receita'}`);
    
    // Calculamos os valores totais da receita
    const { values: totalValues, totalEffectiveWeight } = computeNutritionalValues(
      recipe,
      allIngredients,
      subRecipes,
      nutritionFoods,
      ingredients,
      parseFloat(portionSize)
    );

    // O Rendimento Final é o que manda para as porções (conforme pedido pelo usuário)
    const yieldWeightKg = RecipeEngine.parseValue(recipe?.yield_weight || recipe?.total_weight);
    const yieldWeightG = yieldWeightKg * 1000;
    
    // Se o rendimento final for zero (não preenchido), usamos o peso efetivo dos ingredientes
    const finalYieldG = yieldWeightG > 0 ? yieldWeightG : totalEffectiveWeight;
    const pSize = parseFloat(portionSize) || 100;

    // Gerar os dois conjuntos de dados: 100g e Porção
    const values100g = {};
    const valuesPortion = {};

    if (finalYieldG > 0) {
      Object.keys(totalValues).forEach(nutrient => {
        // Densidade Nutricional (por 100g de produto pronto)
        values100g[nutrient] = (totalValues[nutrient] / finalYieldG) * 100;
        // Valor por Porção
        valuesPortion[nutrient] = (totalValues[nutrient] / finalYieldG) * pSize;
      });
    }

    const servingsPerPackage = finalYieldG > 0 ? (finalYieldG / pSize) : 0;

    console.log(`📊 Peso Total: ${totalEffectiveWeight.toFixed(0)}g | Rendimento: ${finalYieldG.toFixed(0)}g`);
    console.log(`🍽️ Porção: ${pSize}g | Porções por embalagem: ${servingsPerPackage.toFixed(1)}`);
    console.groupEnd();

    setNutritionalData({
      hundred: values100g,
      portion: valuesPortion,
      servings: servingsPerPackage,
      yield: finalYieldG
    });
  }, [recipe, nutritionFoods, ingredients, portionSize, isTableVisible, subRecipes, computeNutritionalValues]);

  // Recalcular quando dados necessários estiverem disponíveis
  useEffect(() => {
    calculateNutrition();
  }, [calculateNutrition]);

  // Sincronizar visibilidade com a prop autoExpand
  useEffect(() => {
    if (autoExpand) setIsTableVisible(true);
  }, [autoExpand]);

  const calculateVDR = (nutrientId, nutrientValue) => {
    const vdr = {
      energy_kcal: 2000,
      protein_g: 50,
      lipid_g: 78,
      carbohydrate_g: 275,
      fiber_g: 28,
      calcium_mg: 1300,
      iron_mg: 18,
      sodium_mg: 2300
    };

    if (!nutrientValue || !vdr[nutrientId]) return '0%';

    const percentage = (nutrientValue / vdr[nutrientId]) * 100;
    return `${percentage.toFixed(1)}%`;
  };

  // Salvar configurações de nutrientes e porção
  const saveNutritionConfig = async () => {
    if (!recipe?.id) return;

    try {
      setIsSaving(true);
      
      const configData = {
        recipe_id: recipe.id,
        portion_size: parseFloat(portionSize),
        selected_nutrients: selectedNutrients,
        updated_by: "current_user",
        last_updated: new Date().toISOString()
      };

      if (configId) {
        await RecipeNutritionConfig.update(configId, configData);
      } else {
        const newConfig = await RecipeNutritionConfig.create(configData);
        setConfigId(newConfig.id);
      }

      toast({
        title: "Configurações salvas",
        description: "Preferências nutricionais salvas com sucesso.",
      });

    } catch (error) {toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNutrientToggle = (nutrient) => {
    setSelectedNutrients(prev => ({
      ...prev,
      [nutrient]: !prev[nutrient]
    }));
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Informação Nutricional</h4>
        <div className="flex gap-1">
          {/* Controles de porção e nutrientes */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Configurar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Configurações Nutricionais</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="portion">Tamanho da Porção (g)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="portion"
                      type="number"
                      value={portionSize}
                      onChange={(e) => setPortionSize(e.target.value)}
                      min="1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => calculateNutrition()}
                    >
                      Calcular
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Nutrientes para exibir</Label>
                  <Tabs defaultValue="composicao">
                    <TabsList className="grid grid-cols-4 h-9">
                      <TabsTrigger value="composicao" className="text-xs">Composição</TabsTrigger>
                      <TabsTrigger value="minerais" className="text-xs">Minerais</TabsTrigger>
                      <TabsTrigger value="vitaminas" className="text-xs">Vitaminas</TabsTrigger>
                      <TabsTrigger value="gorduras" className="text-xs">Gorduras</TabsTrigger>
                    </TabsList>
                    
                    <ScrollArea className="h-[200px] mt-2">
                      <TabsContent value="composicao" className="space-y-1">
                        {CATEGORY_MAP["Composição Centesimal"].map(nutrient => (
                          <div key={nutrient} className="flex items-center space-x-2">
                            <Checkbox 
                              id={nutrient} 
                              checked={selectedNutrients[nutrient] || false}
                              onCheckedChange={() => handleNutrientToggle(nutrient)}
                            />
                            <Label htmlFor={nutrient} className="text-sm">
                              {NUTRIENT_NAMES[nutrient]}
                            </Label>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="minerais" className="space-y-1">
                        {CATEGORY_MAP["Minerais"].map(nutrient => (
                          <div key={nutrient} className="flex items-center space-x-2">
                            <Checkbox 
                              id={nutrient} 
                              checked={selectedNutrients[nutrient] || false}
                              onCheckedChange={() => handleNutrientToggle(nutrient)}
                            />
                            <Label htmlFor={nutrient} className="text-sm">
                              {NUTRIENT_NAMES[nutrient]}
                            </Label>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="vitaminas" className="space-y-1">
                        {CATEGORY_MAP["Vitaminas"].map(nutrient => (
                          <div key={nutrient} className="flex items-center space-x-2">
                            <Checkbox 
                              id={nutrient} 
                              checked={selectedNutrients[nutrient] || false}
                              onCheckedChange={() => handleNutrientToggle(nutrient)}
                            />
                            <Label htmlFor={nutrient} className="text-sm">
                              {NUTRIENT_NAMES[nutrient]}
                            </Label>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="gorduras" className="space-y-1">
                        {CATEGORY_MAP["Gorduras"].map(nutrient => (
                          <div key={nutrient} className="flex items-center space-x-2">
                            <Checkbox 
                              id={nutrient} 
                              checked={selectedNutrients[nutrient] || false}
                              onCheckedChange={() => handleNutrientToggle(nutrient)}
                            />
                            <Label htmlFor={nutrient} className="text-sm">
                              {NUTRIENT_NAMES[nutrient]}
                            </Label>
                          </div>
                        ))}
                      </TabsContent>
                    </ScrollArea>
                  </Tabs>
                </div>
                
                <Button 
                  onClick={saveNutritionConfig} 
                  className="w-full"
                  disabled={isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsTableVisible(!isTableVisible)}
          >
            {isTableVisible ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isTableVisible && (
            <div className="border-[2px] border-black mt-4 bg-white p-[1px] font-sans text-black max-w-[500px] mx-auto">
              <div className="border border-black">
                {/* Título Principal */}
                <div className="text-center font-black text-lg py-1 border-b-[3px] border-black tracking-tight">
                  INFORMAÇÃO NUTRICIONAL
                </div>

                {/* Meta Info */}
                <div className="p-1 px-2 border-b border-black text-sm leading-tight">
                  <div className="flex justify-start gap-1">
                    <span className="font-medium">Porções por embalagem:</span>
                    <span>{nutritionalData.servings ? Math.floor(nutritionalData.servings) : "0"}</span>
                  </div>
                  <div className="flex justify-start gap-1">
                    <span className="font-medium">Porção:</span>
                    <span>{portionSize}g (1 unidade)</span>
                  </div>
                </div>

                {/* Header da Tabela */}
                <div className="grid grid-cols-12 text-[11px] font-bold border-b-[2px] border-black bg-white">
                  <div className="col-span-6 p-1 border-r border-black"></div>
                  <div className="col-span-2 p-1 text-center border-r border-black">100g</div>
                  <div className="col-span-2 p-1 text-center border-r border-black">{portionSize}g</div>
                  <div className="col-span-2 p-1 text-center">%VD*</div>
                </div>

                {/* Conteúdo da Tabela */}
                {(loading || isLoadingSubRecipes) ? (
                  <div className="flex flex-col items-center justify-center p-12 bg-white">
                    <Loader2 className="h-8 w-8 animate-spin text-black mb-2" />
                    <span className="text-xs">Calculando...</span>
                  </div>
                ) : (
                  <div className="bg-white">
                    {/* Lista Transversal de Nutrientes (Ordem da Legislação) */}
                    {[
                      "energy_kcal", "carbohydrate_g", "total_sugars_g", "added_sugars_g", 
                      "protein_g", "lipid_g", "saturated_g", "trans_fat_g", 
                      "fiber_g", "sodium_mg"
                    ].map((nId, idx) => {
                      const isEnergy = nId.includes('energy');
                      return (
                        <div key={nId} className={`grid grid-cols-12 text-[12px] border-b border-black ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className={`col-span-6 p-1 border-r border-black flex justify-between px-2 ${isEnergy ? 'font-bold' : ''}`}>
                            <span>{NUTRIENT_NAMES[nId]}</span>
                            <span className="text-[10px] opacity-70">({NUTRIENT_UNITS[nId]})</span>
                          </div>
                          <div className="col-span-2 p-1 text-center border-r border-black font-medium">
                            {nutritionalData.hundred?.[nId]?.toFixed(1) || "0"}
                          </div>
                          <div className="col-span-2 p-1 text-center border-r border-black font-bold">
                            {nutritionalData.portion?.[nId]?.toFixed(1) || "0"}
                          </div>
                          <div className="col-span-2 p-1 text-center font-bold">
                            {calculateVDR(nId, nutritionalData.portion?.[nId])}
                          </div>
                        </div>
                      );
                    })}

                    {/* Nutrientes Extras Selecionados (ex: Minerais, Vitaminas) */}
                    {Object.keys(selectedNutrients).map(nId => {
                      if ([
                        "energy_kcal", "energy_kj", "carbohydrate_g", "total_sugars_g", "added_sugars_g", 
                        "protein_g", "lipid_g", "saturated_g", "trans_fat_g", 
                        "fiber_g", "sodium_mg"
                      ].includes(nId)) return null;

                      if (!selectedNutrients[nId]) return null;

                      return (
                        <div key={nId} className="grid grid-cols-12 text-[12px] border-b border-black bg-white">
                          <div className="col-span-6 p-1 border-r border-black px-2">
                            {NUTRIENT_NAMES[nId]} ({NUTRIENT_UNITS[nId]})
                          </div>
                          <div className="col-span-2 p-1 text-center border-r border-black text-gray-600">
                            {nutritionalData.hundred?.[nId]?.toFixed(1) || "0"}
                          </div>
                          <div className="col-span-2 p-1 text-center border-r border-black font-medium">
                            {nutritionalData.portion?.[nId]?.toFixed(1) || "0"}
                          </div>
                          <div className="col-span-2 p-1 text-center">
                            {calculateVDR(nId, nutritionalData.portion?.[nId])}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Rodapé Dinâmico */}
                <div className="p-2 text-[10px] leading-tight italic bg-white">
                  * Percentual de valores diários fornecidos pela porção.
                  <br />
                  ** Valores Diários de referência com base em uma dieta de 2.000 kcal ou 8.400 kJ. Seus valores diários podem ser maiores ou menores dependendo de suas necessidades energéticas.
                </div>
              </div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}