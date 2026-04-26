'use client';

import React, { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function ScreenshotButton() {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    try {
      setIsCapturing(true);
      
      // Select the main content area to capture (avoids sidebars if we target main)
      // Fallback to body if main is not found
      const elementToCapture = document.querySelector('main') || document.body;
      
      const canvas = await html2canvas(elementToCapture, {
        scale: 2, // High quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Set background to white
      });

      const image = canvas.toDataURL('image/png');
      
      // Create a temporary link to download the image
      const link = document.createElement('a');
      link.href = image;
      link.download = `Print-CozinhaMatriz-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      alert('Não foi possível capturar a tela. Tente novamente.');
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
