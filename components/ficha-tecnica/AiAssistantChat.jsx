'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Check, Loader2, Bot, User, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTenantId } from "@/lib/auth/tenantStore";
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/components/ui/use-toast";
import { parseNumericValue } from '@/lib/formatUtils';

// Retorna o peso mais relevante do ingrediente, em kg (0 se nenhum).
// Prioriza o peso bruto; se ingrediente não tem limpeza (comum em temperos/líquidos),
// cai no weight_pre_cooking que é a quantidade real usada na cocção.
const getRawWeightKg = (ing) =>
  parseNumericValue(ing.weight_raw) ||
  parseNumericValue(ing.weight_pre_cooking) ||
  parseNumericValue(ing.weight_clean) ||
  parseNumericValue(ing.weight_thawed) ||
  parseNumericValue(ing.weight_frozen) ||
  parseNumericValue(ing.quantity) ||
  0;

// Formata o peso em kg para string legível em gramas
const formatWeightLabel = (kg) => {
  if (!kg || kg <= 0) return 'peso não informado';
  const grams = Math.round(kg * 1000);
  return `${grams}g`;
};

// Identifica se o nome do ingrediente é líquido/condimento (peso alto não deve ser confundido
// com "produto principal" pra fins de cálculo de rendimento).
// Normaliza removendo acentos/diacríticos — cobre grafias inconsistentes tipo "Aguá".
const stripAccents = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const LIQUIDS_AND_SEASONINGS = new Set([
  'agua', 'oleo', 'azeite', 'vinagre', 'leite', 'caldo',
  'sal', 'pimenta', 'louro', 'paprica', 'oregano', 'cominho',
  'manteiga', 'acucar', 'mel', 'noz-moscada', 'canela', 'cravo',
  'coentro', 'salsinha', 'cebolinha', 'tomilho', 'manjericao', 'alecrim'
]);
const isLiquidOrSeasoning = (name = '') => {
  const first = stripAccents(name).split(/\s+/)[0];
  return LIQUIDS_AND_SEASONINGS.has(first);
};

// Resolve ingredientes para etapas que referenciam outras via sub_components (porcionamento/embalagem).
// Se a etapa não tem ingredientes próprios, puxa dos processos de origem.
const resolveIngredientsFromSources = (prep, allPreps = []) => {
  if (prep.ingredients && prep.ingredients.length > 0) return prep.ingredients;
  if (!prep.sub_components || !allPreps.length) return [];
  const resolved = [];
  for (const sub of prep.sub_components) {
    if (sub.source_id) {
      const source = allPreps.find(p => p.id === sub.source_id);
      if (source?.ingredients) resolved.push(...source.ingredients);
    }
  }
  return resolved;
};

