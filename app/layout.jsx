'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import {
  LayoutDashboard,
  ChefHat,
  Package,
  Building2,
  Users,
  Tag,
  Menu,
  Apple,
  Utensils,
  Clipboard,
  ClipboardList,
  Wrench,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarNav from "@/components/shared/navigation";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { setupConsoleFilters } from "@/lib/consoleUtils";
import { addDialogDescriptions, addSROnlyStyles } from "@/lib/dialogDescriptionFixer";
import TenantProvider, { useTenant } from "@/lib/auth/TenantProvider";
import LoginScreen from "@/components/auth/LoginScreen";

import Paywall from "@/components/auth/Paywall";

function _getCurrentPage(pathname) {
  if (pathname === "/") return "Dashboard";
  return pathname.substring(1);
}

// ============================================
// ROTAS PÚBLICAS (sem login necessário)
// ============================================
const PUBLIC_ROUTES = ['/portal', '/landing', '/login'];

// ============================================
// INNER: Conteúdo autenticado
// ============================================
function AuthenticatedApp({ children }) {
  const { user, loading, initializing, isTrialExpired } = useTenant();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [, setActiveItem] = useState(null);
  const pathname = usePathname();
  const currentPageName = _getCurrentPage(pathname);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Receitas", href: "/receitas", icon: ChefHat },
    { name: "Produtos (SKU)", href: "/produtos", icon: ShoppingBag },
    { name: "Ficha Técnica", href: "/ficha-tecnica", icon: Clipboard },
    { name: "POP's", href: "/ferramentas", icon: Wrench },
    { name: "Ordem de Produção", href: "/cardapio", icon: Utensils },
    { name: "Programação", href: "/programacao", icon: ClipboardList },
    { name: "Insumos", href: "/ingredientes", icon: Package },
    { name: "Categorias", href: "/categorias", icon: Tag },
    { name: "Fornecedores e Serviços", href: "/fornecedores-e-servicos", icon: Building2 },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Tabela Nutricional", href: "/tabela-nutricional", icon: Apple },
    { name: "Configurações da I.A.", href: "/configuracoes", icon: Sparkles }
  ];

  useEffect(() => {
    setSidebarOpen(false);

    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarCollapsed(true);
    }

    setActiveItem(currentPageName);

    if (process.env.NODE_ENV === 'development') {
      setupConsoleFilters();
      addSROnlyStyles();
      addDialogDescriptions();
    }
  }, [pathname, currentPageName]);

  const handleMouseEnter = () => {
    if (sidebarCollapsed) setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (sidebarCollapsed) setIsHovering(false);
  };

  // 🔄 Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // 🔒 Não autenticado → Tela de login
  if (!user) {
    return <LoginScreen />;
  }

  // 🆕 Inicializando tenant (primeiro login)
  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
            <ChefHat className="h-8 w-8 text-white animate-bounce" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Configurando seu espaço...</h2>
          <p className="text-sm text-gray-500">Preparando tudo para você. Só um instante!</p>
          <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  // 🚧 Verifica Bloqueio SaaS (Paywall)
  if (isTrialExpired) {
    return <Paywall />;
  }

  // ✅ Autenticado e Válido → App normal com sidebar
  return (
    <div className="flex h-full bg-gray-100 main-app-container print:h-auto print:overflow-visible">

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <SidebarNav
        navigation={navigation}
        currentPageName={currentPageName}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        isHovering={isHovering}
        setIsHovering={setIsHovering}
        setActiveItem={setActiveItem}
        handleMouseEnter={handleMouseEnter}
        handleMouseLeave={handleMouseLeave}
      />

      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        <header className="lg:hidden bg-white border-b px-4 py-3 print:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-100 compact-ui print:overflow-visible print:bg-white print:h-auto print:w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

// ============================================
// ROOT LAYOUT
// ============================================
export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Rotas públicas — sem TenantProvider
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/';

  if (isPublicRoute) {
    return (
      <html lang="pt-BR">
        <head>
          <meta charSet="utf-8" />
          <meta name="description" content="Portal do Cliente - Cozinha Matriz" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
          <meta name="theme-color" content="#f97316" />
          <title>Cozinha Matriz</title>
        </head>
        <body>
          <div className="portal-layout min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {children}
          </div>
          <Toaster />
          {process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_DISABLE_SPEED_INSIGHTS && <SpeedInsights />}
        </body>
      </html>
    );
  }

  // Rotas autenticadas — com TenantProvider
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="description" content="Cozinha Matriz - Sistema de Gestão para Cozinhas Profissionais" />
        <meta name="keywords" content="gestão restaurante, sistema restaurante, controle estoque, receitas, cardápio" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#f97316" />
        <title>Cozinha Matriz - Gestão de Cozinha Profissional</title>
      </head>
      <body>
        <TenantProvider>
          <AuthenticatedApp>{children}</AuthenticatedApp>
        </TenantProvider>
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}