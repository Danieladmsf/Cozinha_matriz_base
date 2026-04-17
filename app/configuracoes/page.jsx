'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, addDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Bot, Save, Key, Loader2, Trash2, CheckCircle2, UserCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTenant } from '@/lib/auth/TenantProvider';

export default function AiSettingsPage() {
    const { toast } = useToast();
    const { tenantId } = useTenant();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profiles, setProfiles] = useState([]);
    
    // Form state (current profile being edited)
    const [formData, setFormData] = useState({
        id: null,
        name: 'Minha Configuração',
        apiKey: '',
        aiProvider: 'gemini',
        baseUrl: '',
        isActive: false
    });

    const [activeProfileId, setActiveProfileId] = useState(null);

    // Fetch all profiles and the active one
    const fetchAllData = async () => {
        try {
            // 1. Get List of Profiles in Tenant Scope
            const profilesCol = collection(db, `tenants/${tenantId}/settings/ai_config/profiles`);
            const q = query(profilesCol, orderBy('updatedAt', 'desc'));
            let snapshot = await getDocs(q);
            let profilesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // MIGRAÇÃO AUTOMÁTICA: Se o tenant não tem perfis, tenta buscar do escopo global antigo
            if (profilesList.length === 0) {
                const oldGlobalProfilesCol = collection(db, 'settings', 'ai_config', 'profiles');
                const oldGlobalQuery = query(oldGlobalProfilesCol, orderBy('updatedAt', 'desc'));
                const oldGlobalSnap = await getDocs(oldGlobalQuery);
                
                if (!oldGlobalSnap.empty) {
                    console.log("[Migração] Movendo chaves antigas para o escopo do usuário...");
                    
                    const migrationPromises = oldGlobalSnap.docs.map(async (oldDocSnap) => {
                        const oldData = oldDocSnap.data();
                        const newDocRef = doc(profilesCol, oldDocSnap.id); // Mantém o mesmo ID
                        await setDoc(newDocRef, oldData);
                        return { id: oldDocSnap.id, ...oldData };
                    });

                    profilesList = await Promise.all(migrationPromises);
                    console.log(`[Migração] ${profilesList.length} chaves migradas com sucesso!`);
                    
                    // Opcionalmente, ativa a primeira chave migrada se nenhuma estiver ativa
                    if (profilesList.length > 0) {
                        const activeDocRef = doc(db, `tenants/${tenantId}/settings`, 'ai_config');
                        await setDoc(activeDocRef, {
                            ...profilesList[0],
                            activeProfileId: profilesList[0].id,
                            updatedAt: new Date().toISOString()
                        }, { merge: true });
                    }
                }
            }

            // 2. Get currently active config in Tenant Scope
            const activeDocRef = doc(db, `tenants/${tenantId}/settings`, 'ai_config');
            const activeDocSnap = await getDoc(activeDocRef);
            
            let activeId = null;
            if (activeDocSnap.exists()) {
                activeId = activeDocSnap.data().activeProfileId || null;
                setActiveProfileId(activeId);
            }

            setProfiles(profilesList);

            // Load either the active profile or the first one into the form
            const profileToLoad = profilesList.find(p => p.id === activeId) || profilesList[0];
            if (profileToLoad) {
                setFormData({
                    ...profileToLoad,
                    id: profileToLoad.id
                });
            }
        } catch (error) {
            console.error("Error fetching AI profiles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleSaveProfile = async () => {
        if (!formData.apiKey || !formData.name) {
            toast({ title: "Erro", description: "Nome e Chave API são obrigatórios.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            // STEP 1: Test Connection
            toast({ title: "Validando...", description: "Testando a chave com o provedor..." });
            const testResponse = await fetch('/api/generate-recipe-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testMode: true,
                    provider: formData.aiProvider,
                    apiKey: formData.apiKey,
                    baseUrl: formData.baseUrl
                })
            });

            const testResult = await testResponse.json();
            if (!testResponse.ok && !testResult.warning) {
                throw new Error(testResult.error || "A chave foi recusada.");
            }

            // STEP 2: Save to profiles collection
            const profileData = {
                name: formData.name,
                apiKey: formData.apiKey,
                aiProvider: formData.aiProvider,
                baseUrl: formData.baseUrl,
                updatedAt: new Date().toISOString()
            };

            const profilesCol = collection(db, `tenants/${tenantId}/settings/ai_config/profiles`);
            let finalId = formData.id;

            if (formData.id) {
                await setDoc(doc(profilesCol, formData.id), profileData, { merge: true });
            } else {
                const docRef = await addDoc(profilesCol, profileData);
                finalId = docRef.id;
            }

            // Se for o único, já deixa ativo
            if (profiles.length === 0 || !activeProfileId) {
                await activateProfile(finalId, profileData);
            }

            toast({ title: "Sucesso", description: "Configuração de I.A. salva na biblioteca." });
            fetchAllData();
        } catch (error) {
            toast({ title: "Falha na Gravação", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const activateProfile = async (id, data) => {
        try {
            const activeDocRef = doc(db, `tenants/${tenantId}/settings`, 'ai_config');
            await setDoc(activeDocRef, {
                ...data,
                activeProfileId: id,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            setActiveProfileId(id);
            setFormData({ ...data, id });
            
            toast({ 
                title: "Perfil Ativado!", 
                description: `O motor "${data.name}" agora é o cérebro oficial do sistema.`,
                className: "bg-green-600 text-white border-none"
            });
        } catch (error) {
            toast({ title: "Erro ao ativar", description: error.message, variant: "destructive" });
        }
    };

    const deleteProfile = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja excluir esta configuração?")) return;

        try {
            await deleteDoc(doc(db, `tenants/${tenantId}/settings/ai_config/profiles`, id));
            toast({ title: "Removido", description: "A chave foi excluída permanentemente." });
            
            if (id === activeProfileId) {
                setActiveProfileId(null);
                // Opcionalmente limpa o activeProfileId no seletor global
                await setDoc(doc(db, `tenants/${tenantId}/settings`, 'ai_config'), { activeProfileId: null }, { merge: true });
            }
            fetchAllData();
        } catch (error) {
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="container max-w-6xl mx-auto p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LADO ESQUERDO: FORMULÁRIO */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                <Bot className="text-blue-600" />
                                Editor de Agente
                            </h1>
                            <p className="text-gray-500">Configure ou crie novas chaves de acesso.</p>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setFormData({ id: null, name: 'Nova Alpha', apiKey: '', aiProvider: 'gemini', baseUrl: '' })}
                            className="bg-white"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Novo Perfil
                        </Button>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">
                                {formData.id ? (
                                    <span className="flex items-center gap-2">
                                        <Badge variant="outline" className="border-blue-200 text-blue-600">Editando: {formData.name}</Badge>
                                    </span>
                                ) : (
                                    <span className="text-green-600 flex items-center gap-2">
                                        <Plus className="h-4 w-4" /> Criando Novo Perfil
                                    </span>
                                )}
                            </h2>
                            {formData.id && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setFormData({ id: null, name: 'Nova Configuração', apiKey: '', aiProvider: 'gemini', baseUrl: '' })}
                                    className="text-gray-500 hover:text-blue-600"
                                >
                                    Limpar / Criar Outro
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                             <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome da Configuração (Identificador)</label>
                                <Input 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Ex: Gemini do Cliente / OpenAI Pessoal"
                                    className={`bg-gray-50 font-bold ${formData.id ? 'text-blue-900 border-blue-100' : 'text-green-700 border-green-100'}`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Motor (IA Provider)</label>
                                <select 
                                    className="w-full flex h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    value={formData.aiProvider}
                                    onChange={(e) => setFormData({...formData, aiProvider: e.target.value})}
                                >
                                    <option value="gemini">Google Gemini</option>
                                    <option value="openai">OpenAI (Oficial)</option>
                                    <option value="anthropic">Anthropic (Claude)</option>
                                    <option value="custom">Compatível com OpenAI (Kimi, DeepSeek, etc)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Secret API Key</label>
                                <Input 
                                    type="password"
                                    value={formData.apiKey}
                                    onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                                    className="font-mono bg-gray-50"
                                />
                            </div>

                            {formData.aiProvider === 'custom' && (
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">URL Base (Endpoint)</label>
                                    <Input 
                                        value={formData.baseUrl}
                                        onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
                                        placeholder="Ex: https://api.moonshot.ai/v1"
                                        className="font-mono"
                                    />
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-[10px] text-gray-400 self-center mr-1 uppercase font-bold">Sugestões:</span>
                                        {[
                                            { name: 'Kimi (Internacional)', url: 'https://api.moonshot.ai/v1' },
                                            { name: 'DeepSeek', url: 'https://api.deepseek.com' },
                                            { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
                                            { name: 'Groq', url: 'https://api.groq.com/openai/v1' }
                                        ].map(sug => (
                                            <button 
                                                key={sug.url}
                                                type="button"
                                                onClick={() => setFormData({...formData, baseUrl: sug.url})}
                                                className="text-[10px] bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 px-2 py-1 rounded border border-gray-200 transition-colors"
                                            >
                                                {sug.name}
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-500 mt-1 block">
                                        Aponte para o endpoint padrão do serviço desejado.
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                            <Button 
                                onClick={handleSaveProfile} 
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                            >
                                {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                Salvar Configuração
                            </Button>
                        </div>
                    </div>

                </div>

                {/* LADO DIREITO: LISTA DE PERFIS */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4 pt-2">
                        <Key className="text-gray-400" />
                        Chaves de Acesso
                    </h2>

                    {profiles.length === 0 ? (
                        <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                            Nenhuma chave cadastrada.
                        </div>
                    ) : (
                        profiles.map((p) => (
                            <Card 
                                key={p.id} 
                                className={`cursor-pointer transition-all hover:shadow-md border-2 ${p.id === activeProfileId ? 'border-blue-500 bg-blue-50/30' : 'border-transparent'}`}
                                onClick={() => setFormData({ ...p, id: p.id })}
                            >
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 truncate max-w-[150px]">{p.name}</span>
                                                {p.id === activeProfileId && (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-1 h-5">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> ATIVO
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{p.aiProvider}</span>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={(e) => deleteProfile(p.id, e)}
                                            className="h-8 w-8 text-gray-300 hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    
                                    <div className="text-[11px] font-mono text-gray-400 truncate mb-4">
                                        {p.apiKey.substring(0, 10)}*****************
                                    </div>

                                    {p.id !== activeProfileId && (
                                        <Button 
                                            className="w-full bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 h-8 text-xs font-bold"
                                            onClick={(e) => { e.stopPropagation(); activateProfile(p.id, p); }}
                                        >
                                            ATIVAR AGENTE
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                    
                    <div className="bg-slate-900 p-4 rounded-xl text-white">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <UserCircle className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Dica de Consultor</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300">
                            "Salve sua chave de técnico aqui para fazer os ajustes. Ao terminar, clique na lixeira para remover sua chave e garantir que a conta do cliente permaneça segura."
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