// Calcula métricas agregadas da etapa para enviar prontas à IA.
// Retorna null se não há dados suficientes.
const buildStageMetrics = (ingredients = []) => {
  if (!ingredients.length) return null;

  // Identifica ingrediente principal: maior peso pré-cocção (ou bruto) entre os NÃO-líquidos
  let main = null;
  let maxRefKg = 0;
  for (const ing of ingredients) {
    if (isLiquidOrSeasoning(ing.name)) continue;
    const refKg = parseNumericValue(ing.weight_pre_cooking) || parseNumericValue(ing.weight_raw) || 0;
    if (refKg > maxRefKg) { maxRefKg = refKg; main = ing; }
  }
  // Fallback: se só tem líquidos/condimentos, pega o de maior peso em geral
  if (!main) {
    for (const ing of ingredients) {
      const refKg = parseNumericValue(ing.weight_pre_cooking) || parseNumericValue(ing.weight_raw) || 0;
      if (refKg > maxRefKg) { maxRefKg = refKg; main = ing; }
    }
  }
  if (!main) return null;

  const mainRawG = Math.round(parseNumericValue(main.weight_raw) * 1000);
  const mainPreCookG = Math.round((parseNumericValue(main.weight_pre_cooking) || parseNumericValue(main.weight_raw)) * 1000);
  const mainCookedG = Math.round(parseNumericValue(main.weight_cooked) * 1000);

  // Peso total final: convenção observada é o weight_cooked do principal carregar o total do prato.
  // Se não houver, soma weight_cooked de todos; se ninguém tem, cai em weight_clean/raw.
  let sumCookedG = 0, sumCleanG = 0, sumRawG = 0;
  for (const ing of ingredients) {
    sumCookedG += Math.round(parseNumericValue(ing.weight_cooked) * 1000);
    sumCleanG += Math.round(parseNumericValue(ing.weight_clean) * 1000);
    sumRawG += Math.round(parseNumericValue(ing.weight_raw) * 1000);
  }
  const finalG = mainCookedG > 0 ? mainCookedG : (sumCookedG > 0 ? sumCookedG : (sumCleanG > 0 ? sumCleanG : sumRawG));

  // Rendimento
  let rendimentoPct = null, interp = null;
  if (mainPreCookG > 0 && finalG > 0) {
    rendimentoPct = Math.round((finalG / mainPreCookG) * 100);
    if (rendimentoPct > 100) interp = `ganho de ${rendimentoPct - 100}% por absorção/incorporação de água`;
    else if (rendimentoPct < 100) interp = `perda de ${100 - rendimentoPct}% na cocção`;
    else interp = 'peso estável';
  }

  // Perdas por limpeza (apenas onde faz sentido: tem bruto > limpo)
  const cleaningLosses = [];
  for (const ing of ingredients) {
    const rawKg = parseNumericValue(ing.weight_raw);
    const cleanKg = parseNumericValue(ing.weight_clean);
    if (rawKg > 0 && cleanKg > 0 && cleanKg < rawKg) {
      const lossPct = ((rawKg - cleanKg) / rawKg) * 100;
      cleaningLosses.push(`${ing.name} ${lossPct.toFixed(1)}%`);
    }
  }

  return {
    mainIngredient: main.name,
    mainRawG,
    mainPreCookG,
    mainCookedG,
    finalG,
    rendimentoPct,
    interp,
    cleaningLosses
  };
};

// Monta a LISTA DE INGREDIENTES pré-formatada — peso BRUTO (ou fallback), uma linha por item.
// A IA só transcreve isso pra seção INGREDIENTES, sem decidir qual peso usar.
const buildIngredientsListBlock = (ingredients = []) => {
  if (!ingredients.length) return '--- LISTA DE INGREDIENTES (seção 1) ---\nNenhum ingrediente cadastrado.';
  const lines = ingredients.map(ing => {
    const name = ing.name || 'Ingrediente';
    // Prioridade: bruto > pré-cocção > limpo > descongelado > congelado > quantidade
    const kg = parseNumericValue(ing.weight_raw)
      || parseNumericValue(ing.weight_pre_cooking)
      || parseNumericValue(ing.weight_clean)
      || parseNumericValue(ing.weight_thawed)
      || parseNumericValue(ing.weight_frozen)
      || parseNumericValue(ing.quantity)
      || 0;
    return `- ${name}: ${kg > 0 ? `${Math.round(kg * 1000)}g` : 'peso não informado'}`;
  });
  return `--- LISTA DE INGREDIENTES (transcreva EXATAMENTE para a seção 1 INGREDIENTES, NÃO altere pesos nem nomes) ---\n${lines.join('\n')}`;
};

// Monta o bloco de texto das métricas pré-calculadas pra injetar no contexto da IA.
const formatMetricsBlock = (metrics) => {
  if (!metrics || metrics.rendimentoPct === null) {
    return '--- MÉTRICAS PRÉ-CALCULADAS ---\nDados insuficientes para cálculo automático de rendimento.';
  }
  const rawLabel = metrics.mainRawG > 0 ? `${metrics.mainRawG}g` : `${metrics.mainPreCookG}g`;
  const cookedLabel = metrics.mainCookedG > 0 ? `${metrics.mainCookedG}g` : `${metrics.finalG}g`;
  return `--- MÉTRICAS PRÉ-CALCULADAS (use EXATAMENTE estes valores na seção RENDIMENTO FINAL, NÃO recalcule) ---
- ${metrics.mainIngredient} cru: ${rawLabel}
- ${metrics.mainIngredient} cozido: ${cookedLabel}
- Rendimento: ${metrics.rendimentoPct}% (${metrics.interp})
- Perdas por limpeza: ${metrics.cleaningLosses.length ? metrics.cleaningLosses.join(' / ') : 'não aplicável'}`;
};

