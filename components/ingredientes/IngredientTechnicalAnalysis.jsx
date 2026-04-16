'use client';

import React, { useState, useEffect } from "react";
import { Ingredient, Employee } from "@/app/api/entities";
import { propagateIngredientUpdate } from "@/lib/services/recipePropagationService";
import { useToast } from "@/components/ui/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Save, Clock, TrendingDown, TrendingUp, Package } from "lucide-react";

export default function IngredientTechnicalAnalysis() {
    const [ingredients, setIngredients] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("ingredientes");
    const { toast } = useToast();

    const [dirtyIds, setDirtyIds] = useState(new Set());

    // Carregar ingredientes e funcionários
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ingData, empData] = await Promise.all([
                Ingredient.list(),
                Employee.list()
            ]);

            setEmployees(empData.filter(e => e.active !== false));

            // Filtrar apenas ativos e ordenar por nome
            const activeIngredients = ingData
                .filter(i => i.active !== false)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(ing => {
                    // Converter tempo (segundos) para minutos para edição
                    const techData = ing.technical_data || {};
                    const timeSeconds = techData.cleaning_time_per_kg || 0;
                    return {
                        ...ing,
                        technical_data: {
                            ...techData,
                            cleaning_time_min: timeSeconds ? (timeSeconds / 60).toString().replace('.', ',') : ''
                        }
                    };
                });

            setIngredients(activeIngredients);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao carregar dados",
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper para converter string com vírgula para float
    const safeParseFloat = (value) => {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        return parseFloat(value.toString().replace(',', '.'));
    };

    // Atualizar valor localmente
    const handleUpdate = (id, field, value) => {
        setDirtyIds(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });

        setIngredients(prev => prev.map(ing => {
            if (ing.id === id) {
                return {
                    ...ing,
                    technical_data: {
                        ...ing.technical_data,
                        [field]: value
                    }
                };
            }
            return ing;
        }));
    };

    // Salvar alterações
    const handleSave = async (ingredient) => {
        setSaving(true);
        try {
            const techData = ingredient.technical_data || {};

            // Converter minutos de volta para segundos
            const cleaningTimeMin = safeParseFloat(techData.cleaning_time_min);
            const cleaningTimeSeconds = cleaningTimeMin * 60;

            const technicalData = {
                thawing_loss_pct: safeParseFloat(techData.thawing_loss_pct),
                cleaning_loss_pct: safeParseFloat(techData.cleaning_loss_pct),
                cooking_loss_pct: safeParseFloat(techData.cooking_loss_pct),
                cleaning_time_per_kg: cleaningTimeSeconds,
                labor_role_id: techData.labor_role_id || null
            };

            console.log('===== [DEBUG SAVE] =====');
            console.log('[DEBUG SAVE] ingredient.id:', ingredient.id);
            console.log('[DEBUG SAVE] ingredient.name:', ingredient.name);
            console.log('[DEBUG SAVE] technicalData que será salva:', JSON.stringify(technicalData, null, 2));

            await Ingredient.update(ingredient.id, {
                technical_data: technicalData
            });

            console.log('[DEBUG SAVE] ✅ Ingredient.update executado com sucesso no Firestore');

            // Remover do conjunto de sujos
            setDirtyIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(ingredient.id);
                return newSet;
            });

            toast({
                title: "Dados atualizados",
                description: `Padrões de ${ingredient.name} salvos com sucesso. Propagando...`
            });

            // PROPAGAÇÃO EM MASSA
            // Atualizar todas as receitas que usam este ingrediente
            try {
                console.log('[DEBUG SAVE] 🚀 Chamando propagateIngredientUpdate...');
                console.log('[DEBUG SAVE] Payload para propagação:', JSON.stringify({
                    id: ingredient.id,
                    name: ingredient.name,
                    current_price: ingredient.current_price,
                    technical_data: technicalData
                }, null, 2));

                const propResult = await propagateIngredientUpdate(ingredient.id, {
                    ...ingredient,
                    technical_data: technicalData
                });

                console.log('[DEBUG SAVE] 📊 Resultado da propagação:', JSON.stringify(propResult, null, 2));

                if (propResult.count > 0) {
                    toast({
                        title: "Propagação Concluída",
                        description: `${propResult.count} receitas atualizadas automáticamente!`,
                        className: "bg-green-50 border-green-200 text-green-800"
                    });
                } else {
                    console.log('[DEBUG SAVE] ⚠️ Propagação retornou count=0. Nenhuma receita afetada.');
                    console.log('[DEBUG SAVE] errors:', propResult.errors);
                }
            } catch (propError) {
                console.error("[DEBUG SAVE] ❌ ERRO na propagação:", propError);
                console.error("[DEBUG SAVE] Stack:", propError.stack);
                toast({
                    title: "Aviso",
                    description: "Erro ao propagar mudanças para receitas: " + propError.message,
                    variant: "warning"
                });
            }
        } catch (error) {
            console.error("[DEBUG SAVE] ❌ ERRO ao salvar ingrediente:", error);
            console.error("[DEBUG SAVE] Stack:", error.stack);
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: error.message
            });
        } finally {
            setSaving(false);
            console.log('===== [DEBUG SAVE] FIM =====');
        }
    };

    // Filtrar ingredientes considerando a aba ativa
    const filteredIngredients = ingredients.filter(ing => {
        const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ing.category?.toLowerCase().includes(searchTerm.toLowerCase());

        const isPackaging = ing.item_type === 'embalagem';

        if (activeTab === 'embalagens') {
            return matchesSearch && isPackaging;
        } else {
            return matchesSearch && !isPackaging;
        }
    });

    // Cálculos auxiliares
    const calculateNetCost = (price, thawingLossPct, cleaningLossPct) => {
        if (!price) return 0;
        const lossThaw = safeParseFloat(thawingLossPct);
        const lossClean = safeParseFloat(cleaningLossPct);
        const yieldThaw = (100 - lossThaw) / 100;
        const yieldClean = (100 - lossClean) / 100;
        const totalYield = yieldThaw * yieldClean;
        if (totalYield <= 0) return 0;
        return (price / totalYield);
    };

    // Custo após cocção (sobre o custo limpo)
    const calculateCookedCost = (cleanCost, cookingLossPct) => {
        if (!cleanCost) return 0;
        const cook = safeParseFloat(cookingLossPct);
        // Valores negativos = ganho de peso (arroz, feijão absorvem água) → custo cai
        if (cook === 0) return null; // sem cocção definida, não exibir
        const yieldCook = (100 - cook) / 100;
        if (yieldCook <= 0) return null; // 100% de cocção = água
        return (cleanCost / yieldCook);
    };

    const calculateLaborCost = (timeMin, roleId) => {
        if (!timeMin || !roleId) return 0;
        const minutes = safeParseFloat(timeMin);
        const role = employees.find(e => e.id === roleId);
        if (!role || !role.salary) return 0;

        const hourlyRate = role.salary / 220;
        const minuteRate = hourlyRate / 60;
        return minutes * minuteRate;
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    if (loading) return <div className="p-8 text-center">Carregando dados de padronização...</div>;

    const renderTable = () => (
        <Table>
            <TableHeader>
                <TableRow className="bg-gray-50">
                    <TableHead className="w-[200px]">Insumo</TableHead>
                    <TableHead>Preço Bruto</TableHead>
                    <TableHead className="text-center bg-blue-50/50">Descongelamento</TableHead>
                    <TableHead className="text-center bg-green-50/50">Limpeza</TableHead>
                    <TableHead className="text-center bg-red-50/50">Cocção</TableHead>
                    <TableHead className="text-center bg-amber-50/50">
                        <div className="flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3" />
                            Mão de Obra
                        </div>
                    </TableHead>

                    <TableHead className="text-right">Custo Limpo/kg</TableHead>
                    <TableHead className="text-right bg-orange-50/50">Custo Pronto/kg</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredIngredients.map((ing) => {
                    const techData = ing.technical_data || {};
                    const cleanLoss = safeParseFloat(techData.cleaning_loss_pct);
                    const thawLoss = safeParseFloat(techData.thawing_loss_pct);
                    const cookLoss = safeParseFloat(techData.cooking_loss_pct);
                    const netCost = calculateNetCost(ing.current_price, techData.thawing_loss_pct, techData.cleaning_loss_pct);
                    const cookedCost = calculateCookedCost(netCost, techData.cooking_loss_pct);

                    // Usar o valor em minutos (string ou number) para cálculo
                    const timePerKgMin = techData.cleaning_time_min;
                    const laborCost = calculateLaborCost(timePerKgMin, techData.labor_role_id);

                    return (
                        <TableRow key={ing.id}>
                            <TableCell>
                                <div className="font-medium">{ing.name}</div>
                                <div className="text-xs text-gray-500">{ing.category}</div>
                            </TableCell>
                            <TableCell>
                                {formatCurrency(ing.current_price)} / {ing.unit}
                            </TableCell>

                            {/* Descongelamento */}
                            <TableCell className="bg-blue-50/30">
                                <div className="flex items-center gap-1 justify-center">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            className="h-8 w-16 text-center text-xs pr-5"
                                            value={techData.thawing_loss_pct || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9,]/g, '');
                                                handleUpdate(ing.id, 'thawing_loss_pct', val);
                                            }}
                                            placeholder="0"
                                        />
                                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-blue-400 pointer-events-none font-medium">%</span>
                                    </div>
                                </div>
                            </TableCell>

                            {/* Limpeza */}
                            <TableCell className="bg-green-50/30">
                                <div className="flex items-center gap-1 justify-center">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            className="h-8 w-16 text-center border-green-200 focus:border-green-500 text-xs pr-5"
                                            value={techData.cleaning_loss_pct || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9,]/g, '');
                                                handleUpdate(ing.id, 'cleaning_loss_pct', val);
                                            }}
                                            placeholder="0"
                                        />
                                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-green-500 pointer-events-none font-medium">%</span>
                                    </div>
                                </div>
                            </TableCell>

                            {/* Cocção */}
                            <TableCell className="bg-red-50/30">
                                <div className="flex items-center gap-1 justify-center">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            className="h-8 w-16 text-center border-red-200 focus:border-red-500 text-xs pr-5"
                                            value={techData.cooking_loss_pct || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9,]/g, '');
                                                handleUpdate(ing.id, 'cooking_loss_pct', val);
                                            }}
                                            placeholder="0"
                                        />
                                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-red-400 pointer-events-none font-medium">%</span>
                                    </div>
                                </div>
                            </TableCell>

                            {/* Mão de Obra (Tempo) */}
                            <TableCell className="bg-amber-50/30">
                                <div className="flex items-center justify-center gap-1">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            className="h-8 w-20 text-center border-amber-200 focus:border-amber-500 text-xs pr-7"
                                            value={techData.cleaning_time_min || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9,]/g, '');
                                                handleUpdate(ing.id, 'cleaning_time_min', val);
                                            }}
                                            placeholder="0"
                                        />
                                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-amber-500 pointer-events-none font-medium">min</span>
                                    </div>
                                </div>
                            </TableCell>


                            <TableCell className="text-right">
                                <div className="font-bold text-gray-700 text-sm">
                                    {formatCurrency(netCost)}
                                </div>
                                {thawLoss > 0 && (
                                    <div className="text-[10px] text-blue-500">-{thawLoss}% gelo</div>
                                )}
                                {cleanLoss > 0 && (
                                    <div className="text-[10px] text-red-500">-{cleanLoss}% limpeza</div>
                                )}
                            </TableCell>

                            {/* Custo Pronto (pós-cocção) */}
                            <TableCell className="text-right bg-orange-50/30">
                                {cookedCost !== null ? (
                                    <>
                                        <div className={`font-bold text-sm ${
                                            cookLoss < 0 ? 'text-green-600' : 'text-orange-700'
                                        }`}>
                                            {formatCurrency(cookedCost)}
                                        </div>
                                        <div className={`flex items-center justify-end gap-0.5 text-[10px] ${
                                            cookLoss < 0 ? 'text-green-500' : 'text-orange-400'
                                        }`}>
                                            {cookLoss < 0
                                                ? <TrendingUp className="h-3 w-3" />
                                                : <TrendingDown className="h-3 w-3" />
                                            }
                                            {cookLoss < 0
                                                ? `+${Math.abs(cookLoss)}% absorção`
                                                : `-${cookLoss}% cocção`
                                            }
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-[11px] text-gray-300">—</span>
                                )}
                            </TableCell>

                            <TableCell>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSave(ing)}
                                    className={`h-8 w-8 p-0 ${dirtyIds.has(ing.id)
                                        ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                                        : "text-green-500 hover:text-green-700 hover:bg-green-50"}`}
                                >
                                    <Save className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table >
    );

    return (
        <div className="space-y-6 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white p-1 rounded-lg shadow-sm border border-gray-200 gap-1 max-w-md mb-4">
                    <TabsTrigger
                        value="ingredientes"
                        className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md text-sm font-medium"
                    >
                        <Package className="w-4 h-4 mr-2" />
                        Ingredientes
                    </TabsTrigger>
                    <TabsTrigger
                        value="embalagens"
                        className="data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-md text-sm font-medium"
                    >
                        <Package className="w-4 h-4 mr-2" />
                        Embalagens
                    </TabsTrigger>
                </TabsList>

                {/* Filtro */}
                <div className="relative mb-4">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${activeTab === 'embalagens' ? 'text-amber-400' : 'text-orange-400'}`} />
                    <Input
                        placeholder={`Buscar ${activeTab}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`pl-10 h-10 border-gray-200 focus:border-${activeTab === 'embalagens' ? 'amber' : 'orange'}-400 focus:ring-${activeTab === 'embalagens' ? 'amber' : 'orange'}-400 rounded-lg text-sm shadow-sm`}
                    />
                </div>

                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <TabsContent value="ingredientes" className="p-0 m-0">
                        {renderTable()}
                    </TabsContent>
                    <TabsContent value="embalagens" className="p-0 m-0">
                        {renderTable()}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
