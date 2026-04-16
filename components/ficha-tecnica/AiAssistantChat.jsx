'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Check, Loader2, Bot, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/components/ui/use-toast";

export default function AiAssistantChat({ prep, onApplyNotes, onUpdateHistory, onClose }) {
  const { toast } = useToast();
  // Inicializa mensagens do histórico persistente ou mensagem de saudação
  const [messages, setMessages] = useState(prep.aiHistory || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [draftNotes, setDraftNotes] = useState(null);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, draftNotes]);

  // Initial greeting - Apenas se não houver histórico
  useEffect(() => {
    if (prep.aiHistory && prep.aiHistory.length > 0) return;

    const title = prep.title?.toLowerCase() || '';
    const processes = prep.processes || [];
    
    let segment = 'preparo'; // Default
    let iconLabel = 'Ingredientes';
    
    if (title.includes('porcionamento') || processes.includes('portioning')) {
        segment = 'porcionamento';
        iconLabel = 'Porcionamento';
    } else if (title.includes('embalagem') || processes.includes('packaging')) {
        segment = 'embalagem';
        iconLabel = 'Embalagem';
    }

    const initialMsg = { 
        role: 'assistant', 
        content: `Olá! Eu sou seu Chef Digital especializado em **${iconLabel}**. 
        \nComo posso ajudar com a etapa "${prep.title}"? 
        \n\n${segment === 'porcionamento' ? 'Ex: "Divide em bolas de 400g e bota no pote untado com óleo".' : 
            segment === 'embalagem' ? 'Ex: "Usa o pote de 500ml de polipropileno, fecha bem e bota etiqueta com validade".' : 
            'Ex: "Pica a cebola e refoga no fogo baixo por 5 min".'}`
    };

    setMessages([initialMsg]);
    if (onUpdateHistory) onUpdateHistory([initialMsg]);
  }, [prep.title, prep.processes]);

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
      
      const docRef = doc(db, 'settings', 'ai_config');
      const docSnap = await getDoc(docRef);
      
      let aiConfig = {};
      if (docSnap.exists()) {
        aiConfig = docSnap.data();
      }

      if (!aiConfig.apiKey) {
        throw new Error('Chave da API não configurada. Vá no Menu Lateral > Configurações da I.A.');
      }

      // Detecção de Segmento para o Backend
      const title = prep.title?.toLowerCase() || '';
      const processes = prep.processes || [];
      const segment = (title.includes('porcionamento') || processes.includes('portioning')) ? 'porcionamento' : 
                     (title.includes('embalagem') || processes.includes('packaging')) ? 'embalagem' : 'preparo';

      // Preparando os ingredientes e sub-componentes (contexto)
      const ingredientsContext = prep.ingredients?.map(ing => {
        const name = ing.name || 'Ingrediente Desconhecido';
        const gross = ing.grossWeight ? `${ing.grossWeight}kg` : 'Peso não informado';
        const net = ing.netWeight ? `${ing.netWeight}kg` : '---';
        return `- Ingrediente: ${name} | Peso Bruto: ${gross} | Limpo: ${net}`;
      }).join('\n') || '';

      const subComponentsContext = prep.sub_components?.map(sub => 
        `- Item/Embalagem: ${sub.name} | Quantidade: ${sub.quantity || '---'}`
      ).join('\n') || '';

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
          masterPrompt: aiConfig.masterPrompt,
          userInput: userText,
          segment: segment,
          ingredientsContext: `${ingredientsContext}\n${subComponentsContext}`.trim() || 'Nenhum item na lista.'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao comunicar com a Inteligência Artificial.');
      }

      if (data.notes && Array.isArray(data.notes)) {
        setDraftNotes(data.notes);
        const assistantMsg = { role: 'assistant', content: 'Criei o rascunho! Analise a lista abaixo. Se quiser mudar algo, basta me escrever. Se estiver aprovado, clique em "Aplicar Receita".' };
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
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              <Sparkles className="h-5 w-5" />
              Chef I.A.
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-500 hover:text-gray-900">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((msg, idx) => (
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
                                    <span className="bg-orange-100 text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">{idx + 1}</span>
                                    {note.title}
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