// Monta resumo detalhado dos ingredientes com todos os pesos — usado como contexto extra no porcionamento.
const buildIngredientsSummaryBlock = (ingredients = []) => {
  if (!ingredients.length) return '';
  const lines = ingredients.map(ing => {
    const name = ing.name || 'Ingrediente';
    const rawG = Math.round(parseNumericValue(ing.weight_raw) * 1000);
    const cleanG = Math.round(parseNumericValue(ing.weight_clean) * 1000);
    const preCookG = Math.round(parseNumericValue(ing.weight_pre_cooking) * 1000);
    const cookedG = Math.round(parseNumericValue(ing.weight_cooked) * 1000);
    const parts = [`- ${name}`];
    if (rawG > 0) parts.push(`bruto: ${rawG}g`);
    if (cleanG > 0 && cleanG !== rawG) parts.push(`limpo: ${cleanG}g`);
    if (preCookG > 0 && preCookG !== cleanG && preCookG !== rawG) parts.push(`pré-cocção: ${preCookG}g`);
    if (cookedG > 0) parts.push(`cozido: ${cookedG}g`);
    return parts.join(' | ');
  });
  return `--- INGREDIENTES DA ETAPA ANTERIOR (contexto completo para gerar rendimento e notas) ---\n${lines.join('\n')}`;
};

