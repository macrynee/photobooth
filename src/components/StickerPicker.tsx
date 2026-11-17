import React, { useState } from 'react';
import { Sparkles, Smile, Award, Edit3, Trash2 } from 'lucide-react';
import { StickerItem } from '../types/photobooth';

interface StickerPickerProps {
  onAddSticker: (item: Omit<StickerItem, 'id' | 'x' | 'y'>) => void;
  selectedSticker: StickerItem | null;
  onUpdateSelected: (updated: Partial<StickerItem>) => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
}

const EMOJI_STICKERS = [
  '🎀', '💖', '⭐', '🌸', '🍓', '🐱', '🐻', '🕶️', 
  '👑', '✨', '🦋', '🍒', '🌙', '🧁', '🔥', '🌈', 
  '🍭', '🐶', '🦄', '🍀', '🍰', '🍿', '🎸', '⚡',
  '🎈', '🌻', '🐾', '🍉', '💎', '🎉', '🪐', '💫'
];

const BADGE_STICKERS = [
  'PHOTO BOOTH',
  'SMILE!',
  'BESTIES',
  'LUCKY ✨',
  'VIBES ⚡',
  'TRUE LOVE',
  'COOL KID',
  'SWEET 🍭',
  'PARTY TIME',
  'SUPERSTAR',
  'MEMORIES',
  'XOXO',
  'FOREVER',
  'CANDID'
];

const DOODLE_STICKERS = [
  'happy day! ☀️',
  'love you ♡',
  'forever & always',
  'best memories ~',
  'sparkle baby ✨',
  'stay silly ✌️',
  'good times :)',
  'so cute!! 🌸'
];

export const StickerPicker: React.FC<StickerPickerProps> = ({
  onAddSticker,
  selectedSticker,
  onUpdateSelected,
  onDeleteSelected,
  onClearAll,
}) => {
  const [tab, setTab] = useState<'emoji' | 'badge' | 'doodle'>('emoji');

  return (
    <div className="space-y-5 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800">
      
      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setTab('emoji')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              tab === 'emoji'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Emojis</span>
          </button>

          <button
            onClick={() => setTab('badge')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              tab === 'badge'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Badges</span>
          </button>

          <button
            onClick={() => setTab('doodle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              tab === 'doodle'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Doodles</span>
          </button>
        </div>

        <button
          onClick={onClearAll}
          className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors"
          title="Remove all stickers"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Sticker Tray Grid */}
      <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1">
        {tab === 'emoji' && (
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {EMOJI_STICKERS.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onAddSticker({ content: emoji, type: 'emoji', scale: 1, rotation: 0 })}
                className="w-10 h-10 rounded-xl bg-slate-950/70 hover:bg-pink-500/20 hover:scale-110 active:scale-95 border border-slate-800/80 flex items-center justify-center text-xl transition-all shadow-sm"
                title="Click to place sticker"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {tab === 'badge' && (
          <div className="flex flex-wrap gap-2">
            {BADGE_STICKERS.map((badge, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onAddSticker({ content: badge, type: 'badge', scale: 1, rotation: 0 })}
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 hover:scale-105 active:scale-95 text-white font-extrabold text-[11px] tracking-wider shadow-md transition-all uppercase"
              >
                {badge}
              </button>
            ))}
          </div>
        )}

        {tab === 'doodle' && (
          <div className="flex flex-wrap gap-2">
            {DOODLE_STICKERS.map((doodle, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onAddSticker({ content: doodle, type: 'doodle', scale: 1.1, rotation: -5 })}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/60 text-sky-400 font-handwriting text-lg hover:scale-105 transition-all"
              >
                {doodle}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Sticker Transformation Controls */}
      {selectedSticker ? (
        <div className="p-4 rounded-xl bg-slate-950 border border-pink-500/40 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedSticker.content}</span>
              <span className="text-xs font-bold text-pink-300">Selected Sticker</span>
            </div>
            <button
              onClick={onDeleteSelected}
              className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition-all text-xs flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
                <span>Scale Size</span>
                <span>{Math.round(selectedSticker.scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={selectedSticker.scale}
                onChange={(e) => onUpdateSelected({ scale: parseFloat(e.target.value) })}
                className="w-full accent-pink-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
                <span>Rotation</span>
                <span>{Math.round(selectedSticker.rotation)}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={selectedSticker.rotation}
                onChange={(e) => onUpdateSelected({ rotation: parseInt(e.target.value, 10) })}
                className="w-full accent-pink-500"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 text-center">
            💡 Drag sticker directly on the strip to reposition
          </p>
        </div>
      ) : (
        <div className="text-center py-2 text-xs text-slate-500">
          Click any sticker above to place it, then drag it freely over the photo strip!
        </div>
      )}

    </div>
  );
};
