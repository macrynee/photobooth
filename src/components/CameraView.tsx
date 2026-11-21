'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  RefreshCw,
  FlipHorizontal,
  Play,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Video,
  Smartphone,
  Tablet,
  Laptop,
  Layers,
} from 'lucide-react';
import { FilterType, LayoutType, DeviceRatioMode } from '../types/photobooth';
import { FILTERS, FilterSelector } from './FilterSelector';
import { LAYOUT_OPTIONS } from './LayoutSelector';
import { sfx } from '../utils/audio';

export interface DeviceChoice {
  id: DeviceRatioMode;
  name: string;
  shortLabel: string;
  badge: string;
  aspectRatio: number; // width / height
  cssAspect: string;
  maxWClass: string;
  targetW: number;
  targetH: number;
  description: string;
}

export const DEVICE_CHOICES: DeviceChoice[] = [
  {
    id: 'camera',
    name: 'Camera',
    shortLabel: '1:1',
    badge: '1:1 Square',
    aspectRatio: 1,
    cssAspect: 'aspect-square',
    maxWClass: 'max-w-xl',
    targetW: 1080,
    targetH: 1080,
    description: 'Classic 1:1 photobooth cut - perfect for all strip prints',
  },
  {
    id: 'cp',
    name: 'CP / Phone',
    shortLabel: '3:4',
    badge: '3:4 Portrait',
    aspectRatio: 3 / 4,
    cssAspect: 'aspect-[3/4]',
    maxWClass: 'max-w-md',
    targetW: 810,
    targetH: 1080,
    description: 'Cellphone mobile portrait ratio - fits selfie & phone screens',
  },
  {
    id: 'ipad',
    name: 'iPad',
    shortLabel: '4:3',
    badge: '4:3 Tablet',
    aspectRatio: 4 / 3,
    cssAspect: 'aspect-[4/3]',
    maxWClass: 'max-w-2xl',
    targetW: 1440,
    targetH: 1080,
    description: 'iPad & tablet sensor ratio - balanced classic frame',
  },
  {
    id: 'laptop',
    name: 'Laptop',
    shortLabel: '16:9',
    badge: '16:9 Wide',
    aspectRatio: 16 / 9,
    cssAspect: 'aspect-[16/9]',
    maxWClass: 'max-w-3xl',
    targetW: 1920,
    targetH: 1080,
    description: 'Laptop widescreen webcam - captures wider group shots',
  },
];

