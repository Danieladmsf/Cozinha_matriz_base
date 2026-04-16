'use client';

import React, { useState } from 'react';
import { useTenant } from '@/lib/auth/TenantProvider';
import { Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Paywall() {
    const { user, tenantData, signOut } = useTenant();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isTrial = tenantData?.plan === 'trial';
    
    // Calcula quantos dias já passaram desde o vencimento para mostrar na tela
    let daysExpired = 0;
    if (tenantData?.trialEndsAt) {
        const expirDate = new Date(tenantData.trialEndsAt?.seconds ? tenantData.trialEndsAt.seconds * 1000 : tenantData.trialEndsAt);
        const diffTime = Math.abs(new Date() - expirDate);
        daysExpired = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const handlePayClick = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/mercadopago/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: tenantData?.tenantId,
                    email: user?.email
                })
            });

            const data = await response.json();
            
            if (data.init_point) {
                // Redireciona o cliente pro MP
                window.location.href = data.init_point;
            } else {
                throw new Error(data.error || 'Erro ao gerar link.');
            }
        } catch (err) {
            console.error('Erro:', err);
            setError('Não foi possível gerar a cobrança agora. Chame o suporte.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full relative">
                
                {/* Background effects */}
                <div className="absolute inset-0 -z-10 blur-[100px] bg-gradient-to-tr from-slate-200 to-blue-100 rounded-full" />
                
                <div className="bg-white border rounded-[2rem] shadow-xl overflow-hidden text-center relative pointer-events-auto">
                    
                    {/* Header */}
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 px-6 pt-10 pb-8 border-b">
                        <div className="w-20 h-20 mx-auto bg-white rounded-full shadow-sm flex items-center justify-center ring-4 ring-red-50 mb-4">
                            <Lock className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            {isTrial ? 'Período de Teste Encerrado' : 'Assinatura Vencida'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-2">
                            {isTrial 
                            ? `Seus 7 dias gratuitos chegaram ao fim. O sistema está bloqueado há ${daysExpired} dias.`
                            : `O seu acesso mensal venceu. Renove para continuar administrando sua cozinha.`}
                        </p>
                    </div>

                    {/* Features list */}
                    <div className="px-8 py-6 text-left space-y-4">
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">Libere seu sistema agora:</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span>Acesso a todas as Fichas Técnicas salvas.</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span>Controle de estoque e relatórios.</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span>Atualizações futuras sem custo extra.</span>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 mt-4 border border-red-100">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer / CTA */}
                    <div className="px-8 pb-8 pt-4">
                        <Button 
                            onClick={handlePayClick}
                            disabled={loading}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-base shadow-lg shadow-blue-600/20 rounded-xl"
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Gerando link seguro...</>
                            ) : (
                                "Assinar Food 360 - R$ 299,00"
                            )}
                        </Button>
                        <button 
                            onClick={signOut}
                            className="mt-6 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Sair da conta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
