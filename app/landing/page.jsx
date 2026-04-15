import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  ChefHat, 
  LineChart, 
  PackageCheck, 
  Users, 
  Smartphone, 
  Utensils, 
  Zap,
  Globe
} from "lucide-react";

export const metadata = {
  title: "Food 360 | O Sistema Operacional da sua Cozinha",
  description: "Controle total, da ficha técnica à entrega. O ERP Gastronômico definitivo.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navbar Minimalista */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-black tracking-tighter text-blue-900">
                Food<span className="text-blue-600">360</span>
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Recursos</a>
              <a href="#flow" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Como Funciona</a>
              <a href="#portal" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Portal Cliente</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-blue-900">
                Entrar
              </Link>
              <Link href="/dashboard">
                <button className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
                  Acessar Painel
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-70">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight mb-8">
            O Sistema Operacional <br />
            da sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Cozinha Matriz</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
            Abandone as planilhas. Gerencie insumos, fichas técnicas, ordens de produção e clientes através de um único painel inteligente e conectado ao portal B2B.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/dashboard">
              <button className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-full font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2">
                Acessar o Painel <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/portal/login">
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-2">
                Ver Portal de Clientes <Globe className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Grid de Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Visão 360° do seu Negócio</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Tudo que uma Cozinha Central, Dark Kitchen ou Indústria precisa para operar com lucro máximo e desperdício zero.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <PackageCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Gestão de Insumos</h3>
              <p className="text-slate-600">Histórico de preços de até 5 meses, análise de volatilidade e auditoria do melhor fornecedor para cada tomate.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Fichas Técnicas Integradas</h3>
              <p className="text-slate-600">Custos calculados em tempo real. Se o arroz sobe no mercado, seu prato atualiza automaticamente a margem de lucro.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Portal do Cliente B2B</h3>
              <p className="text-slate-600">Seus parceiros ou filiais fazem pedidos PWA (mobile) de forma autônoma. O pedido cai direto na sua tela de produção.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mental Map / Lógica de Arquitetura */}
      <section id="flow" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">A Lógica por trás do Food 360</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Como os dados fluem para gerar economia e escala na sua operação.</p>
          </div>

          <div className="flex flex-col items-center max-w-4xl mx-auto">
            
            {/* Bloco Térreo: Matéria Prima */}
            <div className="w-full grid grid-cols-2 gap-4 md:w-2/3 mx-auto">
              <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-4 text-center shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                <PackageCheck className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                <h4 className="font-semibold text-slate-200">1. Insumos & Embalagens</h4>
                <p className="text-xs text-slate-400 mt-1">100+ Ingredientes Rastreados</p>
              </div>
              <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-4 text-center shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                <LineChart className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                <h4 className="font-semibold text-slate-200">2. Histórico de Preços</h4>
                <p className="text-xs text-slate-400 mt-1">Análise de Volatilidade e Mercado</p>
              </div>
            </div>

            {/* Seta */}
            <div className="h-10 w-px bg-gradient-to-b from-blue-500 to-purple-500 my-2 shadow-[0_0_10px_rgba(168,85,247,0.5)] relative">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-purple-400"></div>
            </div>

            {/* Cérebro: Fichas -> SKUs */}
            <div className="w-full md:w-5/6 bg-gradient-to-r from-purple-900/50 to-fuchsia-900/50 backdrop-blur border border-purple-500/30 rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <div className="flex flex-col md:flex-row justify-center gap-8 items-center">
                <div className="flex-1">
                  <ChefHat className="w-6 h-6 mx-auto mb-2 text-fuchsia-400" />
                  <h4 className="font-semibold text-white">3. Fichas Técnicas</h4>
                  <p className="text-xs text-purple-200 mt-1">Unem os insumos para compor Custo Ideal</p>
                </div>
                <div className="hidden md:block w-px h-12 bg-purple-500/50"></div>
                <div className="flex-1">
                  <Utensils className="w-6 h-6 mx-auto mb-2 text-fuchsia-400" />
                  <h4 className="font-semibold text-white">4. Produtos Finais (SKU)</h4>
                  <p className="text-xs text-purple-200 mt-1">O item embalado, precificado e pronto para venda</p>
                </div>
              </div>
            </div>

            {/* Seta */}
            <div className="h-10 w-px bg-gradient-to-b from-purple-500 to-emerald-500 my-2 relative">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>

            {/* Saída: Ordem de Produção / Clientes */}
            <div className="w-full grid grid-cols-2 gap-4 md:w-3/4 mx-auto">
              <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-4 text-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Globe className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                <h4 className="font-semibold text-emerald-100">5. Portal do Cliente</h4>
                <p className="text-xs text-slate-400 mt-1">Lojistas, Franquias e App de Pedidos Direct</p>
              </div>
              <div className="bg-emerald-900/40 backdrop-blur border border-emerald-500/30 rounded-xl p-4 text-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Zap className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                <h4 className="font-semibold text-white">6. Operação / OP</h4>
                <p className="text-xs text-emerald-200 mt-1">Geração de Ordens de Produção Totais</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500">
          <Utensils className="w-8 h-8 mx-auto text-slate-300 mb-4" />
          <p className="font-medium">Food 360 - Sistema Operacional de Cozinhas</p>
          <p className="text-sm mt-2">Criado por Daniel Mello © 2026</p>
        </div>
      </footer>
    </div>
  );
}