interface CameraViewProps {
  layout: LayoutType;
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  countdownDuration: number;
  setCountdownDuration: (s: number) => void;
  deviceRatio?: DeviceRatioMode;
  setDeviceRatio?: (m: DeviceRatioMode) => void;
  photos: string[];
  setPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  onFinishSession: () => void;
  onBackToSetup: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  layout,
  filter,
  setFilter,
  countdownDuration,
  setCountdownDuration,
  deviceRatio = 'camera',
  setDeviceRatio,
  photos,
  setPhotos,
  onFinishSession,
  onBackToSetup,
}) => {
  const layoutConfig = LAYOUT_OPTIONS.find((l) => l.id === layout) || LAYOUT_OPTIONS[0];
  const requiredShots = layoutConfig.shots;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const virtualCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [deviceMode, setDeviceMode] = useState<DeviceRatioMode>(deviceRatio);

  // Auto-detect device on initial mount if not explicitly set
  useEffect(() => {
    if (typeof window !== 'undefined' && !deviceRatio) {
      const ua = navigator.userAgent.toLowerCase();
      const isMobile = /iphone|android|ipod|mobile/.test(ua) || window.innerWidth < 640;
      const isTablet = /ipad|tablet/.test(ua) || (window.innerWidth >= 640 && window.innerWidth <= 1024 && 'ontouchstart' in window);

      if (isMobile) {
        setDeviceMode('cp');
        if (setDeviceRatio) setDeviceRatio('cp');
      } else if (isTablet) {
        setDeviceMode('ipad');
        if (setDeviceRatio) setDeviceRatio('ipad');
      }
    }
  }, []);

  useEffect(() => {
    if (deviceRatio) {
      setDeviceMode(deviceRatio);
    }
  }, [deviceRatio]);

  const handleDeviceModeChange = (mode: DeviceRatioMode) => {
    setDeviceMode(mode);
    if (setDeviceRatio) {
      setDeviceRatio(mode);
    }
  };

  // Capture session states
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [currentShotIndex, setCurrentShotIndex] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [poseAlert, setPoseAlert] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // Initialize camera
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      if (isSimulated) {
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
          setStream(null);
        }
        return;
      }

      setCameraError(null);
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 960 },
            facingMode: facingMode,
          },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch((e) => console.warn('Autoplay blocked:', e));
        }
      } catch (err: unknown) {
        console.warn('Webcam access error, falling back to virtual camera:', err);
        setCameraError('Webcam not detected or access denied. Switched to virtual studio camera!');
        setIsSimulated(true);
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, isSimulated]);

  // Virtual animated camera stream loop
  useEffect(() => {
    if (!isSimulated) return;

    let animId: number;
    let t = 0;

    const renderVirtualFeed = () => {
      const canvas = virtualCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // Colorful studio gradient backdrop
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#4c1d95');
      grad.addColorStop(1, '#831843');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Studio spotlight circles
      t += 0.03;
      const spotX = w / 2 + Math.sin(t) * 120;
      const spotY = h / 2 + Math.cos(t * 0.8) * 60;
      const spotGrad = ctx.createRadialGradient(spotX, spotY, 20, spotX, spotY, 320);
      spotGrad.addColorStop(0, 'rgba(244, 114, 182, 0.4)');
      spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, w, h);

      // Cute stylized photobooth avatar / mannequin posing
      ctx.save();
      ctx.translate(w / 2, h / 2 + 50);

      // Pose oscillation
      const headTilt = Math.sin(t * 1.5) * 0.08;
      ctx.rotate(headTilt);

      // Head
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, -60, 90, 0, Math.PI * 2);
      ctx.fill();

      // Sunglasses / photobooth prop
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      // Left lens
      ctx.roundRect(-70, -80, 60, 40, 10);
      // Right lens
      ctx.roundRect(10, -80, 60, 40, 10);
      // Bridge
      ctx.rect(-10, -70, 20, 10);
      ctx.fill();

      // Lens reflection
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-60, -70);
      ctx.lineTo(-40, -50);
      ctx.moveTo(20, -70);
      ctx.lineTo(40, -50);
      ctx.stroke();

      // Big Smile
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, -50, 45, 0.2 * Math.PI, 0.8 * Math.PI, false);
      ctx.stroke();

      // Rosy Cheeks
      ctx.fillStyle = 'rgba(244, 63, 94, 0.6)';
      ctx.beginPath();
      ctx.arc(-55, -35, 14, 0, Math.PI * 2);
      ctx.arc(55, -35, 14, 0, Math.PI * 2);
      ctx.fill();

      // Body / Party outfit
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(-110, 150);
      ctx.lineTo(-70, 30);
      ctx.lineTo(70, 30);
      ctx.lineTo(110, 150);
      ctx.closePath();
      ctx.fill();

      // Party sparkles around
      ctx.font = '28px sans-serif';
      ctx.fillText('✨', -160 + Math.sin(t * 2) * 10, -120);
      ctx.fillText('⭐', 140 + Math.cos(t * 2) * 10, -130);
      ctx.fillText('💖', -140, 80);
      ctx.fillText('✌️', 120, 60);

      ctx.restore();

      // Studio Overlay Text
      ctx.font = 'bold 20px "Space Grotesk", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.textAlign = 'center';
      ctx.fillText('VIRTUAL BOOTH CAMERA SIMULATOR', w / 2, 40);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('Ready for your best pose!', w / 2, 65);

      animId = requestAnimationFrame(renderVirtualFeed);
    };

    renderVirtualFeed();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isSimulated]);

  // Capture current frame from webcam or simulated canvas based on chosen device ratio
  const captureCurrentFrame = (): string => {
    let sourceWidth = 1080;
    let sourceHeight = 1080;
    let sourceElement: HTMLVideoElement | HTMLCanvasElement | null = null;

    if (isSimulated && virtualCanvasRef.current) {
      sourceElement = virtualCanvasRef.current;
      sourceWidth = virtualCanvasRef.current.width || 1080;
      sourceHeight = virtualCanvasRef.current.height || 1080;
    } else if (videoRef.current && videoRef.current.readyState >= 2) {
      sourceElement = videoRef.current;
      sourceWidth = videoRef.current.videoWidth || 1280;
      sourceHeight = videoRef.current.videoHeight || 960;
    }

    if (!sourceElement) return '';

    const currentPreset = DEVICE_CHOICES.find((d) => d.id === deviceMode) || DEVICE_CHOICES[0];
    const targetRatio = currentPreset.aspectRatio;

    const sourceRatio = sourceWidth / sourceHeight;
    let sWidth = sourceWidth;
    let sHeight = sourceHeight;
    let sx = 0;
    let sy = 0;

    // Crop cleanly to exact device aspect ratio with zero distortion or stretching
    if (sourceRatio > targetRatio) {
      sWidth = Math.round(sourceHeight * targetRatio);
      sx = Math.max(0, Math.round((sourceWidth - sWidth) / 2));
    } else {
      sHeight = Math.round(sourceWidth / targetRatio);
      sy = Math.max(0, Math.round((sourceHeight - sHeight) / 2));
    }

    const canvas = document.createElement('canvas');
    canvas.width = currentPreset.targetW;
    canvas.height = currentPreset.targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.save();
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(
      sourceElement,
      sx,
      sy,
      sWidth,
      sHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  // Perform single flash and capture
  const snapShot = (targetIndex: number) => {
    setIsFlashing(true);
    sfx.playShutter();

    const dataUrl = captureCurrentFrame();
    setPhotos((prev) => {
      const updated = [...prev];
      updated[targetIndex] = dataUrl;
      return updated;
    });

    setTimeout(() => {
      setIsFlashing(false);
    }, 400);
  };

  // Start automated multi-shot session sequence
  const startAutomatedSession = () => {
    setPhotos([]);
    setIsSessionActive(true);
    setCurrentShotIndex(0);
    runShotSequence(0);
  };

  const runShotSequence = (shotIdx: number) => {
    setCurrentShotIndex(shotIdx);
    setPoseAlert(`Pose ${shotIdx + 1} of ${requiredShots}! Get ready!`);

    let timeLeft = countdownDuration;
    setCountdown(timeLeft);
    sfx.playTick();

    const timerInterval = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft > 0) {
        setCountdown(timeLeft);
        if (timeLeft === 1) {
          sfx.playFinalTick();
        } else {
          sfx.playTick();
        }
      } else {
        clearInterval(timerInterval);
        setCountdown(null);
        setPoseAlert(null);

        // Snap current frame
        snapShot(shotIdx);

        // Check if there are more shots
        const nextShotIdx = shotIdx + 1;
        if (nextShotIdx < requiredShots) {
          setTimeout(() => {
            runShotSequence(nextShotIdx);
          }, 2400); // 2.4s pause between shots
        } else {
          // Finished session!
          setTimeout(() => {
            setIsSessionActive(false);
            sfx.playSuccessFanfare();
          }, 800);
        }
      }
    }, 1000);
  };

  // Retake a specific individual shot
  const retakeSingleShot = (shotIdx: number) => {
    setIsSessionActive(true);
    setCurrentShotIndex(shotIdx);
    setPoseAlert(`Retaking Pose ${shotIdx + 1}!`);

    let timeLeft = countdownDuration;
    setCountdown(timeLeft);
    sfx.playTick();

    const timerInterval = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft > 0) {
        setCountdown(timeLeft);
        if (timeLeft === 1) {
          sfx.playFinalTick();
        } else {
          sfx.playTick();
        }
      } else {
        clearInterval(timerInterval);
        setCountdown(null);
        setPoseAlert(null);
        snapShot(shotIdx);
        setIsSessionActive(false);
        sfx.playSuccessFanfare();
      }
    }, 1000);
  };

  const currentFilterConfig = FILTERS.find((f) => f.id === filter) || FILTERS[0];
  const allShotsTaken = photos.length >= requiredShots && photos.every(Boolean);
  const currentPreset = DEVICE_CHOICES.find((d) => d.id === deviceMode) || DEVICE_CHOICES[0];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">

      {/* Top Banner Alert & Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{layoutConfig.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-semibold border border-pink-500/30">
              {photos.filter(Boolean).length} / {requiredShots} Captured
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Device: <strong className="text-pink-400">{currentPreset.name} ({currentPreset.badge})</strong> • Filter: <strong className="text-pink-400">{currentFilterConfig.name}</strong> • Timer: <strong className="text-amber-400">{countdownDuration}s</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToSetup}
            disabled={isSessionActive}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            ← Change Layout
          </button>

          {allShotsTaken && (
            <button
              onClick={onFinishSession}
              className="px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Next: Add Stickers & Text →</span>
            </button>
          )}
        </div>
      </div>

      {/* Device & Aspect Ratio Selector: CP, iPad, Laptop, Camera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-pink-400 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">Device Camera Ratio</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-pink-400 border border-slate-700">
                Active: {currentPreset.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Auto-calibrates exact aspect ratio and zero stretching for your screen
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          {DEVICE_CHOICES.map((dev) => {
            const isSelected = deviceMode === dev.id;
            const Icon =
              dev.id === 'cp'
                ? Smartphone
                : dev.id === 'ipad'
                ? Tablet
                : dev.id === 'laptop'
                ? Laptop
                : Camera;

            return (
              <button
                key={dev.id}
                type="button"
                disabled={isSessionActive}
                onClick={() => handleDeviceModeChange(dev.id)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-extrabold text-xs transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 border-pink-400 text-white shadow-lg shadow-pink-500/25 scale-[1.02]'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={dev.description}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{dev.name}</span>
                <span className="text-[10px] opacity-75 font-normal">({dev.shortLabel})</span>
              </button>
            );
          })}
        </div>
      </div>

      {cameraError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Main Studio Viewport & Side Filmstrip */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Left: Main Viewfinder Box */}
        <div className="lg:col-span-3 space-y-4">
          <div className={`relative rounded-3xl overflow-hidden bg-black shadow-2xl border-4 border-slate-800 group transition-all duration-300 ${currentPreset.cssAspect} ${currentPreset.maxWClass} mx-auto`}>

            {/* Real Camera Video or Simulated Canvas */}
            {isSimulated ? (
              <canvas
                ref={virtualCanvasRef}
                width={currentPreset.targetW}
                height={currentPreset.targetH}
                className="w-full h-full object-cover transition-all"
                style={{
                  filter: currentFilterConfig.cssFilter,
                  transform: isMirrored ? 'scaleX(-1)' : 'none',
                }}
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transition-all"
                style={{
                  filter: currentFilterConfig.cssFilter,
                  transform: isMirrored ? 'scaleX(-1)' : 'none',
                }}
              />
            )}

            {/* Shutter Flash Animation */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white z-30 animate-flash pointer-events-none" />
            )}

            {/* Live Camera Grid Guidelines Overlay */}
            <div className="absolute inset-0 pointer-events-none border border-white/10 grid grid-cols-3 grid-rows-3 opacity-30">
              <div className="border-r border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-b border-white/20"></div>
              <div className="border-r border-white/20"></div>
              <div className="border-r border-white/20"></div>
              <div></div>
            </div>

            {/* Pose Banner Alert (Get ready for Pose #2) */}
            {poseAlert && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 px-6 py-2 rounded-full bg-slate-900/90 backdrop-blur-md border border-pink-500/50 text-pink-300 font-extrabold text-sm sm:text-base tracking-wide shadow-2xl animate-bounce">
                📸 {poseAlert}
              </div>
            )}

            {/* Giant Pulsing Countdown Timer Digits */}
            {countdown !== null && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none bg-slate-950/30 backdrop-blur-[2px]">
                <div className="text-8xl sm:text-9xl font-black text-white drop-shadow-[0_10px_20px_rgba(236,72,153,0.8)] animate-pulse-fast font-retro">
                  {countdown}
                </div>
                <p className="text-lg font-bold text-pink-300 tracking-widest uppercase mt-2">
                  Say Cheese!
                </p>
              </div>
            )}

            {/* Viewfinder On-Screen Floating Badges */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                LIVE
              </span>
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-300">
                {currentFilterConfig.name}
              </span>
            </div>

            {/* Top-Right Quick Camera Controls */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              {/* Quick Active Device Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-pink-300">
                <span>{currentPreset.name}</span>
                <span className="text-[10px] text-slate-400">({currentPreset.shortLabel})</span>
              </div>

              <button
                onClick={() => setIsMirrored(!isMirrored)}
                className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                  isMirrored
                    ? 'bg-pink-500/30 border-pink-500/40 text-pink-300'
                    : 'bg-black/60 border-white/10 text-white'
                }`}
                title="Mirror Camera Flip"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsSimulated(!isSimulated)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-semibold transition-all ${
                  isSimulated
                    ? 'bg-purple-600/40 border-purple-400/50 text-purple-300'
                    : 'bg-black/60 border-white/10 text-slate-300 hover:text-white'
                }`}
                title="Toggle Virtual/Real Webcam"
              >
                <Video className="w-3.5 h-3.5" />
                <span>{isSimulated ? 'Simulated' : 'Webcam'}</span>
              </button>
            </div>

            {/* Bottom In-Viewport Controls Bar */}
            <div className="absolute bottom-4 inset-x-4 z-10 flex items-center justify-between p-3 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10">

              {/* Countdown Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
                  Timer:
                </span>
                {[3, 5, 10].map((t) => (
                  <button
                    key={t}
                    disabled={isSessionActive}
                    onClick={() => setCountdownDuration(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${countdownDuration === t
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>

              {/* Main Shutter Trigger Button */}
              <div>
                {!isSessionActive ? (
                  <button
                    onClick={startAutomatedSession}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Camera className="w-5 h-5 text-white animate-pulse" />
                    <span>
                      {photos.length === 0 ? 'Start Capture Session' : 'Retake All Poses'}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    Capturing Pose {currentShotIndex + 1} of {requiredShots}...
                  </div>
                )}
              </div>

              {/* Single Manual Snap Button */}
              <button
                disabled={isSessionActive}
                onClick={() => {
                  const nextSlot = photos.length < requiredShots ? photos.length : 0;
                  snapShot(nextSlot);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors hidden sm:block"
                title="Capture 1 photo immediately"
              >
                Instant Snap
              </button>

            </div>

          </div>

          {/* Filter Bar Under Viewfinder */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <FilterSelector currentFilter={filter} onSelectFilter={setFilter} />
          </div>

        </div>

        {/* Right: Live Filmstrip Gallery of Shots Taken */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Strip Filmstrip</span>
            </h3>
            <span className="text-xs text-slate-400">
              {photos.filter(Boolean).length}/{requiredShots}
            </span>
          </div>

          <div className="space-y-3">
            {Array.from({ length: requiredShots }).map((_, idx) => {
              const photo = photos[idx];
              const isCurrentlyActive = currentShotIndex === idx && isSessionActive;

              return (
                <div
                  key={idx}
                  className={`relative rounded-2xl overflow-hidden border transition-all ${isCurrentlyActive
                      ? 'border-pink-500 ring-2 ring-pink-500/50 bg-slate-800'
                      : photo
                        ? 'border-slate-700 bg-slate-900'
                        : 'border-dashed border-slate-800 bg-slate-950/40'
                    }`}
                >
                  <div className={`${currentPreset.cssAspect} w-full flex items-center justify-center relative transition-all`}>
                    {photo ? (
                      <>
                        <img
                          src={photo}
                          alt={`Shot #${idx + 1}`}
                          className="w-full h-full object-cover"
                          style={{ filter: FILTERS.find((f) => f.id === filter)?.cssFilter }}
                        />
                        {/* Hover Retake Button */}
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                          <button
                            onClick={() => retakeSingleShot(idx)}
                            disabled={isSessionActive}
                            className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-1 shadow-md"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retake Pose #{idx + 1}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-600">
                        <Camera className="w-6 h-6 stroke-[1.5]" />
                        <span className="text-[11px] font-semibold">Pose #{idx + 1}</span>
                      </div>
                    )}

                    {/* Corner Tag */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white">
                      #{idx + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {allShotsTaken && (
            <button
              onClick={onFinishSession}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold text-sm shadow-xl shadow-pink-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Customize with Stickers →</span>
            </button>
          )}

        </div>

      </div>

    </div>
  );
};
