'use client';

import React, { useState, useEffect } from 'react';
import { LayoutType, FrameColor, FilterType, PictureTemplate, DeviceRatioMode } from '../types/photobooth';
import { LayoutGrid, Check, Sparkles, Clock, Palette, Calendar, Layers, ChevronRight, X, Smartphone, Tablet, Laptop, Camera } from 'lucide-react';
import { MONTH_NAMES } from './AdminTemplateManager';
import { TemplateGalleryModal } from './TemplateGalleryModal';
import { getSubtitlePartnerColor } from '../utils/patternStyles';

interface LayoutSelectorProps {
  selectedLayout: LayoutType;
  onSelectLayout: (layout: LayoutType) => void;
  selectedFrameColor: FrameColor;
  onSelectFrameColor: (color: FrameColor) => void;
  title: string;
  setTitle: (t: string) => void;
  subtitle: string;
  setSubtitle: (s: string) => void;
  showDate: boolean;
  setShowDate: (b: boolean) => void;
  countdownTimer: number;
  setCountdownTimer: (s: number) => void;
  deviceRatio?: DeviceRatioMode;
  setDeviceRatio?: (m: DeviceRatioMode) => void;
  onApplyTemplate?: (template: PictureTemplate) => void;
  onStartSession: () => void;
}

export const LAYOUT_OPTIONS = [
  {
    id: 'strip-3' as LayoutType,
    name: 'Korean 3-Photo Strip',
    shots: 3,
    badge: 'Trending',
    description: 'Iconic vertical 3-cut strip inspired by Seoul photo booths.',
    preview: ['h-10', 'h-10', 'h-10'],
    cols: 1,
  },
  {
    id: 'strip-4' as LayoutType,
    name: 'Classic 4-Photo Strip',
    shots: 4,
    badge: 'Classic',
    description: 'The nostalgic vintage photo strip with 4 sequential poses.',
    preview: ['h-7', 'h-7', 'h-7', 'h-7'],
    cols: 1,
  },
  {
    id: 'grid-4' as LayoutType,
    name: '2×2 Quad Grid',
    shots: 4,
    badge: 'Popular',
    description: 'Instagram-ready square layout with 4 candid shots.',
    preview: ['h-9', 'h-9', 'h-9', 'h-9'],
    cols: 2,
  },
  {
    id: 'wide-2' as LayoutType,
    name: 'Cinematic Duo Wide',
    shots: 2,
    badge: 'Wide',
    description: 'Two cinematic landscape snapshots with ample space.',
    preview: ['h-12', 'h-12'],
    cols: 1,
  },
  {
    id: 'polaroid-1' as LayoutType,
    name: 'Iconic Polaroid',
    shots: 1,
    badge: 'Solo',
    description: 'Single signature instant Polaroid with classic broad bottom.',
    preview: ['h-24'],
    cols: 1,
  },
];

