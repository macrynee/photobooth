'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PhotoStripData, StickerItem } from '../types/photobooth';
import { FILTERS } from './FilterSelector';
import { getPatternCss, getFontFamilyClass } from '../utils/patternStyles';

interface StripPreviewProps {
  data: PhotoStripData;
  interactive?: boolean;
  selectedStickerId?: string | null;
  onSelectSticker?: (id: string | null) => void;
  onMoveSticker?: (id: string, x: number, y: number) => void;
}

export const StripPreview: React.FC<StripPreviewProps> = ({
  data,
  interactive = false,
  selectedStickerId,
  onSelectSticker,
  onMoveSticker,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [photoRatio, setPhotoRatio] = useState<number>(1);

  const filterConfig = FILTERS.find((f) => f.id === data.filter) || FILTERS[0];
  const isDarkFrame = data.frameColor === '#121214' || data.frameColor === '#0f172a';

  // Detect photo aspect ratio to ensure output is never stretched or expanded
  useEffect(() => {
    if (data.photos && data.photos[0]) {
      const img = new Image();
      img.onload = () => {
        if (img.width && img.height) {
          setPhotoRatio(img.width / img.height);
        }
      };
      img.src = data.photos[0];
    }
  }, [data.photos]);

  // Handle sticker drag on pointer down
  const handlePointerDown = (e: React.PointerEvent, sticker: StickerItem) => {
    if (!interactive) return;
    e.stopPropagation();
    e.preventDefault();

    if (onSelectSticker) {
      onSelectSticker(sticker.id);
    }

    dragRef.current = {
      id: sticker.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: sticker.x,
      origY: sticker.y,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!interactive || !dragRef.current || !containerRef.current || !onMoveSticker) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragRef.current.startY) / rect.height) * 100;

    const newX = Math.min(95, Math.max(5, dragRef.current.origX + deltaX));
    const newY = Math.min(95, Math.max(5, dragRef.current.origY + deltaY));

    onMoveSticker(dragRef.current.id, newX, newY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      dragRef.current = null;
    }
  };

  // Determine width based on layout
  const isWide = data.layout === 'wide-2' || data.layout === 'grid-4';
  const maxWidthClass = isWide ? 'max-w-[420px]' : 'max-w-[340px]';
  const watermark = data.watermarkText || 'SILONG CAFE';
  const patternStyles = getPatternCss(data.backgroundPattern, isDarkFrame);

  // Outer border calculation
  let borderStyleValue = data.frameColor === '#ffffff' ? '1px solid #e2e8f0' : 'none';
  if (data.borderStyle === 'double') {
    borderStyleValue = `4px double ${data.borderColor || (isDarkFrame ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)')}`;
  } else if (data.borderStyle === 'dashed') {
    borderStyleValue = `2px dashed ${data.borderColor || (isDarkFrame ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)')}`;
  }

  return (
    <div
      ref={containerRef}
      onClick={() => interactive && onSelectSticker && onSelectSticker(null)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative w-full ${maxWidthClass} mx-auto rounded-2xl shadow-2xl transition-all duration-300 select-none overflow-hidden`}
      style={{
        backgroundColor: data.frameColor,
        border: borderStyleValue,
        backgroundImage: data.backgroundImage ? `url("${data.backgroundImage}")` : patternStyles.backgroundImage,
        backgroundSize: data.backgroundImage ? 'cover' : patternStyles.backgroundSize,
        backgroundPosition: 'center',
      }}
    >
      {/* Optional Top Watermark Badge */}
      {data.watermarkPosition === 'header' && (
        <div className="pt-3 pb-1 text-center px-4">
          <span
            className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full ${
              isDarkFrame ? 'bg-white/10 text-slate-300' : 'bg-black/5 text-slate-600'
            }`}
          >
            ★ {watermark} ★
          </span>
        </div>
      )}

      {/* Top Brand Logo / Header */}
      <div className={`text-center px-4 ${data.watermarkPosition === 'header' ? 'pt-1 pb-3' : 'pt-6 pb-3'}`}>
        <h2
          className={`font-black tracking-widest text-xs uppercase ${getFontFamilyClass(data.headerFont)} ${
            data.textColor ? '' : isDarkFrame ? 'text-slate-100' : 'text-slate-900'
          }`}
          style={data.textColor ? { color: data.textColor } : undefined}
        >
          {data.title || 'SILONG CAFE PHOTOBOOTH'}
        </h2>
      </div>

      {/* Photos Grid / Strip Body */}
      <div className="px-5 pb-4">
        {data.layout === 'grid-4' ? (
          <div className="grid grid-cols-2 gap-2.5">
            {data.photos.map((photo, idx) => (
              <div
                key={idx}
                className="rounded-lg overflow-hidden bg-slate-800 shadow-sm relative"
                style={{ aspectRatio: `${photoRatio}` }}
              >
                <img
                  src={photo}
                  alt={`Pose #${idx + 1}`}
                  className="w-full h-full object-cover"
                  style={{ filter: filterConfig.cssFilter }}
                />
              </div>
            ))}
          </div>
        ) : data.layout === 'polaroid-1' ? (
          <div
            className="rounded-lg overflow-hidden bg-slate-800 shadow-md"
            style={{ aspectRatio: `${photoRatio}` }}
          >
            {data.photos[0] && (
              <img
                src={data.photos[0]}
                alt="Polaroid Pose"
                className="w-full h-full object-cover"
                style={{ filter: filterConfig.cssFilter }}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {data.photos.map((photo, idx) => (
              <div
                key={idx}
                className="rounded-lg overflow-hidden bg-slate-800 shadow-sm relative"
                style={{ aspectRatio: `${photoRatio}` }}
              >
                <img
                  src={photo}
                  alt={`Pose #${idx + 1}`}
                  className="w-full h-full object-cover"
                  style={{ filter: filterConfig.cssFilter }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Branding, Handwritten Note & Date */}
      <div className="pb-6 pt-2 text-center px-4 space-y-1">
        {data.subtitle && (
          <p
            className={`font-handwriting text-2xl font-bold leading-tight ${
              isDarkFrame ? 'text-pink-400' : 'text-pink-600'
            }`}
          >
            {data.subtitle}
          </p>
        )}

        {data.showDate && (
          <div
            className={`flex items-center justify-center gap-2 text-[11px] font-semibold tracking-wider uppercase ${
              isDarkFrame ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <span>{data.dateStr}</span>
            <span>•</span>
            <span className="font-bold tracking-widest">{watermark}</span>
          </div>
        )}
      </div>

      {/* Interactive Sticker Overlay Layer */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {data.stickers.map((stk) => {
          const isSelected = selectedStickerId === stk.id;

          return (
            <div
              key={stk.id}
              onPointerDown={(e) => handlePointerDown(e, stk)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform ${
                interactive ? 'pointer-events-auto' : ''
              } ${isSelected ? 'ring-2 ring-pink-500 rounded-lg p-0.5' : ''}`}
              style={{
                left: `${stk.x}%`,
                top: `${stk.y}%`,
                transform: `translate(-50%, -50%) rotate(${stk.rotation}deg) scale(${stk.scale})`,
              }}
            >
              {stk.type === 'emoji' && (
                <span className="text-3xl sm:text-4xl select-none filter drop-shadow-md">
                  {stk.content}
                </span>
              )}

              {stk.type === 'badge' && (
                <span className="px-3 py-1 rounded-full bg-pink-600 text-white font-extrabold text-[11px] tracking-wider uppercase shadow-lg select-none whitespace-nowrap">
                  {stk.content}
                </span>
              )}

              {stk.type === 'doodle' && (
                <span className="font-handwriting font-bold text-2xl text-sky-400 select-none whitespace-nowrap filter drop-shadow">
                  {stk.content}
                </span>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
