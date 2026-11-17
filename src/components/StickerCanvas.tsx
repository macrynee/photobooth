import React, { useState } from 'react';
import { PhotoStripData, StickerItem, FilterType, FrameColor } from '../types/photobooth';
import { StripPreview } from './StripPreview';
import { StickerPicker } from './StickerPicker';
import { FilterSelector } from './FilterSelector';
import { FRAME_COLORS } from './LayoutSelector';
import { Sparkles, Palette, Camera, Check, ArrowRight, RotateCcw } from 'lucide-react';

interface StickerCanvasProps {
  stripData: PhotoStripData;
  setStripData: React.Dispatch<React.SetStateAction<PhotoStripData>>;
  onProceedToExport: () => void;
  onBackToCapture: () => void;
}

export const StickerCanvas: React.FC<StickerCanvasProps> = ({
  stripData,
  setStripData,
  onProceedToExport,
  onBackToCapture,
}) => {
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  // Add new sticker
  const handleAddSticker = (item: Omit<StickerItem, 'id' | 'x' | 'y'>) => {
    const newSticker: StickerItem = {
      ...item,
      id: 'stk_' + Math.random().toString(36).substring(2, 9),
      x: 50 + (Math.random() * 20 - 10), // start around middle
      y: 40 + (Math.random() * 20 - 10),
    };

    setStripData((prev) => ({
      ...prev,
      stickers: [...prev.stickers, newSticker],
    }));
    setSelectedStickerId(newSticker.id);
  };

  // Move sticker
  const handleMoveSticker = (id: string, x: number, y: number) => {
    setStripData((prev) => ({
      ...prev,
      stickers: prev.stickers.map((s) => (s.id === id ? { ...s, x, y } : s)),
    }));
  };

  // Update selected sticker scale / rotation
  const handleUpdateSelected = (updated: Partial<StickerItem>) => {
    if (!selectedStickerId) return;
    setStripData((prev) => ({
      ...prev,
      stickers: prev.stickers.map((s) => (s.id === selectedStickerId ? { ...s, ...updated } : s)),
    }));
  };

  // Delete selected sticker
  const handleDeleteSelected = () => {
    if (!selectedStickerId) return;
    setStripData((prev) => ({
      ...prev,
      stickers: prev.stickers.filter((s) => s.id !== selectedStickerId),
    }));
    setSelectedStickerId(null);
  };

  // Clear all stickers
  const handleClearAll = () => {
    setStripData((prev) => ({
      ...prev,
      stickers: [],
    }));
    setSelectedStickerId(null);
  };

  const selectedSticker = stripData.stickers.find((s) => s.id === selectedStickerId) || null;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <span>Customize Your Photo Strip</span>
          </h2>
          <p className="text-xs text-slate-400">
            Add stickers, fine-tune filters, and personalize your captions before generating your QR code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToCapture}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Retake Photos</span>
          </button>

          <button
            onClick={onProceedToExport}
            className="px-5 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span>Finish & Get QR Code</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Customization Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive Strip Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex justify-center py-2">
            <StripPreview
              data={stripData}
              interactive={true}
              selectedStickerId={selectedStickerId}
              onSelectSticker={setSelectedStickerId}
              onMoveSticker={handleMoveSticker}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            ✨ Click and drag any sticker above to reposition it anywhere on your strip!
          </p>
        </div>

        {/* Right: Controls (Stickers, Filters, Frame Color, Text) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Sticker Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-200">Stickers & Badges</span>
              <span className="text-xs text-slate-400">{stripData.stickers.length} placed</span>
            </div>
            <StickerPicker
              onAddSticker={handleAddSticker}
              selectedSticker={selectedSticker}
              onUpdateSelected={handleUpdateSelected}
              onDeleteSelected={handleDeleteSelected}
              onClearAll={handleClearAll}
            />
          </div>

          {/* 2. Filter Adjuster */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <FilterSelector
              currentFilter={stripData.filter}
              onSelectFilter={(f: FilterType) => setStripData((prev) => ({ ...prev, filter: f }))}
            />
          </div>

          {/* 3. Quick Frame Color & Caption Editor */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-4">
            
            {/* Frame Colors */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-bold text-slate-200">Frame Border Color</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {FRAME_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setStripData((prev) => ({ ...prev, frameColor: c.hex }))}
                    className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all ${c.bgClass} ${
                      stripData.frameColor === c.hex
                        ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-slate-900 scale-110'
                        : 'hover:scale-105'
                    }`}
                    title={c.name}
                  >
                    {stripData.frameColor === c.hex && (
                      <Check
                        className={`w-4 h-4 ${
                          c.hex === '#ffffff' || c.hex === '#fef3c7' || c.hex === '#ffe4e6' || c.hex === '#d1fae5' || c.hex === '#ede9fe'
                            ? 'text-slate-900'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Captions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Header Text
                </label>
                <input
                  type="text"
                  value={stripData.title}
                  onChange={(e) => setStripData((prev) => ({ ...prev, title: e.target.value }))}
                  maxLength={28}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Handwritten Subtitle
                </label>
                <input
                  type="text"
                  value={stripData.subtitle}
                  onChange={(e) => setStripData((prev) => ({ ...prev, subtitle: e.target.value }))}
                  maxLength={36}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-pink-300 text-sm font-handwriting focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

          </div>

          {/* Bottom Action CTA */}
          <div className="pt-2">
            <button
              onClick={onProceedToExport}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-extrabold text-base shadow-xl shadow-pink-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>Looks Perfect! Generate QR Code & Download</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