export default function AiAssistantChat({ prep, allPreparations = [], onApplyNotes, onUpdateHistory, onUpdateDraft, onAutoSave, onClose }) {
  const { toast } = useToast();
  // Histórico persistente = APENAS conversa real (user + respostas da IA).
  // A saudação NUNCA é salva — ela é recalculada a cada abertura com os dados atuais.
  // Migração: chats antigos salvavam a saudação como 1º item; se for o caso, removemos.
  const [messages, setMessages] = useState(() => {
    const history = prep.aiHistory || [];
    if (history.length > 0 && history[0].role === 'assistant' && history[0].content?.startsWith('Olá')) {
      return history.slice(1);
    }
    return history;
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [draftNotes, setDraftNotes] = useState(() => prep.aiDraft || (prep.notes?.length > 0 ? prep.notes : null));
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, draftNotes]);

  // Constrói a saudação inicial a partir dos dados da etapa.
  // Usa variantes escolhidas deterministicamente pelo prep.id — fica estável entre renders,
  // mas varia entre etapas pra não soar como template repetido.
  const buildInitialGreeting = (prep) => {
    const title = prep.title?.toLowerCase() || '';
    const processes = prep.processes || [];

    let segment = 'preparo';
    if (title.includes('porcionamento') || processes.includes('portioning')) segment = 'porcionamento';
    else if (title.includes('embalagem') || processes.includes('packaging')) segment = 'embalagem';

    const ingredientsList = (prep.ingredients || []).map(ing => {
      const name = ing.name || 'Ingrediente';
      return `• ${name}: ${formatWeightLabel(getRawWeightKg(ing))}`;
    });
    const subList = (prep.sub_components || []).map(sub => {
      const qty = sub.quantity ? ` (${sub.quantity})` : '';
      return `• ${sub.name}${qty}`;
    });
    const allItems = [...ingredientsList, ...subList];

    const exampleBySegment = {
      porcionamento: 'Tipo: "divide em bolas de 400g e bota no pote untado com óleo".',
      embalagem: 'Tipo: "usa o pote de 500ml de polipropileno, fecha bem e bota etiqueta com validade".',
      preparo: 'Tipo: "pica a cebola e refoga no fogo baixo por 5 min".',
    };

    const seed = String(prep.id || prep.title || '');
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    const v = Math.abs(h) % 3;

    if (allItems.length === 0) {
      const variants = [
        `E aí! Bora montar **"${prep.title}"**? Sem ingredientes na ficha ainda — me conta como você faz que eu escrevo o passo a passo.\n\n${exampleBySegment[segment]}`,
        `Beleza, **"${prep.title}"** ainda não tem itens cadastrados. Descreve direto o que rola na panela que eu monto.\n\n${exampleBySegment[segment]}`,
        `Pronto pra **"${prep.title}"**. Como não tenho a lista de insumos, manda como você costuma preparar.\n\n${exampleBySegment[segment]}`,
      ];
      return { role: 'assistant', content: variants[v] };
    }

    const itemsBlock = allItems.join('\n');
    const variants = [
      `Beleza, vamos montar **"${prep.title}"**. Tô vendo na ficha:\n\n${itemsBlock}\n\nQuer que eu rascunhe um passo a passo com isso? Manda **"sim"** ou já me diz como você prefere fazer.`,
      `Peguei aqui **"${prep.title}"**. Os itens da ficha são:\n\n${itemsBlock}\n\nPosso te montar uma base do preparo, ou se preferir, me conta como costuma fazer.`,
      `Pronto pra **"${prep.title}"**. Esses são os ingredientes:\n\n${itemsBlock}\n\nResponde **"sim"** que eu monto o rascunho, ou descreve o preparo do seu jeito.`,
    ];
    return { role: 'assistant', content: variants[v] };
  };

  // Saudação SEMPRE dinâmica — recalculada a cada render com os dados atuais do prep.
  // Se o usuário adicionar/alterar um insumo e reabrir o chat, a saudação refletirá a mudança.
  const greeting = buildInitialGreeting(prep);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    const newUserMsg = { role: 'user', content: userText };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    if (onUpdateHistory) onUpdateHistory(updatedMessages);
    
    setLoading(true);

    try {
      const { db } = await import('@/lib/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const tenantId = getTenantId();
      if (!tenantId) throw new Error("Sessão do usuário (Tenant ID) não encontrada.");

      const docRef = doc(db, 'tenants', tenantId, 'settings', 'ai_config');
      const docSnap = await getDoc(docRef);
      
      let aiConfig = {};
      if (docSnap.exists()) {
        const rootData = docSnap.data();
        const activeProfileId = rootData.activeProfileId;
        
        if (activeProfileId) {
          const profileRef = doc(db, 'tenants', tenantId, 'settings', 'ai_config', 'profiles', activeProfileId);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            aiConfig = profileSnap.data();
          }
        } else {
          aiConfig = rootData;
        }
      }

      if (!aiConfig.apiKey) {
        throw new Error('Chave da API não configurada. Vá no Menu Lateral > Configurações da I.A.');
      }

      // Detecção de Segmento para o Backend
      const title = prep.title?.toLowerCase() || '';
      const processes = prep.processes || [];
      const segment = (title.includes('porcionamento') || processes.includes('portioning')) ? 'porcionamento' : 
                     (title.includes('embalagem') || processes.includes('packaging')) ? 'embalagem' : 'preparo';

      // Resolve ingredientes: para porcionamento/embalagem, busca das etapas referenciadas via sub_components
      const resolvedIngredients = resolveIngredientsFromSources(prep, allPreparations);

      // Preparando os ingredientes e sub-componentes (contexto)
      const ingredientsContext = resolvedIngredients.map(ing => {
        const name = ing.name || 'Ingrediente Desconhecido';
        const rawKg = parseNumericValue(ing.weight_raw);
        const cleanKg = parseNumericValue(ing.weight_clean);
        const preCookKg = parseNumericValue(ing.weight_pre_cooking);
        const cookedKg = parseNumericValue(ing.weight_cooked);
        const useKg = preCookKg || cleanKg || rawKg; // Peso de referência para a receita
        const parts = [`- Ingrediente: ${name}`];
        parts.push(`Quantidade usada: ${useKg > 0 ? `${Math.round(useKg * 1000)}g` : 'não informado'}`);
        if (rawKg > 0 && rawKg !== useKg) parts.push(`Bruto: ${Math.round(rawKg * 1000)}g`);
        if (cleanKg > 0 && cleanKg !== useKg) parts.push(`Pós-limpeza: ${Math.round(cleanKg * 1000)}g`);
        if (cookedKg > 0) parts.push(`Pós-cocção: ${Math.round(cookedKg * 1000)}g`);
        return parts.join(' | ');
      }).join('\n') || '';

      const subComponentsContext = prep.sub_components?.map(sub =>
        `- Item/Embalagem: ${sub.name} | Quantidade: ${sub.quantity || '---'}`
      ).join('\n') || '';

      // Monta contexto condicionalmente:
      // - preparo: envia LISTA DE INGREDIENTES (bruto) — usada na seção INGREDIENTES
      // - porcionamento: envia INGREDIENTES RESOLVIDOS + MÉTRICAS PRÉ-CALCULADAS
      // - embalagem: apenas detalhes técnicos
      const contextParts = [];
      if (segment === 'preparo') {
        contextParts.push(buildIngredientsListBlock(resolvedIngredients));
      }
      contextParts.push(`--- DETALHES TÉCNICOS (use os pesos abaixo APENAS nas instruções de preparo — ex: "picar 13g de alho pós-limpeza") ---\n${ingredientsContext}\n${subComponentsContext}`);
      if (segment === 'porcionamento') {
        contextParts.push(buildIngredientsSummaryBlock(resolvedIngredients));
        contextParts.push(formatMetricsBlock(buildStageMetrics(resolvedIngredients)));
      }
      const finalContext = contextParts.join('\n\n').trim() || 'Nenhum item na lista.';

      // Contexto de conversa e rascunho atual — permite edições incrementais sem perder o que já foi feito
      const historyForContext = updatedMessages.slice(-6).map(m =>
        `[${m.role === 'user' ? 'USUÁRIO' : 'CHEF'}]: ${m.content.substring(0, 300)}`
      ).join('\n');

      // Payload
      const response = await fetch('/api/generate-recipe-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: aiConfig.aiProvider,
          apiKey: aiConfig.apiKey,
          baseUrl: aiConfig.baseUrl,
          userInput: userText,
          segment: segment,
          ingredientsContext: finalContext,
          conversationHistory: historyForContext || null,
          currentDraft: draftNotes ? JSON.stringify(draftNotes) : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const baseMsg = data.error || 'Falha ao comunicar com a Inteligência Artificial.';
        const fullMsg = data.details ? `${baseMsg}\nDetalhe: ${data.details}` : baseMsg;
        throw new Error(fullMsg);
      }

      if (data.clarification) {
        // A IA está pedindo mais detalhes — mostra como mensagem do chat, sem alterar o rascunho.
        // Se vier message junto, prefixa pra dar contexto antes da pergunta.
        const content = data.message ? `${data.message}\n\n${data.clarification}` : data.clarification;
        const assistantMsg = { role: 'assistant', content };
        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);
        if (onUpdateHistory) onUpdateHistory(finalMessages);
      } else if (data.notes && Array.isArray(data.notes)) {
        setDraftNotes(data.notes);
        if (onUpdateDraft) onUpdateDraft(data.notes);
        // Prioriza a fala natural da IA; cai no canned text só se a IA não falou nada.
        const content = data.message
          || 'Pronto, rascunho montado. Dá uma olhada do lado e me diz se ajusta algo, ou clica em "Aplicar Receita" se tá redondo.';
        const assistantMsg = { role: 'assistant', content };
        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);
        if (onUpdateHistory) onUpdateHistory(finalMessages);
      } else if (data.message) {
        // Small talk — só conversa, sem alterar rascunho
        const assistantMsg = { role: 'assistant', content: data.message };
        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);
        if (onUpdateHistory) onUpdateHistory(finalMessages);
      } else {
        throw new Error("Formato inválido retornado pela I.A.");
      }

    } catch (error) {
      console.error(error);
      const errorMsg = { role: 'assistant', content: `[ERRO] ${error.message}` };
      setMessages(prev => [...prev, errorMsg]);
      if (onUpdateHistory) onUpdateHistory([...updatedMessages, errorMsg]);
      toast({
        title: "Ops!",
        description: error.message,
        variant: "destructive"
      });
    } finally {
        setLoading(false);
    }
  };

  const handleClearChat = () => {
    toast({ title: "DEBUG", description: `Iniciando limpeza. Mensagens atuais: ${messages.length}` });
    
    try {
        setMessages([]);
        setDraftNotes(null);
        if (onUpdateHistory) onUpdateHistory([]);
        if (onUpdateDraft) onUpdateDraft(null);
        if (onAutoSave) onAutoSave();
        
        toast({ title: "SUCESSO", description: "Estado foi limpo com sucesso!" });
    } catch (e) {
        toast({ title: "ERRO CRÍTICO", description: e.message, variant: "destructive" });
    }
  };

  const applyDraft = () => {
      if (draftNotes) {
          onApplyNotes(draftNotes);
          onClose();
          toast({
              title: "Mágica Feita!",
              description: "Suas anotações foram injetadas na etapa de preparo."
          });
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-200">
        
        {/* Painel do Chat */}
        <div className="w-full md:w-1/2 flex flex-col bg-gray-50 border-r border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <Sparkles className="h-4 w-4" />
              Chef I.A.
            </div>
            <div className="flex items-center gap-1">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleClearChat} 
                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    title="Limpar Conversa"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-500 hover:text-gray-900">
                    <X className="h-5 w-5" />
                </Button>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {[greeting, ...messages].map((msg, idx) => (
              <div key={idx} className={`flex text-sm ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white shadow-sm border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                 <div className="flex gap-2 max-w-[85%] flex-row">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                       <Bot className="h-4 w-4" />
                    </div>
                    <div className="px-4 py-3 bg-white shadow-sm border border-gray-100 rounded-2xl rounded-tl-none flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        <span className="text-gray-500 text-sm">O Chef está pensando...</span>
                    </div>
                 </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2 relative">
                <Textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Mande as instruções sujas pra panela..."
                    className="min-h-[60px] max-h-[150px] resize-none pr-12 focus-visible:ring-indigo-500 border-gray-300"
                    disabled={loading}
                />
                <Button 
                    onClick={handleSend} 
                    disabled={!input.trim() || loading}
                    className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center">Precione Enter para enviar. A IA pode cometer erros.</p>
          </div>
        </div>

        {/* Painel View Live */}
        <div className="w-full md:w-1/2 flex flex-col bg-slate-50 relative">
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Visualização do Rascunho
                </h3>
                <Button 
                    onClick={applyDraft}
                    disabled={!draftNotes || draftNotes.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm disabled:opacity-50"
                >
                    <Check className="h-4 w-4 mr-2"/>
                    Aplicar Receita
                </Button>
            </div>

            <ScrollArea className="flex-1 p-6 h-full">
                {!draftNotes ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 mt-20">
                        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm">
                            <Sparkles className="h-10 w-10 text-gray-300" />
                        </div>
                        <p className="text-center max-w-sm">
                            Suas anotações processadas aparecerão aqui.<br/> Envie uma mensagem para a inteligência artificial para começar.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-20">
                        {draftNotes.map((note, idx) => (
                            <div key={idx} className="bg-white border top border-amber-200/60 rounded-xl p-5 shadow-sm transform transition-all duration-300 animate-in slide-in-from-bottom-5">
                                <h4 className="font-bold text-orange-800 text-sm mb-3 pb-2 border-b border-orange-100 flex items-center gap-2">
                                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-tighter">
                                        {idx + 1}º Passo
                                    </span>
                                    <span className="uppercase tracking-wide">{note.title}</span>
                                </h4>
                                <div 
                                    className="text-gray-700 text-sm leading-relaxed prose prose-sm prose-orange max-w-none"
                                    dangerouslySetInnerHTML={{ __html: note.content }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
      </div>
    </div>
  );
}
