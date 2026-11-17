import React from 'react';
import { FilterType, FilterConfig } from '../types/photobooth';
import { Sparkles, Check } from 'lucide-react';

interface FilterSelectorProps {
  currentFilter: FilterType;
  onSelectFilter: (f: FilterType) => void;
}

export const FILTERS: FilterConfig[] = [
  {
    id: 'normal',
    name: 'Natural',
    tagline: 'Crisp & True to Life',
    cssFilter: 'none',
    previewColor: 'from-slate-700 to-slate-900',
  },
  {
    id: 'bw',
    name: 'Noir B&W',
    tagline: 'High-Contrast Monochrome',
    cssFilter: 'grayscale(100%) contrast(125%) brightness(95%)',
    previewColor: 'from-zinc-900 to-zinc-600',
  },
  {
    id: 'sepia',
    name: 'Vintage 70s',
    tagline: 'Warm Nostalgic Sepia',
    cssFilter: 'sepia(80%) contrast(110%) brightness(95%) saturate(120%)',
    previewColor: 'from-amber-900 to-yellow-700',
  },
  {
    id: 'film',
    name: '90s Analog Film',
    tagline: 'Subtle Film Grain & Punch',
    cssFilter: 'contrast(115%) brightness(105%) saturate(130%) sepia(20%)',
    previewColor: 'from-orange-800 to-rose-900',
  },
  {
    id: 'warm',
    name: 'Golden Sunset',
    tagline: 'Warm Rosy Evening Glow',
    cssFilter: 'sepia(35%) saturate(150%) hue-rotate(-15deg) brightness(105%)',
    previewColor: 'from-amber-500 to-rose-500',
  },
  {
    id: 'cool',
    name: 'Cool Breeze',
    tagline: 'Nordic Crisp Frost',
    cssFilter: 'hue-rotate(185deg) saturate(110%) brightness(102%)',
    previewColor: 'from-cyan-600 to-blue-800',
  },
  {
    id: 'vibrant',
    name: 'Pop Vivid',
    tagline: 'Ultra Saturated Color Pop',
    cssFilter: 'saturate(200%) contrast(115%)',
    previewColor: 'from-emerald-500 to-pink-500',
  },
  {
    id: 'cyber',
    name: 'Neon Cyber',
    tagline: 'Synthwave Magenta & Cyan',
    cssFilter: 'hue-rotate(280deg) saturate(160%) contrast(130%)',
    previewColor: 'from-fuchsia-600 to-indigo-800',
  },
  {
    id: 'soft',
    name: 'Dreamy Soft',
    tagline: 'Gentle Glow & Soft Highlights',
    cssFilter: 'brightness(110%) contrast(90%) saturate(115%)',
    previewColor: 'from-pink-300 to-purple-400',
  },
];

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  currentFilter,
  onSelectFilter,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-bold text-slate-200">Photo Booth Filter</span>
        </div>
        <span className="text-xs text-pink-400 font-medium">Real-time preview</span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        {FILTERS.map((f) => {
          const isSelected = currentFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelectFilter(f.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isSelected
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500 shadow-md shadow-pink-500/20 ring-1 ring-pink-500/40'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-gradient-to-tr ${f.previewColor} flex items-center justify-center`}
              >
                {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
              </div>
              <span>{f.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
