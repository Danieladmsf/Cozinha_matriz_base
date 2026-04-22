import React from "react";
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Sparkles,
  User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

import Image from "next/image";
import { useTenant } from "@/lib/auth/TenantProvider";

export default function SidebarNav({
  navigation,
  currentPageName,
  sidebarCollapsed,
  setSidebarCollapsed,
  isHovering,
  setIsHovering,
  setActiveItem,
  handleMouseEnter,
  handleMouseLeave
}) {
  const { user, tenantData, signOut } = useTenant();
  const [openDropdowns, setOpenDropdowns] = React.useState({ 'Ficha Técnica': true });

  const toggleDropdown = (name) => {
    setOpenDropdowns(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 h-full bg-white border-r shadow-sm transition-all duration-200",
        "lg:relative",
        sidebarCollapsed && !isHovering ? "lg:w-16" : "w-52"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        <div className={cn(
          "flex items-center p-4 border-b h-[68px] relative",
          (!sidebarCollapsed || isHovering) ? "justify-between" : "justify-center"
        )}>
          {(!sidebarCollapsed || isHovering) ? (
            <div className="font-bold text-xl text-blue-800 tracking-tight truncate">
              Food 360
            </div>
          ) : (
            <div className="font-bold text-lg text-blue-800 tracking-tight hidden">
              F360
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "hidden lg:flex transition-all z-10",
              (!sidebarCollapsed || isHovering) ? "" : "absolute left-1/2 -translate-x-1/2"
            )}
            onClick={() => {
              setSidebarCollapsed(!sidebarCollapsed);
              setIsHovering(false);
            }}
          >
            {sidebarCollapsed && !isHovering ? (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-hide">
          <div className="space-y-1">
            {navigation.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              
              // Verifica se algum subitem está ativo para marcar o pai
              const isParentActive = hasSubItems && item.subItems.some(sub => 
                sub.href === "/dashboard" 
                  ? currentPageName === "Dashboard"
                  : currentPageName.startsWith(sub.href.substring(1))
              );

              const isActive = hasSubItems ? isParentActive : (
                item.href === "/dashboard" 
                  ? currentPageName === "Dashboard"
                  : currentPageName.startsWith(item.href.substring(1))
              );
              
              const isRecipes = item.href === "/receitas";
              const isOpen = openDropdowns[item.name];

              // Se tiver subItems, renderiza o Accordion
              if (hasSubItems) {
                return (
                  <div key={item.name} className="flex flex-col gap-1">
                    <button
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors",
                        isActive
                          ? "text-blue-700 bg-blue-50"
                          : "text-gray-600 hover:bg-gray-50",
                        sidebarCollapsed && !isHovering ? "justify-center px-1" : ""
                      )}
                      onClick={() => {
                        if (sidebarCollapsed && !isHovering) {
                          setSidebarCollapsed(false);
                          setIsHovering(true);
                          setOpenDropdowns(prev => ({ ...prev, [item.name]: true }));
                        } else {
                          toggleDropdown(item.name);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive ? "text-orange-500" : "text-blue-800"
                          )}
                        />
                        {(!sidebarCollapsed || isHovering) && (
                          <span className={cn(
                            "whitespace-nowrap",
                            isActive ? "text-blue-700" : "text-gray-600"
                          )}>
                            {item.name}
                          </span>
                        )}
                      </div>
                      {(!sidebarCollapsed || isHovering) && (
                        <ChevronDown 
                          className={cn(
                            "h-3.5 w-3.5 transition-transform duration-200",
                            isOpen ? "rotate-180" : ""
                          )} 
                        />
                      )}
                    </button>

                    {/* SubItens list */}
                    {isOpen && (!sidebarCollapsed || isHovering) && (
                      <div className="flex flex-col gap-1 pl-7 pr-2 mt-1">
                        {item.subItems.map(subItem => {
                          const isSubActive = subItem.href === "/dashboard" 
                            ? currentPageName === "Dashboard"
                            : currentPageName.startsWith(subItem.href.substring(1));
                            
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md",
                                isSubActive
                                  ? "text-blue-700 bg-blue-50"
                                  : "text-gray-500 hover:bg-gray-50"
                              )}
                              onClick={() => {
                                if (window.innerWidth >= 1024) {
                                  setSidebarCollapsed(true);
                                  setIsHovering(false);
                                }
                                setActiveItem(subItem.href);
                              }}
                            >
                              <span className="whitespace-nowrap">{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Normal Item sem SubItens
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "sidebar-nav-item flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md",
                    isActive
                      ? "active text-blue-700 bg-blue-50"
                      : "text-gray-600 hover:bg-gray-50",
                    sidebarCollapsed && !isHovering ? "justify-center px-1" : ""
                  )}
                  onClick={() => {
                    if (window.innerWidth >= 1024) {
                      setSidebarCollapsed(true);
                      setIsHovering(false);
                    }
                    setActiveItem(item.href);
                  }}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 sidebar-icon",
                      isActive ? "text-orange-500" : "text-blue-800"
                    )}
                  />

                  {(!sidebarCollapsed || isHovering) && (
                    <span className={cn(
                      "sidebar-text whitespace-nowrap",
                      isActive ? "text-blue-700" : "text-gray-600"
                    )}>
                      {item.name}
                    </span>
                  )}

                  {isRecipes && isActive && !sidebarCollapsed && (
                    <span className="absolute right-3 h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t bg-gray-50/50">
          {(!sidebarCollapsed || isHovering) ? (
            <div className="flex flex-col gap-3">
              {tenantData?.plan === 'trial' && tenantData?.trialEndsAt && (
                <div className="bg-amber-100 border border-amber-200 rounded-md px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-sm">
                   <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-[11px] font-semibold text-amber-800">Trial</span>
                   </div>
                   <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      {Math.max(0, Math.ceil((new Date(tenantData.trialEndsAt?.seconds ? tenantData.trialEndsAt.seconds * 1000 : tenantData.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))}d
                   </span>
                </div>
              )}

              {tenantData?.plan === 'paid' && tenantData?.subscriptionEndsAt && (
                <div className="bg-blue-100 border border-blue-200 rounded-md p-2 flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-800">Plano F360</span>
                   </div>
                   <span className="text-[10px] font-bold text-blue-900 bg-blue-200 px-2 py-0.5 rounded-full">
                      {Math.max(0, Math.ceil((new Date(tenantData.subscriptionEndsAt?.seconds ? tenantData.subscriptionEndsAt.seconds * 1000 : tenantData.subscriptionEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))} dias
                   </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="h-9 w-9 rounded-full ring-2 ring-white shadow-sm" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center ring-2 ring-blue-50 shadow-sm">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                )}
                <div className="flex flex-col flex-1 min-w-0 pr-1">
                  <span className="text-sm font-semibold text-gray-700 truncate">
                    {user?.displayName || "Usuário"}
                  </span>
                  <span className="text-[10px] text-gray-500 truncate" title={user?.email}>
                    {user?.email}
                  </span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-transparent shadow-none bg-transparent"
                onClick={signOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair do Sistema
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-1">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="h-9 w-9 rounded-full ring-2 ring-white shadow-sm" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center ring-2 ring-blue-50 shadow-sm">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={signOut}
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}