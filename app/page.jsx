import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  ChefHat, 
  LineChart, 
  PackageCheck, 
  Globe, 
  Smartphone, 
  Utensils, 
  Zap,
  BookOpen,
  Users,
  Target,
  CheckCircle2,
  CalendarCheck,
  Apple,
  ClipboardCheck
} from "lucide-react";

export const metadata = {
  title: "Food 360 | O Sistema Operacional da sua Gastronomia",
  description: "Gestão inteligente e lucrativa para sua operação gastronômica com suporte estratégico especializado.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-600 selection:text-white pb-10 relative">
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
              <a href="#metodologia" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">A Metodologia</a>
              <a href="#sistema" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">O Sistema</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-blue-900">
                Acesso Restrito
              </Link>
              <Link href="/dashboard">
                <button className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
                  Entrar no Painel
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-40 overflow-hidden relative min-h-[80vh] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Food 360 Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-50"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-300 font-semibold text-sm mb-6 border border-blue-400/20 backdrop-blur-sm">
            <Target className="w-4 h-4" /> Gestão Inteligente + Suporte Estratégico
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight mb-8">
            Sua cozinha de alta performance,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">em qualquer lugar do Brasil.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-100 mb-10 leading-relaxed shadow-slate-900/10">
            Não basta ter o melhor sistema se a cultura da operação não mudar. 
            Nós unimos o <strong className="text-white">Software Food 360</strong> a uma <strong className="text-white">Metodologia de Implementação</strong> desenhada para transformar 
            sua equipe e garantir lucro real, da matriz às filiais.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/dashboard">
              <button className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30">
                Conhecer o Sistema <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Dores & Problemas */}
      <section id="metodologia" className="py-20 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">O parceiro estratégico do seu PDV que completa o ciclo da sua gestão.</h2>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  Enquanto seu sistema de vendas foca no cliente, o Food 360 domina a sua inteligência de produção. Resolvemos o quebra-cabeça da operação interna e eliminamos os gargalos que as planilhas comuns não conseguem resolver.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-red-500/20 p-1 rounded-md text-red-400"><Target className="w-5 h-5"/></div>
                    <p className="text-slate-300">Compras sem planejamento técnico, resultando em sobras de estoque ou falta de insumos na produção.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-red-500/20 p-1 rounded-md text-red-400"><Target className="w-5 h-5"/></div>
                    <p className="text-slate-300">Dificuldade em calcular o custo real de cada prato e garantir uma margem de lucro segura.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-red-500/20 p-1 rounded-md text-red-400"><Target className="w-5 h-5"/></div>
                    <p className="text-slate-300">Ausência de padrões operacionais, resultando em variações na qualidade, falta de pontualidade e falhas constantes na entrega final.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-red-500/20 p-1 rounded-md text-red-400"><Target className="w-5 h-5"/></div>
                    <p className="text-slate-300">Produção acima da demanda real por falta de planejamento, gerando excessos desnecessários que corroem o seu lucro.</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/20 blur-3xl rounded-full"></div>
                <h3 className="text-2xl font-bold text-white mb-6">A Combinação que Funciona</h3>
                <p className="text-slate-400 mb-6 border-b border-slate-700 pb-6">
                  O sistema captura a essência dos processos, otimiza a dinâmica de equipe e reduz o desperdício em até 40% ao transformar a cultura organizacional.
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl">
                    <div className="bg-blue-500/20 text-blue-400 p-3 rounded-lg"><BookOpen className="w-6 h-6"/></div>
                    <div>
                      <h4 className="font-semibold text-white">Tecnologia que Educa</h4>
                      <p className="text-sm text-slate-400">Mais que um software, um método. O sistema educa sua equipe a planejar com 7 dias de antecedência, garantindo folga operacional.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl">
                    <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-lg"><CalendarCheck className="w-6 h-6"/></div>
                    <div>
                      <h4 className="font-semibold text-white">Suporte Estratégico</h4>
                      <p className="text-sm text-slate-400">Mentoria online e acompanhamento de metas para sua operação.</p>
                    </div>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </section>

      {/* Como funciona o sistema */}
      <section id="sistema" className="py-24 relative overflow-hidden">
        {/* Background Image - Máxima Visibilidade */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/body-bg.png" 
            alt="Background" 
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-white/30"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Os 8 Módulos do Food 360</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Uma solução completa onde o software resolve a complexidade e liberta seu tempo.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ChefHat, color: "fuchsia", title: "1. Fichas Técnicas", desc: "O DNA do seu lucro. Cálculo automático de centavos, considerando quebras de processos e a margem real de cada prato." },
              { icon: LineChart, color: "blue", title: "2. Inteligência de Insumos", desc: "Sua central de preços. Acompanhe a volatilidade dos fornecedores com histórico de 5 meses e alertas de alta." },
              { icon: CalendarCheck, color: "emerald", title: "3. Planejamento (7 Dias)", desc: "Programe sua semana com antecedência. Antecipe compras e pré-preparos para trabalhar com folga e previsibilidade total." },
              { icon: Zap, color: "amber", title: "4. Ordens de Produção", desc: "Eficiência por setor. O sistema divide as tarefas para Açougue, Cozinha e Expedição de forma automática." },
              { icon: PackageCheck, color: "teal", title: "5. Compras e Pré-Preparo", desc: "Listas automáticas de tudo o que precisa ser comprado e processado para a semana seguinte, com base no seu cardápio." },
              { icon: ClipboardCheck, color: "indigo", title: "6. Padronização (POPs)", desc: "Qualidade constante. Procedimentos Operacionais Padrão profissionais para sua equipe nunca errar a mão." },
              { icon: Apple, color: "red", title: "7. Tabelas Nutricionais", desc: "Rótulos técnicos prontos. Gere a informação nutricional completa dos seus produtos de acordo com as novas normas." },
              { icon: Smartphone, color: "purple", title: "8. Gestão de SKUs", desc: "Visão 360 do produto final. Controle combos, embalagens e custos de venda final em um único lugar." }
            ].map((mod, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300">
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl mb-4 bg-slate-100 text-slate-600`}>
                  <mod.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{mod.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mapa de Fluxo Operacional - Re-adicionado e Melhorado para o Dono Visualizar */}
      <section id="fluxo" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Como tudo se conecta</h2>
            <p className="text-slate-400 max-w-2xl mx-auto italic">"O mapa do tesouro: como a informação do seu restaurante corre dentro do Food 360."</p>
          </div>

          <div className="flex flex-col items-center max-w-5xl mx-auto">
            {/* 1. Base: Insumos */}
            <div className="flex flex-col items-center group cursor-default">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg hover:border-blue-500 transition-all">
                    <PackageCheck className="w-8 h-8 text-blue-500 mb-2 mx-auto" />
                    <span className="block font-bold">Base de Insumos</span>
                    <span className="text-xs text-slate-500">Histórico de preços e Coleta</span>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-700 rotate-90 my-2" />
            </div>

            {/* 2. Meio: Fichas & Planos */}
            <div className="flex flex-col md:flex-row items-center gap-4 w-full justify-center">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg w-full md:w-64 text-center hover:border-emerald-500 transition-all">
                    <ChefHat className="w-8 h-8 text-emerald-500 mb-2 mx-auto" />
                    <span className="block font-bold">Fichas Técnicas</span>
                    <span className="text-xs text-slate-500">Onde o custo é definido</span>
                </div>
                <div className="hidden md:block w-12 h-px bg-slate-700"></div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg w-full md:w-64 text-center hover:border-purple-500 transition-all">
                    <CalendarCheck className="w-8 h-8 text-purple-500 mb-2 mx-auto" />
                    <span className="block font-bold">Cardápio Semanal</span>
                    <span className="text-xs text-slate-500">O plano de produção</span>
                </div>
            </div>

            <ArrowRight className="w-6 h-6 text-slate-700 rotate-90 my-2" />

            {/* 3. Ação: Compra e Cozinha */}
            <div className="w-full md:w-2/3 bg-gradient-to-r from-blue-900/40 to-emerald-900/40 border border-slate-600 rounded-3xl p-8 text-center relative shadow-2xl">
                <Zap className="w-10 h-10 text-amber-500 mb-4 mx-auto animate-pulse" />
                <h4 className="text-xl font-black mb-2 uppercase tracking-widest">O Motor de Inteligência</h4>
                <p className="text-slate-300 text-sm max-w-md mx-auto">
                    O sistema soma todas as receitas do cardápio e libera: <br />
                    <strong className="text-white">Lista de Compras Consolidada + Ordem de Produção por Setor.</strong>
                </p>
            </div>

            <ArrowRight className="w-6 h-6 text-slate-700 rotate-90 my-2" />

            {/* 4. Resultado: Venda e Portal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-2xl text-center shadow-lg">
                    <Smartphone className="w-8 h-8 text-emerald-500 mb-2 mx-auto" />
                    <span className="block font-bold">Portal do Cliente</span>
                    <span className="text-xs text-slate-400">Pedidos automáticos direto no sistema</span>
                </div>
                <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-2xl text-center shadow-lg">
                    <Apple className="w-8 h-8 text-purple-500 mb-2 mx-auto" />
                    <span className="block font-bold">Rótulo Nutricional</span>
                    <span className="text-xs text-slate-400">Produto pronto para comercializar</span>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500">
          <Utensils className="w-8 h-8 mx-auto text-slate-700 mb-4" />
          <p className="font-medium text-slate-300">Food 360 - Onboarding & Inteligência</p>
          <p className="text-sm mt-2 mb-6">Solução em Gestão por Daniel Mello</p>
          <div className="flex items-center justify-center gap-4">
             <a href="mailto:danielmulti@gmail.com" className="hover:text-white transition">danielmulti@gmail.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}