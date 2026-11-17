'use client';

import React from 'react';
import { Camera, Volume2, VolumeX, RefreshCw, QrCode, Shield, Lock } from 'lucide-react';
import { AppStep } from '../types/photobooth';
import { sfx } from '../utils/audio';

interface HeaderProps {
  currentStep: AppStep;
  setStep: (step: AppStep) => void;
  onReset: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  hasPhotos: boolean;
  onOpenQR?: () => void;
  activeAccessCode: string | null;
  onLockBooth: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  setStep,
  onReset,
  soundEnabled,
  setSoundEnabled,
  hasPhotos,
  onOpenQR,
  activeAccessCode,
  onLockBooth,
  onOpenAdmin,
}) => {
  const steps: { id: AppStep; label: string; number: number }[] = [
    { id: 'setup', label: '1. Layout', number: 1 },
    { id: 'capture', label: '2. Capture', number: 2 },
    { id: 'customize', label: '3. Stickers', number: 3 },
    { id: 'export', label: '4. Print & QR', number: 4 },
  ];

  const toggleSound = () => {
    sfx.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      sfx.playTick();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand Logo & Active Pass Tag */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-pink-500/25 ring-2 ring-pink-400/30">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-pink-100 to-pink-400 bg-clip-text text-transparent">
                SNAPBOX
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 rounded-md border border-pink-500/30">
                Booth
              </span>
            </div>
            {activeAccessCode && (
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Booth Authorized
              </p>
            )}
          </div>
        </div>

        {/* Step Indicator Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {steps.map((s) => {
            const isActive = currentStep === s.id;
            const isClickable = s.id === 'setup' || (s.id === 'capture') || (hasPhotos && (s.id === 'customize' || s.id === 'export'));

            return (
              <button
                key={s.id}
                disabled={!isClickable}
                onClick={() => setStep(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30 font-semibold'
                    : isClickable
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {hasPhotos && onOpenQR && (
            <button
              onClick={onOpenQR}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 transition-colors"
              title="Show QR Code"
            >
              <QrCode className="w-4 h-4 text-pink-400" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>
          )}

          <button
            onClick={toggleSound}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-slate-800/80 text-pink-400 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 border border-slate-700 text-slate-300 transition-colors"
            title="Start fresh session"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Session</span>
          </button>

          {activeAccessCode && (
            <button
              onClick={onLockBooth}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Lock Photobooth (Require Access Code)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          )}

          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800/80 hover:bg-pink-500/20 hover:text-pink-300 border border-slate-700 text-slate-300 transition-colors"
            title="Admin Portal"
          >
            <Shield className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        </div>

      </div>
    </header>
  );
};
