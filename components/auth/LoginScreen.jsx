'use client';

import React, { useState } from 'react';
import { useTenant } from '@/lib/auth/TenantProvider';
import { ChefHat, Loader2 } from 'lucide-react';

/**
 * Tela de Login — Login com Google
 * Exibida pelo layout quando o usuário não está autenticado
 */
export default function LoginScreen() {
    const { signInWithGoogle, loading: authLoading } = useTenant();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            // Redirecionamento é automático pelo TenantProvider
        } catch (err) {
            console.error('Erro no login:', err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Login cancelado. Tente novamente.');
            } else if (err.code === 'auth/popup-blocked') {
                setError('Pop-up bloqueado pelo navegador. Permita pop-ups e tente novamente.');
            } else {
                setError('Erro ao fazer login. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen relative flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/hero-bg.png" 
                        alt="Background" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-900/90 backdrop-blur-sm"></div>
                </div>
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg animate-pulse">
                        <ChefHat className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-blue-100 text-sm font-medium animate-pulse">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/hero-bg.png" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                />
                {/* Overlay leve e sem blur para a imagem de fundo aparecer nitidamente */}
                <div className="absolute inset-0 bg-slate-900/40"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Card principal com Glassmorphism */}
                <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/20">
                    {/* Header com fundo claro para garantir a cor original da logo com contraste */}
                    <div className="bg-white/95 backdrop-blur-md px-8 py-10 text-center border-b border-white/20">
                        <h1 className="text-5xl font-black tracking-tighter mb-2">
                            <span className="text-blue-900">Food</span>
                            <span className="text-blue-600">360</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-2 font-medium">Sua cozinha em alta performance</p>
                    </div>

                    {/* Body */}
                    <div className="px-8 py-8 space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-white drop-shadow-sm">Bem-vindo!</h2>
                            <p className="text-sm text-blue-100/90 mt-1 drop-shadow-sm">
                                Cadastre-se grátis ou faça login para acessar seu painel
                            </p>
                        </div>

                        {/* Botão Google - Branco ligeiramente translúcido para manter contraste */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white/95 hover:bg-white border border-white/50 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            )}
                            <span className="font-semibold text-slate-700 group-hover:text-blue-700">
                                {loading ? 'Conectando...' : 'Cadastrar / Entrar com Google'}
                            </span>
                        </button>

                        {/* Erro */}
                        {error && (
                            <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl p-4 text-center shadow-inner">
                                <p className="text-sm text-red-100 font-medium">{error}</p>
                            </div>
                        )}

                        {/* Info trial e Assinatura */}
                        <div className="pt-2 text-center space-y-5">
                            <p className="text-sm font-semibold text-slate-200/90 tracking-wide">
                                7 dias grátis para testar todas as funcionalidades
                            </p>
                            
                            <div className="pt-5 border-t border-white/20">
                                <p className="text-[13px] text-white/90 font-medium mb-3">Já fez o teste gratuíto e deseja assinar?</p>
                                <a 
                                    href="https://mpago.la/2Re9Nec" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    Fazer Pagamento via Mercado Pago
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-300/80 mt-8 drop-shadow-md">
                    Ao continuar, você concorda com os Termos de Uso e Política de Privacidade
                </p>
            </div>
        </div>
    );
}
