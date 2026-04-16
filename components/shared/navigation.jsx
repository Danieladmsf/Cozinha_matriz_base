import React from "react";
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
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
  const { user, signOut } = useTenant();

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
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed && !isHovering ? (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            )}
          </Button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = currentPageName === item.href;
              const isRecipes = item.href === "Recipes";

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
                      isActive ? "text-blue-600" : "text-gray-400"
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