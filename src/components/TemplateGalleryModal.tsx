'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  PictureTemplate,
  TemplateCategory,
  LayoutType,
  FrameColor,
  BackgroundPattern,
  HeaderFont,
  StickerItem,
  PhotoStripData,
} from '../types/photobooth';
import { TEMPLATE_CATEGORIES, PRESET_GALLERY_TEMPLATES } from '../data/presetTemplates';
import { LAYOUT_OPTIONS, FRAME_COLORS } from './LayoutSelector';
import { StripPreview } from './StripPreview';
import { getPatternCss, getFontFamilyClass } from '../utils/patternStyles';
import {
  X,
  Sparkles,
  Search,
  Sliders,
  Check,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  BookmarkPlus,
  Palette,
  Type,
  Layers,
  Image as ImageIcon,
  Heart,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: PictureTemplate) => void;
  currentTemplateId?: string | null;
}

const SAMPLE_GALLERY_PHOTOS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%234338ca"/><circle cx="200" cy="180" r="70" fill="%23fde047"/><circle cx="175" cy="170" r="8" fill="%230f172a"/><circle cx="225" cy="170" r="8" fill="%230f172a"/><path d="M170 205 Q200 235 230 205" stroke="%230f172a" stroke-width="6" fill="none" stroke-linecap="round"/><text x="200" y="320" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23ffffff" text-anchor="middle">Pose #1</text></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23db2777"/><circle cx="200" cy="180" r="70" fill="%23fbcfe8"/><circle cx="175" cy="170" r="8" fill="%230f172a"/><circle cx="225" cy="170" r="8" fill="%230f172a"/><path d="M170 205 Q200 235 230 205" stroke="%230f172a" stroke-width="6" fill="none" stroke-linecap="round"/><text x="200" y="320" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23ffffff" text-anchor="middle">Pose #2</text></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23059669"/><circle cx="200" cy="180" r="70" fill="%23a7f3d0"/><circle cx="175" cy="170" r="8" fill="%230f172a"/><circle cx="225" cy="170" r="8" fill="%230f172a"/><path d="M170 205 Q200 235 230 205" stroke="%230f172a" stroke-width="6" fill="none" stroke-linecap="round"/><text x="200" y="320" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23ffffff" text-anchor="middle">Pose #3</text></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23d97706"/><circle cx="200" cy="180" r="70" fill="%23fef08a"/><circle cx="175" cy="170" r="8" fill="%230f172a"/><circle cx="225" cy="170" r="8" fill="%230f172a"/><path d="M170 205 Q200 235 230 205" stroke="%230f172a" stroke-width="6" fill="none" stroke-linecap="round"/><text x="200" y="320" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23ffffff" text-anchor="middle">Pose #4</text></svg>',
];

const PATTERN_OPTIONS: { id: BackgroundPattern; name: string; icon: string }[] = [
  { id: 'none', name: 'None / Solid', icon: '◻️' },
  { id: 'dots', name: 'Micro Dots', icon: '⁖' },
  { id: 'grid', name: 'Clean Grid', icon: '▦' },
  { id: 'stripes', name: 'Diagonal Stripes', icon: '▨' },
  { id: 'hearts', name: 'Sweet Hearts', icon: '♡' },
  { id: 'stars', name: 'Golden Stars', icon: '★' },
  { id: 'checker', name: 'Y2K Checker', icon: '🏁' },
  { id: 'sparkles', name: 'Magic Sparkles', icon: '✦' },
];

