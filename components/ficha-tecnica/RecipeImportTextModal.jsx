import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Trash2, Send, ChefHat, User, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getTenantId } from '@/lib/auth/tenantStore';

export function RecipeImportTextModal({ 
    isOpen, 
    onClose, 
    onImport, 
    availableIngredients = [],
    availableRecipes = [],
    aiConfig = {}
}) {
    const { toast } = useToast();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [parsedResult, setParsedResult] = useState(null); // { ingredients: [...] }
    const [matchedItems, setMatchedItems] = useState([]); // [{ raw, matched, status }]
    const [stepTitle, setStepTitle] = useState('1º Etapa: Preparo');
    const [registeringIdx, setRegisteringIdx] = useState(null); // índice do item sendo cadastrado
    const scrollRef = useRef(null);

    // Initial greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: "Olá! Sou seu Chef Digital. Diga-me quais ingredientes precisamos para esta etapa ou cole sua receita aqui, e eu vou separar tudo pra você!"
            }]);
        }
    }, [isOpen]);

    // Reset ao fechar
    useEffect(() => {
        if (!isOpen) { // Limpa apenas se for fechado de verdade
            setMessages([]);
            setInputText('');
            setParsedResult(null);
            setMatchedItems([]);
            setLoading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;
        
        const newMessages = [...messages, { role: 'user', content: inputText }];
        setMessages(newMessages);
        setInputText('');
        setLoading(true);

        try {
            // ETAPA 1: Carregar aiConfig do Firestore
            console.log('🔵 [ImportText] ETAPA 1: Carregando aiConfig do Firestore...');
            const { doc, getDoc } = await import('firebase/firestore');
            const tenantId = getTenantId();
            console.log('🔵 [ImportText] TenantId:', tenantId);
            if (!tenantId) throw new Error("Sessão do usuário (Tenant ID) não encontrada.");

            const docRef = doc(db, 'tenants', tenantId, 'settings', 'ai_config');
            const docSnap = await getDoc(docRef);
            console.log('🔵 [ImportText] ai_config existe?', docSnap.exists());

            let resolvedAiConfig = {};
            if (docSnap.exists()) {
                const rootData = docSnap.data();
                console.log('🔵 [ImportText] rootData keys:', Object.keys(rootData));
                const activeProfileId = rootData.activeProfileId;
                console.log('🔵 [ImportText] activeProfileId:', activeProfileId);
                if (activeProfileId) {
                    const profileRef = doc(db, 'tenants', tenantId, 'settings', 'ai_config', 'profiles', activeProfileId);
                    const profileSnap = await getDoc(profileRef);
                    console.log('🔵 [ImportText] profile existe?', profileSnap.exists());
                    if (profileSnap.exists()) {
                        resolvedAiConfig = profileSnap.data();
                    }
                } else {
                    resolvedAiConfig = rootData;
                }
            }

            console.log('🔵 [ImportText] ETAPA 2: Config resolvida. Provider:', resolvedAiConfig.aiProvider, '| API Key presente?', !!resolvedAiConfig.apiKey);
            if (!resolvedAiConfig.apiKey) {
                throw new Error('Chave da API não configurada. Vá no Menu Lateral > Configurações da I.A.');
            }

            // ETAPA 3: Chamar a API
            console.log('🔵 [ImportText] ETAPA 3: Chamando /api/parse-recipe-ingredients...');
            const response = await fetch('/api/parse-recipe-ingredients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    provider: resolvedAiConfig.aiProvider || 'gemini',
                    apiKey: resolvedAiConfig.apiKey,
                    baseUrl: resolvedAiConfig.baseUrl
                })
            });

            console.log('🔵 [ImportText] ETAPA 4: Response status:', response.status);
            const data = await response.json();
            console.log('🔵 [ImportText] ETAPA 5: Response data:', JSON.stringify(data).substring(0, 500));
            if (!response.ok) throw new Error(data.error || 'Erro ao processar texto');

            setMessages([...newMessages, { role: 'assistant', content: data.reply }]);

            if (data.ingredients && Array.isArray(data.ingredients)) {
                console.log('✅ [ImportText] Ingredientes detectados:', data.ingredients.length);
                setParsedResult({ ingredients: data.ingredients });
                performMatching(data.ingredients);
            }
            
        } catch (error) {
            console.error('❌ [ImportText] ERRO CAPTURADO:', error.message, error);
            toast({
                title: "Erro na Importação",
                description: error.message,
                variant: "destructive"
            });
            setMessages([...newMessages, { role: 'assistant', content: `❌ Erro: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const performMatching = (rawIngredients) => {
        console.log("🔍 [AI Match] Iniciando comparação para:", rawIngredients.length, "itens.");
        console.log("📊 [Contexto] Disponíveis: ", availableIngredients.length, "ingredientes,", availableRecipes.length, "receitas.");

        const results = rawIngredients.map(raw => {
            // Normalização agressiva: minúsculo, sem acentos, sem espaços extras
            const normalize = (str) => {
                if (!str) return '';
                return str.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            };

            const searchTerm = normalize(raw.name);
            console.log(`🔎 [Busca] "${raw.name}" → normalizado: "${searchTerm}"`);
            
            // 1. Busca em Ingredientes
            let matchType = 'ingredient';
            let bestMatch = availableIngredients.find(ing => {
                const ingName = normalize(ing.name);
                return ingName === searchTerm;
            });
            
            if (!bestMatch) {
                bestMatch = availableIngredients.find(ing => {
                    const ingName = normalize(ing.name);
                    return ingName.includes(searchTerm) || searchTerm.includes(ingName);
                });
            }

            // 2. Busca em Receitas (Sub-preparos) se não encontrou em ingredientes
            if (!bestMatch) {
                bestMatch = availableRecipes.find(rec => {
                    const recName = normalize(rec.name);
                    return recName === searchTerm;
                });
                
                if (bestMatch) matchType = 'recipe';
                
                if (!bestMatch) {
                    bestMatch = availableRecipes.find(rec => {
                        const recName = normalize(rec.name);
                        return recName.includes(searchTerm) || searchTerm.includes(recName);
                    });
                    if (bestMatch) matchType = 'recipe';
                }
            }

            if (bestMatch) {
                console.log(`✅ [Match] Encontrado: "${bestMatch.name}" (${matchType})`);
            } else {
                console.warn(`❌ [Match] Não encontrado: "${raw.name}"`);
            }

            return {
                raw,
                matched: bestMatch || null,
                status: bestMatch ? 'found' : 'not_found',
                type: bestMatch ? matchType : null
            };
        });

        setMatchedItems(results);
    };

    // Cadastro rápido de ingrediente não encontrado
    const handleQuickRegister = async (item, index) => {
        const tenantId = getTenantId();
        if (!tenantId) {
            toast({ title: 'Erro', description: 'Sessão do usuário não encontrada.', variant: 'destructive' });
            return;
        }

        setRegisteringIdx(index);
        try {
            const ingredientName = item.raw.name
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');

            const newIngredient = {
                name: ingredientName,
                active: true,
                item_type: 'ingrediente',
                current_price: 0,
                unit_type: 'kg',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const colRef = collection(db, 'tenants', tenantId, 'Ingredient');
            const docRef = await addDoc(colRef, newIngredient);

            // Atualiza estado local para mostrar como vinculado
            setMatchedItems(prev => prev.map((m, i) => 
                i === index
                    ? { ...m, status: 'found', type: 'ingredient', matched: { id: docRef.id, name: ingredientName, current_price: 0, unit_type: 'kg' } }
                    : m
            ));

            toast({ title: 'Cadastrado!', description: `"${ingredientName}" foi adicionado ao banco de insumos.` });
        } catch (error) {
            console.error('Erro ao cadastrar ingrediente:', error);
            toast({ title: 'Erro', description: `Falha ao cadastrar: ${error.message}`, variant: 'destructive' });
        } finally {
            setRegisteringIdx(null);
        }
    };

    const handleClearChat = () => {
        if (confirm("Tem certeza que deseja limpar esta conversa e os resultados detectados?")) {
            setMessages([{
                role: 'assistant',
                content: "Olá! Sou seu Chef Digital. Diga-me quais ingredientes precisamos para esta etapa ou cole sua receita aqui, e eu vou separar tudo pra você!"
            }]);
            setParsedResult(null);
            setMatchedItems([]);
            setInputText('');
            toast({ title: "Chat Limpo", description: "O histórico e os resultados foram removidos." });
        }
    };

    const handleConfirmImport = () => {
        if (matchedItems.length === 0) {
            toast({ title: "Lista Vazia", description: "Adicione ingredientes conversando com o Chef primeiro.", variant: "warning" });
            return;
        }

        const itemsToImport = matchedItems
            .filter(item => item.status === 'found')
            .map(item => {
                if (item.type === 'recipe') {
                    return {
                        id: String(Date.now() + Math.random()),
                        recipe_id: item.matched.id,
                        name: item.matched.name,
                        amount: item.raw.amount,
                        unit: item.matched.yield_unit || item.raw.unit || 'Kg',
                        type: 'recipe', // Crucial para o handleImportFromText saber que é uma receita
                        cost: item.matched.total_cost || 0
                    };
                }
                return {
                    ingredient_id: item.matched.id,
                    ...item.matched, // Traz tudo: preço, perdas, etc.
                    weight_raw: item.raw.amount,
                    type: 'ingredient'
                };
            });

        const missingNames = matchedItems
            .filter(item => item.status === 'not_found')
            .map(item => item.raw.name);

        onImport({
            title: stepTitle,
            ingredients: itemsToImport,
            missingItems: missingNames
        });

        if (missingNames.length > 0) {
            toast({
                title: "Importação Parcial",
                description: `Importados ${ingredientsToImport.length} itens. ${missingNames.length} não foram encontrados no banco.`,
                variant: "warning"
            });
        } else {
            toast({
                title: "Sucesso!",
                description: "Todos os ingredientes foram importados e mapeados.",
            });
        }

        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl lg:max-w-5xl w-[95vw] h-[75vh] max-h-[700px] flex flex-col p-0 overflow-hidden bg-gray-50 border-gray-200">
                <DialogHeader className="p-4 border-b bg-white shrink-0 flex flex-row items-center justify-between">
                    <DialogTitle className="flex items-center gap-2 text-indigo-600 text-lg">
                        <Sparkles className="h-5 w-5" />
                        Assistente de Pré-Preparo Dinâmico
                    </DialogTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleClearChat}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                        title="Limpar Conversa"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-0">
                    
                    {/* COLUNA ESQUERDA: CHAT */}
                    <div className="flex flex-col border-r h-full bg-white relative min-h-0">
                        <ScrollArea className="flex-1 p-4 h-full" ref={scrollRef}>
                            <div className="space-y-4 pb-4">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-500'}`}>
                                            {msg.role === 'user' ? <User className="h-4 w-4" /> : <ChefHat className="h-4 w-4" />}
                                        </div>
                                        <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                                            <div className="whitespace-pre-wrap max-w-none">
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex gap-3">
                                         <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                        <div className="p-3 rounded-2xl bg-gray-100 rounded-tl-none text-sm text-gray-400">
                                            Pensando...
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        
                        <div className="p-4 border-t bg-gray-50 shrink-0">
                            <div className="relative">
                                <Textarea 
                                    className="min-h-[80px] bg-white resize-none pr-12 focus-visible:ring-indigo-500"
                                    placeholder="Diga: 'Adicione 3 ovos' ou cole uma lista inteira..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <Button 
                                    size="icon" 
                                    className="absolute bottom-2 right-2 rounded-full h-8 w-8 hover:bg-indigo-600"
                                    onClick={handleSendMessage}
                                    disabled={loading || !inputText.trim()}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 text-center">Pressione Enter para enviar. Shift+Enter para quebrar linha.</p>
                        </div>
                    </div>

                    {/* COLUNA DIREITA: RESULTADOS */}
                    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden min-h-0">
                        <div className="p-4 border-b bg-white shrink-0 flex items-center justify-between shadow-sm z-10">
                            <div className="flex-1 mr-4">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Título da Etapa</label>
                                <input 
                                    type="text" 
                                    value={stepTitle} 
                                    onChange={(e) => setStepTitle(e.target.value)}
                                    className="w-full bg-transparent border-b border-gray-200 focus:border-indigo-500 hover:border-gray-300 transition-colors outline-none pb-1 text-lg font-bold text-slate-800"
                                />
                            </div>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                {matchedItems.length} detectados
                            </Badge>
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            {matchedItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 pt-20">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 opacity-50" />
                                    </div>
                                    <p className="text-sm font-medium">Aguardando ingredientes...</p>
                                    <p className="text-xs text-center max-w-xs">Fale com o chef ao lado para começar a montar o bloco de preparo.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {matchedItems.map((item, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all hover:shadow-sm ${item.status === 'found' ? 'bg-white border-green-100 shadow-sm' : 'bg-orange-50 border-orange-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'found' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {item.status === 'found' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800 text-sm">{item.raw.name}</span>
                                                        <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 font-bold">{item.raw.amount}{item.raw.unit}</Badge>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                                        {item.status === 'found' ? (
                                                            <>
                                                                <span className={`px-1 rounded-[4px] text-[9px] font-bold uppercase ${item.type === 'recipe' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                    {item.type === 'recipe' ? 'Sub-preparo' : 'Insumo'}
                                                                </span>
                                                                Vinculado a: {item.matched.name}
                                                            </>
                                                        ) : (
                                                            '⚠️ Ingrediente não encontrado no banco'
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            {item.status === 'found' ? (
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 uppercase font-semibold">{item.type === 'recipe' ? 'Custo Total' : 'Custo KG/L'}</p>
                                                    <p className={`text-xs font-bold ${item.type === 'recipe' ? 'text-purple-600' : 'text-emerald-600'}`}>
                                                        R$ {(item.type === 'recipe' ? item.matched.total_cost : item.matched.current_price)?.toFixed(2)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800 shrink-0"
                                                    onClick={() => handleQuickRegister(item, idx)}
                                                    disabled={registeringIdx === idx}
                                                >
                                                    {registeringIdx === idx ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                                    ) : (
                                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                                    )}
                                                    Cadastrar
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        <div className="p-4 border-t bg-white shrink-0 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)] z-10 flex justify-end gap-3">
                            <Button variant="ghost" onClick={onClose} className="text-slate-500 hover:text-slate-800">Cancelar</Button>
                            <Button 
                                onClick={handleConfirmImport}
                                disabled={matchedItems.length === 0}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Criar Etapa na Ficha
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
