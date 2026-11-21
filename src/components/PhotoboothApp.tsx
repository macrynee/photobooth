'use client';

import React, { useState, useEffect } from 'react';
import { LayoutType, FilterType, FrameColor, PhotoStripData, AppStep } from '@/types/photobooth';
import { Header } from '@/components/Header';
import { LayoutSelector } from '@/components/LayoutSelector';
import { CameraView } from '@/components/CameraView';
import { StickerCanvas } from '@/components/StickerCanvas';
import { ExportView } from '@/components/ExportView';
import { MobileViewer } from '@/components/MobileViewer';
import { AccessCodeModal } from '@/components/AccessCodeModal';
import { AdminLogin } from '@/components/AdminLogin';
import { AdminRegister } from '@/components/AdminRegister';
import { AdminDashboard } from '@/components/AdminDashboard';
import { sfx } from '@/utils/audio';

type ViewMode = 'booth' | 'admin_login' | 'admin_register' | 'admin_dashboard';

import { PictureTemplate, DeviceRatioMode } from '../types/photobooth';

export const PhotoboothApp: React.FC = () => {
  // Check if viewing via QR code session link on mobile
  const [mobileSessionId, setMobileSessionId] = useState<string | null>(null);

  // Photobooth Access Lock State
  const [isBoothLocked, setIsBoothLocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !sessionStorage.getItem('snapbox_unlocked_code');
  });
  const [activeAccessCode, setActiveAccessCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('snapbox_unlocked_code') || null;
  });
  const [activeCodeNote, setActiveCodeNote] = useState<string | null>(null);

  // View Mode: 'booth' | 'admin_login' | 'admin_register' | 'admin_dashboard'
  const [viewMode, setViewMode] = useState<ViewMode>('booth');

  // Admin Session State
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('snapbox_admin_token') || null;
  });
  const [adminInfo, setAdminInfo] = useState<{ id: string; username: string; email: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('snapbox_admin_info');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session');
      if (sessionParam) {
        setMobileSessionId(sessionParam);
      }
    }
  }, []);

  // Format today's date
  const getFormattedDate = () => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  };

  const [step, setStep] = useState<AppStep>('setup');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [countdownDuration, setCountdownDuration] = useState<number>(3);
  const [deviceRatio, setDeviceRatio] = useState<DeviceRatioMode>('camera');

  const [stripData, setStripData] = useState<PhotoStripData>({
    layout: 'strip-3',
    filter: 'normal',
    frameColor: '#ffffff',
    photos: [],
    stickers: [],
    title: 'SILONG CAFE • STUDIO ARCHIVE',
    subtitle: 'memories forever ♡',
    showDate: true,
    dateStr: getFormattedDate(),
    watermarkText: 'SILONG CAFE',
    watermarkPosition: 'footer',
    backgroundPattern: 'dots',
    headerFont: 'grotesk',
  });

  // Successful Access Code Verification
  const handleAccessCodeSuccess = (code: string, note?: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('snapbox_unlocked_code', code);
    }
    setActiveAccessCode(code);
    setActiveCodeNote(note || null);
    setIsBoothLocked(false);
    sfx.playSuccessFanfare();
  };

  const handleLockBooth = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('snapbox_unlocked_code');
    }
    setActiveAccessCode(null);
    setActiveCodeNote(null);
    setIsBoothLocked(true);
  };

  const handleReset = () => {
    if (stripData.photos.length > 0 && !window.confirm('Start a new photobooth session? The previous code was single-use and a new code will be required.')) {
      return;
    }
    setStripData({
      layout: 'strip-3',
      filter: 'normal',
      frameColor: '#ffffff',
      photos: [],
      stickers: [],
      title: 'SILONG CAFE • STUDIO ARCHIVE',
      subtitle: 'memories forever ♡',
      showDate: true,
      dateStr: getFormattedDate(),
      watermarkText: 'SILONG CAFE',
      watermarkPosition: 'footer',
      backgroundPattern: 'dots',
      headerFont: 'grotesk',
    });
    setStep('setup');
    // Re-lock booth so next user must provide a new single-use code
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('snapbox_unlocked_code');
    }
    setActiveAccessCode(null);
    setActiveCodeNote(null);
    setIsBoothLocked(true);
  };

  const handlePhotosUpdate = (newPhotos: React.SetStateAction<string[]>) => {
    setStripData((prev) => ({
      ...prev,
      photos: typeof newPhotos === 'function' ? newPhotos(prev.photos) : newPhotos,
    }));
  };

  // If user opened via mobile QR link
  if (mobileSessionId) {
    return (
      <MobileViewer
        sessionId={mobileSessionId}
        onNewSession={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', window.location.pathname);
          }
          setMobileSessionId(null);
          handleReset();
        }}
      />
    );
  }

  // Admin Views
  if (viewMode === 'admin_login') {
    return (
      <AdminLogin
        onLoginSuccess={(token, admin) => {
          setAdminToken(token);
          setAdminInfo(admin);
          setViewMode('admin_dashboard');
        }}
        onGoToRegister={() => setViewMode('admin_register')}
        onBackToBooth={() => setViewMode('booth')}
      />
    );
  }

  if (viewMode === 'admin_register') {
    return (
      <AdminRegister
        onRegisterSuccess={(token, admin) => {
          setAdminToken(token);
          setAdminInfo(admin);
          setViewMode('admin_dashboard');
        }}
        onGoToLogin={() => setViewMode('admin_login')}
        onBackToBooth={() => setViewMode('booth')}
      />
    );
  }

  if (viewMode === 'admin_dashboard' && adminToken && adminInfo) {
    return (
      <AdminDashboard
        admin={adminInfo}
        token={adminToken}
        onLogout={() => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('snapbox_admin_token');
            localStorage.removeItem('snapbox_admin_info');
          }
          setAdminToken(null);
          setAdminInfo(null);
          setViewMode('admin_login');
        }}
        onLaunchBooth={(template?: PictureTemplate) => {
          if (template) {
            setStripData((prev) => ({
              ...prev,
              layout: template.layout,
              filter: template.filter,
              frameColor: template.frameColor,
              title: template.title,
              subtitle: template.subtitle,
              showDate: template.showDate,
              stickers: template.stickers || [],
              category: template.category,
              backgroundPattern: template.backgroundPattern,
              backgroundImage: template.backgroundImage,
              headerFont: template.headerFont,
              textColor: template.textColor,
              watermarkText: template.watermarkText || 'SILONG CAFE',
              watermarkPosition: template.watermarkPosition || 'footer',
              borderStyle: template.borderStyle,
              borderColor: template.borderColor,
              photos: [],
            }));
          }
          setIsBoothLocked(false);
          setViewMode('booth');
        }}
      />
    );
  }

  const hasPhotos = stripData.photos.length > 0 && stripData.photos.some(Boolean);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-display selection:bg-pink-500 selection:text-white">
      {/* Access Code Dialog Overlay if Photobooth is Locked */}
      <AccessCodeModal
        isOpen={isBoothLocked}
        onSuccess={handleAccessCodeSuccess}
        onOpenAdminLogin={() => {
          setViewMode('admin_login');
        }}
      />

      {/* Top Header Navigation */}
      <Header
        currentStep={step}
        setStep={setStep}
        onReset={handleReset}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        hasPhotos={hasPhotos}
        onOpenQR={hasPhotos ? () => setStep('export') : undefined}
        activeAccessCode={activeAccessCode}
        onLockBooth={handleLockBooth}
        onOpenAdmin={() => {
          setViewMode('admin_login');
        }}
      />

      {/* Main Body per Step */}
      <main className="flex-1 py-4 sm:py-6">
        {step === 'setup' && (
          <LayoutSelector
            selectedLayout={stripData.layout}
            onSelectLayout={(l: LayoutType) => setStripData((prev) => ({ ...prev, layout: l, photos: [] }))}
            selectedFrameColor={stripData.frameColor}
            onSelectFrameColor={(c: FrameColor) => setStripData((prev) => ({ ...prev, frameColor: c }))}
            title={stripData.title}
            setTitle={(t: string) => setStripData((prev) => ({ ...prev, title: t }))}
            subtitle={stripData.subtitle}
            setSubtitle={(s: string) => setStripData((prev) => ({ ...prev, subtitle: s }))}
            showDate={stripData.showDate}
            setShowDate={(b: boolean) => setStripData((prev) => ({ ...prev, showDate: b }))}
            countdownTimer={countdownDuration}
            setCountdownTimer={setCountdownDuration}
            deviceRatio={deviceRatio}
            setDeviceRatio={setDeviceRatio}
            onApplyTemplate={(template: PictureTemplate) => {
              setStripData((prev) => ({
                ...prev,
                layout: template.layout,
                filter: template.filter,
                frameColor: template.frameColor,
                title: template.title,
                subtitle: template.subtitle,
                showDate: template.showDate,
                stickers: template.stickers || [],
                category: template.category,
                backgroundPattern: template.backgroundPattern,
                backgroundImage: template.backgroundImage,
                headerFont: template.headerFont,
                textColor: template.textColor,
                watermarkText: template.watermarkText || 'SILONG CAFE',
                watermarkPosition: template.watermarkPosition || 'footer',
                borderStyle: template.borderStyle,
                borderColor: template.borderColor,
              }));
              sfx.playSuccessFanfare();
            }}
            onStartSession={() => {
              sfx.playTick();
              setStep('capture');
            }}
          />
        )}

        {step === 'capture' && (
          <CameraView
            layout={stripData.layout}
            filter={stripData.filter}
            setFilter={(f: FilterType) => setStripData((prev) => ({ ...prev, filter: f }))}
            countdownDuration={countdownDuration}
            setCountdownDuration={setCountdownDuration}
            deviceRatio={deviceRatio}
            setDeviceRatio={setDeviceRatio}
            photos={stripData.photos}
            setPhotos={handlePhotosUpdate}
            onFinishSession={() => {
              sfx.playSuccessFanfare();
              setStep('customize');
            }}
            onBackToSetup={() => setStep('setup')}
          />
        )}

        {step === 'customize' && (
          <StickerCanvas
            stripData={stripData}
            setStripData={setStripData}
            onProceedToExport={() => setStep('export')}
            onBackToCapture={() => setStep('capture')}
          />
        )}

        {step === 'export' && (
          <ExportView
            stripData={stripData}
            onBackToEdit={() => setStep('customize')}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Studio Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between px-6 gap-2">
        <p>SnapBox Studio • Interactive Photobooth with Access Code Protection</p>
        <button
          onClick={() => {
            if (adminToken && adminInfo) {
              setViewMode('admin_dashboard');
            } else {
              setViewMode('admin_login');
            }
          }}
          className="text-slate-400 hover:text-pink-400 transition-colors"
        >
          Admin Portal & Code Generator →
        </button>
      </footer>
    </div>
  );
};

export default PhotoboothApp;
