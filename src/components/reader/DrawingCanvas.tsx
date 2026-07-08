'use client';

import { useEffect, useRef, useState } from 'react';
import { useReader } from './ReaderContext';

export function DrawingCanvas({ blocoId }: { blocoId: string }) {
  const { modoProfessor, ferramentaAtiva, desenhos, criarDesenho, removerDesenho } = useReader();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Apenas desenhos do bloco atual
  const meusDesenhos = desenhos.filter(d => d.blocoId === blocoId);
  const isCaneta = modoProfessor && ferramentaAtiva === 'caneta';
  const isBorracha = modoProfessor && ferramentaAtiva === 'borracha';

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);

  // Para evitar scroll enquanto desenha no mobile
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    
    const blockTouch = (e: TouchEvent) => {
      if (isCaneta) {
        e.preventDefault(); // Impede o scroll natural do navegador
      }
    };
    
    el.addEventListener('touchstart', blockTouch, { passive: false });
    el.addEventListener('touchmove', blockTouch, { passive: false });
    
    return () => {
      el.removeEventListener('touchstart', blockTouch);
      el.removeEventListener('touchmove', blockTouch);
    };
  }, [isCaneta]);

  if (!modoProfessor && meusDesenhos.length === 0) return null;

  const getPos = (e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isCaneta) return;
    const pos = getPos(e);
    if (!pos) return;
    setIsDrawing(true);
    setCurrentPath([pos]);
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || !isCaneta) return;
    const pos = getPos(e);
    if (!pos) return;
    setCurrentPath(prev => [...prev, pos]);
  };

  const handleEnd = () => {
    if (!isDrawing || !isCaneta) return;
    setIsDrawing(false);
    if (currentPath.length > 2) {
      // Converte array de pontos em SVG path string
      const pathStr = currentPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      criarDesenho(blocoId, pathStr, '#c9a24b'); // Default to gold for now, or match tool color later if we add pen colors
    }
    setCurrentPath([]);
  };

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 z-10 ${isCaneta ? 'cursor-crosshair touch-none' : 'pointer-events-none'}`}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
    >
      <svg className="w-full h-full pointer-events-none">
        {meusDesenhos.map(d => (
          <g 
            key={d.id} 
            className={isCaneta || isBorracha ? 'pointer-events-auto cursor-pointer group' : ''}
            onClick={() => (isCaneta || isBorracha) && removerDesenho(d.id)}
            style={{ pointerEvents: isCaneta || isBorracha ? 'auto' : 'none' }}
          >
            {/* Transparent thicker path for easier tapping on mobile */}
            <path 
              d={d.path}
              stroke="transparent"
              strokeWidth="30"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Actual visible path */}
            <path 
              d={d.path}
              stroke={d.cor}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors group-hover:stroke-red-500"
            />
          </g>
        ))}
        {/* Renderiza desenho em andamento */}
        {currentPath.length > 0 && (
          <path 
            d={currentPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
            stroke="#c9a24b" // Gold
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
}
