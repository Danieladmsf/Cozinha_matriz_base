'use client';

import React, { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function ScreenshotButton() {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    try {
      setIsCapturing(true);
      
      const elementToCapture = document.querySelector('main') || document.body;
      
      // Salvar os estilos originais para restaurar depois
      const originalStyle = elementToCapture.style.cssText;
      const originalHeight = elementToCapture.style.height;
      const originalOverflow = elementToCapture.style.overflow;
      
      // Forçar o elemento a ter sua altura total visível (sem scroll interno)
      elementToCapture.style.height = 'auto';
      elementToCapture.style.overflow = 'visible';
      
      // Se for COZINHA MATRIZ BASE, o container pai também precisa de overflow visible
      const parentContainer = elementToCapture.parentElement;
      let parentOriginalStyle = '';
      if (parentContainer) {
        parentOriginalStyle = parentContainer.style.cssText;
        parentContainer.style.height = 'auto';
        parentContainer.style.overflow = 'visible';
      }

      // Pequeno delay para a página renderizar com a altura expandida
      await new Promise(r => setTimeout(r, 100));
      
      const canvas = await html2canvas(elementToCapture, {
        scale: 2, // Alta qualidade
        useCORS: true, // Permitir imagens externas
        allowTaint: true,
        logging: true,
        backgroundColor: '#ffffff',
        windowHeight: elementToCapture.scrollHeight,
        scrollY: 0
      });

      // Restaurar estilos originais
      elementToCapture.style.cssText = originalStyle;
      if (parentContainer) {
        parentContainer.style.cssText = parentOriginalStyle;
      }

      const image = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.href = image;
      link.download = `Print-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      alert('Não foi possível capturar a tela. Detalhes: ' + error.message);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <button
      onClick={handleCapture}
      disabled={isCapturing}
      title="Baixar Print da Tela"
      className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed print:hidden"
      style={{
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4), 0 8px 10px -6px rgba(37, 99, 235, 0.1)'
      }}
    >
      {isCapturing ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Camera className="h-6 w-6" />
      )}
    </button>
  );
}
