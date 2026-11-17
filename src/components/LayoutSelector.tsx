'use client';

import React from 'react';
import { LayoutType, FrameColor, FilterType } from '../types/photobooth';
import { LayoutGrid, Check, Sparkles, Clock, Palette } from 'lucide-react';

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
  onStartSession,
}) => {
  const currentConfig = LAYOUT_OPTIONS.find((l) => l.id === selectedLayout) || LAYOUT_OPTIONS[0];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8 animate-fadeIn">
      {/* Title & Introduction */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Step 1: Customize Your Booth Experience
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Choose Your Photo Strip Layout
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Select your favorite strip arrangement, timer countdown, and frame aesthetics before stepping into the booth.
        </p>
      </div>

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
    </div>
  );
};
