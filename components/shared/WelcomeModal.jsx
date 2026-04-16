'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rocket, Clock, Star } from 'lucide-react';

export default function WelcomeModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[380px] p-6 rounded-2xl border-0 shadow-2xl bg-white gap-0">

        {/* Ícone + Título inline */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900 leading-tight">
              Tudo pronto!
            </DialogTitle>
          </div>
        </div>

        <DialogDescription className="text-sm text-slate-500 mt-2 mb-5">
          Sua conta Food 360 está ativa com <strong className="text-slate-700">7 dias grátis</strong> para explorar tudo.
        </DialogDescription>

        {/* Mini badges horizontais */}
        <div className="flex gap-2 mb-5">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
            <Clock className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-xs font-medium text-slate-700">7 dias de teste</span>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
            <Star className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-medium text-slate-700">Acesso completo</span>
          </div>
        </div>

        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 text-sm font-semibold shadow-sm"
          onClick={onClose}
        >
          Começar agora
        </Button>
      </DialogContent>
    </Dialog>
  );
}