export const FRAME_COLORS: { hex: FrameColor; name: string; bgClass: string }[] = [
  { hex: '#ffffff', name: 'Clean White', bgClass: 'bg-white' },
  { hex: '#121214', name: 'Noir Black', bgClass: 'bg-zinc-900 border border-zinc-700' },
  { hex: '#ffe4e6', name: 'Pastel Blossom', bgClass: 'bg-rose-200' },
  { hex: '#ede9fe', name: 'Dreamy Lavender', bgClass: 'bg-purple-200' },
  { hex: '#d1fae5', name: 'Matcha Mint', bgClass: 'bg-emerald-200' },
  { hex: '#fef3c7', name: 'Retro Cream', bgClass: 'bg-amber-100' },
  { hex: '#0f172a', name: 'Deep Slate', bgClass: 'bg-slate-900 border border-slate-700' },
  { hex: '#ff007f', name: 'Neon Pop Pink', bgClass: 'bg-pink-600' },
];

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  selectedLayout,
  onSelectLayout,
  selectedFrameColor,
  onSelectFrameColor,
  title,
  setTitle,
  subtitle,
  setSubtitle,
  showDate,
  setShowDate,
  countdownTimer,
  setCountdownTimer,
  deviceRatio = 'camera',
  setDeviceRatio,
  onApplyTemplate,
  onStartSession,
}) => {
  const currentConfig = LAYOUT_OPTIONS.find((l) => l.id === selectedLayout) || LAYOUT_OPTIONS[0];

  const [templates, setTemplates] = useState<PictureTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const currentMonthNum = new Date().getMonth() + 1;

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || []);
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    fetchTemplates();
  }, []);

  const handleApplyTemplate = (tpl: PictureTemplate) => {
    setActiveTemplateId(tpl.id);
    onSelectLayout(tpl.layout);
    onSelectFrameColor(tpl.frameColor);
    setTitle(tpl.title);
    setSubtitle(tpl.subtitle);
    setShowDate(tpl.showDate);
    if (onApplyTemplate) {
      onApplyTemplate(tpl);
    }
  };

  const filteredTemplates = templates.filter((tpl) => {
    if (monthFilter === 'all') return true;
    if (monthFilter === 'current') return tpl.month === currentMonthNum;
    if (monthFilter === 'custom') return tpl.month === null || tpl.month === undefined;
    const m = parseInt(monthFilter, 10);
    return tpl.month === m;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8 animate-fadeIn">
      {/* Title & Introduction */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Step 1: Customize Your Booth Experience
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Choose Your Photo Strip Design
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Pick a seasonal monthly design, holiday occasion theme, or build your custom layout from scratch.
        </p>
      </div>

      {/* Hero Template Gallery Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-500/30 p-5 sm:p-6 shadow-xl shadow-pink-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-extrabold text-[11px] uppercase tracking-wider border border-pink-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-pink-400" />
              <span>11 Curated Aesthetic Categories</span>
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">•</span>
            <span className="text-xs font-semibold text-amber-300 hidden sm:inline">
              Watermark: SILONG CAFE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Browse Photo Booth Template Gallery
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Minimalist, Old Money, Birthday, Wedding, Graduation, Y2K Retro, Christmas, Corporate, Aesthetic Pastel, Anniversary, and Halloween.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsGalleryOpen(true)}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-pink-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <span>✨ Open Template Gallery</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Occasion & Monthly Templates Showcase */}
      {templates.length > 0 && (
        <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-400" />
                <h2 className="text-base font-bold text-white">Occasion & Monthly Themes</h2>
                <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-extrabold border border-pink-500/20">
                  All 12 Months Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any holiday design below to automatically load its headers, frame color, and stickers.
              </p>
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-xs">
              <button
                type="button"
                onClick={() => setMonthFilter('all')}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all whitespace-nowrap border ${
                  monthFilter === 'all'
                    ? 'bg-pink-500 border-pink-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Themes
              </button>

              <button
                type="button"
                onClick={() => setMonthFilter('current')}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all whitespace-nowrap border flex items-center gap-1 ${
                  monthFilter === 'current'
                    ? 'bg-pink-500 border-pink-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>⭐</span>
                <span>Current Month</span>
              </button>

              <button
                type="button"
                onClick={() => setMonthFilter('custom')}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all whitespace-nowrap border ${
                  monthFilter === 'custom'
                    ? 'bg-pink-500 border-pink-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                General & Events
              </button>

              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="px-2.5 py-1 rounded-xl font-bold transition-all whitespace-nowrap border bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/40 text-pink-300 hover:text-white hover:bg-pink-500/30 flex items-center gap-1"
              >
                <span>🎨</span>
                <span>All 11 Categories →</span>
              </button>
            </div>
          </div>

          {/* Horizontal Themed Carousel Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
            {filteredTemplates.map((tpl) => {
              const isApplied = activeTemplateId === tpl.id;
              const monthInfo = tpl.month ? MONTH_NAMES.find((m) => m.num === tpl.month) : null;

              return (
                <div
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl)}
                  className={`group relative rounded-2xl p-3 cursor-pointer transition-all duration-200 border flex flex-col justify-between ${
                    isApplied
                      ? 'bg-slate-800/95 border-pink-500 ring-2 ring-pink-500/40 shadow-lg shadow-pink-500/20 scale-[1.02]'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  {/* Month / Occasion Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold text-pink-400 flex items-center gap-1">
                      <span>{monthInfo ? monthInfo.emoji : '✨'}</span>
                      <span>{monthInfo ? monthInfo.name.slice(0, 3) : 'EVENT'}</span>
                    </span>

                    {isApplied && (
                      <span className="w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Frame Mini Swatch */}
                  <div
                    className="p-2 rounded-lg my-1 text-center shadow-inner border border-black/20"
                    style={{ backgroundColor: tpl.frameColor }}
                  >
                    <p
                      className={`text-[9px] font-black uppercase font-retro truncate ${
                        tpl.frameColor === '#121214' || tpl.frameColor === '#0f172a'
                          ? 'text-white'
                          : 'text-slate-900'
                      }`}
                    >
                      {tpl.title}
                    </p>
                    {tpl.subtitle && (() => {
                      const partner = getSubtitlePartnerColor(tpl.frameColor, tpl.category, tpl.subtitleColor);
                      return (
                        <p
                          className={`text-[9px] font-handwriting font-bold truncate mt-0.5 ${partner.className}`}
                          style={{ color: partner.hex }}
                        >
                          {tpl.subtitle}
                        </p>
                      );
                    })()}
                  </div>

                  {/* Name and Tagline */}
                  <div className="mt-2">
                    <h3 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                      {tpl.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {tpl.layout}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {activeTemplateId && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Theme Applied: <strong>{templates.find((t) => t.id === activeTemplateId)?.name}</strong></span>
              </span>

              <button
                type="button"
                onClick={() => {
                  setActiveTemplateId(null);
                  setTitle('SNAPBOX PHOTOBOOTH');
                  setSubtitle('memories forever ♡');
                }}
                className="text-slate-400 hover:text-white text-[11px] font-medium"
              >
                Clear Theme & Use Default
              </button>
            </div>
          )}
        </div>
      )}

      {/* Layout Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {LAYOUT_OPTIONS.map((layout) => {
          const isSelected = selectedLayout === layout.id;

          return (
            <div
              key={layout.id}
              onClick={() => onSelectLayout(layout.id)}
              className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-200 border flex flex-col justify-between group ${
                isSelected
                  ? 'bg-slate-800/90 border-pink-500 shadow-lg shadow-pink-500/20 ring-2 ring-pink-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-pink-400 border border-slate-700">
                  {layout.badge}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {layout.shots} {layout.shots === 1 ? 'Shot' : 'Shots'}
                </span>
              </div>

              {/* Layout Visual Schematic */}
              <div className="my-2 p-3 rounded-xl bg-slate-950 flex items-center justify-center min-h-[140px] border border-slate-800/80">
                <div
                  className={`w-28 p-2 rounded shadow-inner ${
                    layout.cols === 2 ? 'grid grid-cols-2 gap-1.5' : 'flex flex-col gap-1.5'
                  }`}
                  style={{ backgroundColor: selectedFrameColor }}
                >
                  {layout.preview.map((hClass, idx) => (
                    <div
                      key={idx}
                      className={`w-full ${hClass} rounded-sm bg-slate-700/80 border border-slate-600/40 flex items-center justify-center text-[10px] text-slate-300 font-bold`}
                    >
                      #{idx + 1}
                    </div>
                  ))}
                  <div className="h-2 w-12 mx-auto rounded-full bg-slate-400/40 mt-1" />
                </div>
              </div>

              {/* Card Meta */}
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white group-hover:text-pink-300 transition-colors">
                    {layout.name}
                  </h3>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{layout.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Frame Color & Booth Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        
        {/* Left: Frame Background Color */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-pink-400" />
            <h3 className="font-bold text-white text-base">Select Frame Color</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {FRAME_COLORS.map((color) => {
              const isSelected = selectedFrameColor === color.hex;
              return (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => onSelectFrameColor(color.hex)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-pink-500 bg-pink-500/10 ring-2 ring-pink-500/30'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center ${color.bgClass}`}
                  >
                    {isSelected && (
                      <Check
                        className={`w-4 h-4 ${
                          color.hex === '#ffffff' || color.hex === '#fef3c7' || color.hex === '#ffe4e6' || color.hex === '#d1fae5' || color.hex === '#ede9fe'
                            ? 'text-slate-900'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 truncate max-w-full">
                    {color.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Countdown Timer Setting */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-sm text-slate-200">Countdown Timer</span>
              </div>
              <span className="text-xs text-slate-400">Time per pose</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[3, 5, 10].map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => setCountdownTimer(seconds)}
                  className={`py-2 px-3 rounded-xl text-sm font-bold border transition-all ${
                    countdownTimer === seconds
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {seconds} Seconds
                </button>
              ))}
            </div>
          </div>

          {/* Device Camera Framing Setting */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-pink-400" />
                <span className="font-semibold text-sm text-slate-200">Device Framing & Ratio</span>
              </div>
              <span className="text-[11px] text-pink-400 font-bold uppercase">CP • iPad • Laptop • Camera</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'cp', label: 'CP / Phone', ratio: '3:4', icon: Smartphone },
                { id: 'ipad', label: 'iPad', ratio: '4:3', icon: Tablet },
                { id: 'laptop', label: 'Laptop', ratio: '16:9', icon: Laptop },
                { id: 'camera', label: 'Camera', ratio: '1:1', icon: Camera },
              ].map((item) => {
                const isSelected = (deviceRatio || 'camera') === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDeviceRatio && setDeviceRatio(item.id as DeviceRatioMode)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-md shadow-pink-500/10'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.label}</span>
                    <span className="text-[10px] opacity-75 font-normal">({item.ratio})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Custom Header & Footer Labels */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <h3 className="font-bold text-white text-base">Strip Customization & Titles</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Main Header Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., SNAPBOX PHOTOBOOTH"
                maxLength={28}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subtitle / Handwritten Note
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g., Besties night out! 💕"
                maxLength={36}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-pink-300 text-sm focus:outline-none focus:border-pink-500 transition-colors font-handwriting text-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-sm font-medium text-slate-200">Show Date & Time Stamp</span>
                <p className="text-xs text-slate-400">Prints the session date at the bottom</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDate}
                  onChange={(e) => setShowDate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* Start Session CTA Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onStartSession}
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-extrabold text-lg shadow-xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span>Enter Photo Booth ({currentConfig.shots} {currentConfig.shots === 1 ? 'Pose' : 'Poses'})</span>
          <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            →
          </span>
        </button>
      </div>

      {/* Modern Template Gallery Modal */}
      <TemplateGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onApplyTemplate={handleApplyTemplate}
        currentTemplateId={activeTemplateId}
      />
    </div>
  );
};