const FONT_OPTIONS: { id: HeaderFont; name: string; preview: string }[] = [
  { id: 'grotesk', name: 'Space Grotesk', preview: 'GROTESK' },
  { id: 'serif', name: 'Old Money Serif', preview: 'ELEGANT' },
  { id: 'handwriting', name: 'Cursive Script', preview: 'Handwritten' },
  { id: 'modern', name: 'Modern Bold', preview: 'MODERN' },
  { id: 'retro', name: '90s Monospace', preview: 'RETRO 90S' },
];

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
  currentTemplateId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTemplate, setActiveTemplate] = useState<PictureTemplate>(PRESET_GALLERY_TEMPLATES[0]);
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter templates by category and search term
  const filteredTemplates = useMemo(() => {
    return PRESET_GALLERY_TEMPLATES.filter((tpl) => {
      const matchCategory =
        selectedCategory === 'all' ||
        tpl.category === selectedCategory ||
        (selectedCategory === 'minimalist' && tpl.category === 'minimalist');

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        tpl.name.toLowerCase().includes(q) ||
        (tpl.description || '').toLowerCase().includes(q) ||
        tpl.title.toLowerCase().includes(q) ||
        tpl.occasion.toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  // Build live preview data from activeTemplate
  const previewData: PhotoStripData = {
    layout: activeTemplate.layout,
    filter: activeTemplate.filter,
    frameColor: activeTemplate.frameColor,
    photos: SAMPLE_GALLERY_PHOTOS,
    stickers: activeTemplate.stickers || [],
    title: activeTemplate.title,
    subtitle: activeTemplate.subtitle,
    subtitleColor: activeTemplate.subtitleColor,
    showDate: activeTemplate.showDate,
    dateStr: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
    backgroundPattern: activeTemplate.backgroundPattern,
    backgroundImage: activeTemplate.backgroundImage,
    headerFont: activeTemplate.headerFont,
    textColor: activeTemplate.textColor,
    watermarkText: activeTemplate.watermarkText || 'SILONG CAFE',
    watermarkPosition: activeTemplate.watermarkPosition || 'footer',
    borderStyle: activeTemplate.borderStyle,
    borderColor: activeTemplate.borderColor,
  };

  const handleApply = () => {
    onApplyTemplate(activeTemplate);
    onClose();
  };

  const handleCustomBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setActiveTemplate((prev) => ({
            ...prev,
            backgroundImage: reader.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickAddSticker = (emoji: string) => {
    const newStk: StickerItem = {
      id: 'stk_' + Math.random().toString(36).substring(2, 7),
      type: 'emoji',
      content: emoji,
      x: 50 + (Math.random() * 20 - 10),
      y: 86 + (Math.random() * 8 - 4),
      scale: 1.2,
      rotation: Math.floor(Math.random() * 20 - 10),
    };
    setActiveTemplate((prev) => ({
      ...prev,
      stickers: [...(prev.stickers || []), newStk],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-7xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white font-bold text-xl">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  Photo Booth Template Gallery
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  SILONG CAFE Edition
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose from 11 curated design aesthetics or personalize colors, headers, and frames.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                isCustomizing
                  ? 'bg-pink-500 text-white border-pink-400 shadow-md shadow-pink-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isCustomizing ? 'Hide Customizer' : 'Customize Template'}</span>
            </button>

            <button
              onClick={handleApply}
              className="px-5 py-2 text-xs sm:text-sm font-extrabold rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Template</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Gallery"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter Pills & Search Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Scrollable Category Chips */}
          <div className="w-full md:w-auto flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {TEMPLATE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-slate-950 shadow-md font-extrabold'
                      : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-64 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>
        </div>

        {/* Modal Main Body: Gallery Cards Grid + Live Interactive Preview Pane */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Visual Gallery Grid */}
          <div className="lg:col-span-7 overflow-y-auto p-4 sm:p-6 space-y-4 border-r border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {filteredTemplates.length} Design Templates
              </span>
              <span className="text-xs text-pink-400 font-medium">
                Default Watermark: <strong>SILONG CAFE</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredTemplates.map((tpl) => {
                const isSelected = activeTemplate.id === tpl.id;
                const patternStyle = getPatternCss(tpl.backgroundPattern, tpl.frameColor === '#121214' || tpl.frameColor === '#0f172a');

                return (
                  <div
                    key={tpl.id}
                    onClick={() => setActiveTemplate(tpl)}
                    className={`group cursor-pointer rounded-2xl p-4 transition-all duration-200 border text-left relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-pink-500 shadow-xl shadow-pink-500/10 ring-2 ring-pink-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    {/* Top Row: Category tag and Selected indicator */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {tpl.category || 'Preset'}
                      </span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-pink-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 group-hover:text-slate-300 transition-colors">
                          Preview →
                        </span>
                      )}
                    </div>

                    {/* Miniature Layout Representation Banner */}
                    <div
                      className="w-full h-14 rounded-xl mb-3 flex items-center justify-center p-2 relative shadow-inner overflow-hidden border border-slate-700/50"
                      style={{
                        backgroundColor: tpl.frameColor,
                        backgroundImage: patternStyle.backgroundImage,
                        backgroundSize: patternStyle.backgroundSize,
                      }}
                    >
                      <div className="flex items-center gap-1.5 opacity-90">
                        {tpl.layout === 'grid-4' ? (
                          <div className="grid grid-cols-2 gap-1 w-12 h-10">
                            <div className="bg-slate-800/80 rounded-sm"></div>
                            <div className="bg-slate-800/80 rounded-sm"></div>
                            <div className="bg-slate-800/80 rounded-sm"></div>
                            <div className="bg-slate-800/80 rounded-sm"></div>
                          </div>
                        ) : tpl.layout === 'polaroid-1' ? (
                          <div className="w-9 h-10 bg-slate-800/80 rounded-sm shadow-sm flex items-center justify-center text-[10px]">
                            📷
                          </div>
                        ) : tpl.layout === 'wide-2' ? (
                          <div className="flex flex-col gap-1 w-12 h-10">
                            <div className="bg-slate-800/80 rounded-sm h-4"></div>
                            <div className="bg-slate-800/80 rounded-sm h-4"></div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5 w-7 h-10">
                            <div className="bg-slate-800/80 rounded-sm h-2.5"></div>
                            <div className="bg-slate-800/80 rounded-sm h-2.5"></div>
                            <div className="bg-slate-800/80 rounded-sm h-2.5"></div>
                          </div>
                        )}
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider font-retro truncate max-w-[120px] ${
                            tpl.frameColor === '#121214' || tpl.frameColor === '#0f172a' ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {tpl.title.split('•')[0] || tpl.title}
                        </span>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                        {tpl.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    {/* Bottom Metadata Badges */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="capitalize">{tpl.layout.replace('-', ' ')}</span>
                      <span>{tpl.watermarkText || 'SILONG CAFE'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Interactive Preview & Customization Drawer */}
          <div className="lg:col-span-5 bg-slate-950/60 flex flex-col h-full overflow-hidden">
            
            {/* Customizer Drawer (when toggled on) */}
            {isCustomizing ? (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-slate-900/90 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-pink-400" />
                    <span>Customize Design Elements</span>
                  </h3>
                  <button
                    onClick={() => {
                      const orig = PRESET_GALLERY_TEMPLATES.find((t) => t.id === activeTemplate.id);
                      if (orig) setActiveTemplate(orig);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* 1. Layout Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Photo Layout</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {LAYOUT_OPTIONS.map((layout) => (
                      <button
                        key={layout.id}
                        onClick={() => setActiveTemplate((prev) => ({ ...prev, layout: layout.id }))}
                        className={`py-2 px-1 text-[11px] font-bold rounded-xl border text-center transition-all ${
                          activeTemplate.layout === layout.id
                            ? 'bg-pink-500 text-white border-pink-400 shadow-sm'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {layout.badge}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Header Title & Subtitle */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Header Event Title</label>
                    <input
                      type="text"
                      value={activeTemplate.title}
                      onChange={(e) => setActiveTemplate((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Subtitle / Handwritten Note</label>
                    <input
                      type="text"
                      value={activeTemplate.subtitle}
                      onChange={(e) => setActiveTemplate((prev) => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  {/* Subtitle / Note Color Partnering */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Handwritten Note Color
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTemplate((prev) => ({ ...prev, subtitleColor: undefined }))}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                          !activeTemplate.subtitleColor
                            ? 'bg-pink-500 text-white border-pink-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        Auto-Match Background
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { hex: '#fbbf24', name: 'Champagne Gold' },
                        { hex: '#92400e', name: 'Vintage Bronze' },
                        { hex: '#334155', name: 'Charcoal Slate' },
                        { hex: '#cbd5e1', name: 'Minimalist Silver' },
                        { hex: '#047857', name: 'Matcha Emerald' },
                        { hex: '#38bdf8', name: 'Sky Blue' },
                        { hex: '#7c3aed', name: 'Velvet Violet' },
                        { hex: '#be185d', name: 'Wine Rose' },
                        { hex: '#f97316', name: 'Pumpkin Amber' },
                        { hex: '#fef08a', name: 'Cyber Yellow' },
                        { hex: '#ffffff', name: 'Pure White' },
                      ].map((sc) => (
                        <button
                          key={sc.hex}
                          type="button"
                          onClick={() => setActiveTemplate((prev) => ({ ...prev, subtitleColor: sc.hex }))}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            activeTemplate.subtitleColor === sc.hex
                              ? 'scale-125 border-pink-400 ring-2 ring-pink-500/50 shadow-md'
                              : 'border-slate-700 hover:scale-110'
                          }`}
                          style={{ backgroundColor: sc.hex }}
                          title={sc.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Typography Choice */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Typography Font</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setActiveTemplate((prev) => ({ ...prev, headerFont: f.id }))}
                        className={`p-2 text-left rounded-xl border transition-all ${
                          activeTemplate.headerFont === f.id
                            ? 'bg-pink-500/20 text-pink-300 border-pink-500 ring-1 ring-pink-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold">{f.name}</div>
                        <div className="text-[10px] text-slate-500">{f.preview}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Frame Color Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Frame Background Color</label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {FRAME_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setActiveTemplate((prev) => ({ ...prev, frameColor: c.hex }))}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${c.bgClass} ${
                          activeTemplate.frameColor === c.hex
                            ? 'scale-110 border-pink-500 shadow-md ring-2 ring-pink-500/40'
                            : 'border-transparent hover:scale-105'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* 5. Background Pattern */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Background Pattern Texture</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {PATTERN_OPTIONS.map((pat) => (
                      <button
                        key={pat.id}
                        onClick={() => setActiveTemplate((prev) => ({ ...prev, backgroundPattern: pat.id }))}
                        className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all ${
                          activeTemplate.backgroundPattern === pat.id
                            ? 'bg-pink-500 text-white border-pink-400 shadow-sm'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        <span className="block text-sm mb-0.5">{pat.icon}</span>
                        <span>{pat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Custom Background Image Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Upload Background Image / Texture</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{activeTemplate.backgroundImage ? 'Change Image' : 'Upload Image'}</span>
                    </button>

                    {activeTemplate.backgroundImage && (
                      <button
                        onClick={() => setActiveTemplate((prev) => ({ ...prev, backgroundImage: undefined }))}
                        className="px-3 py-2 text-xs font-bold rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCustomBackgroundUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* 7. SILONG CAFE Watermark Settings */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Watermark (Default: SILONG CAFE)
                    </label>
                    <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                      <button
                        onClick={() => setActiveTemplate((prev) => ({ ...prev, watermarkPosition: 'header' }))}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          activeTemplate.watermarkPosition === 'header'
                            ? 'bg-pink-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Header
                      </button>
                      <button
                        onClick={() => setActiveTemplate((prev) => ({ ...prev, watermarkPosition: 'footer' }))}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          activeTemplate.watermarkPosition !== 'header'
                            ? 'bg-pink-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Footer
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={activeTemplate.watermarkText || 'SILONG CAFE'}
                    onChange={(e) => setActiveTemplate((prev) => ({ ...prev, watermarkText: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                {/* 8. Quick Stickers */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <label className="text-xs font-semibold text-slate-300">Add Quick Stickers</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['✨', '🎂', '💍', '🌸', '🥂', '🎓', '🎃', '🎄', '☕', '🌻', '♡', '★'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleQuickAddSticker(emoji)}
                        className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-base flex items-center justify-center transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Live Interactive Strip Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center relative">
              <div className="w-full max-w-sm flex flex-col items-center">
                <div className="mb-3 flex items-center justify-between w-full px-2 text-xs text-slate-400 font-semibold">
                  <span>Live Photobooth Preview</span>
                  <span className="text-pink-400">{activeTemplate.name}</span>
                </div>

                <div className="transform transition-transform hover:scale-[1.01]">
                  <StripPreview data={previewData} interactive={false} />
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                  Ready to capture with this design?
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleApply}
                  className="px-6 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply This Template</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
