import React, { useEffect, useState } from 'react';
import { Download, Sparkles, Camera, Share2, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface MobileViewerProps {
  sessionId?: string;
  onNewSession: () => void;
}

export const MobileViewer: React.FC<MobileViewerProps> = ({ sessionId, onNewSession }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('SnapBox Photo Strip');
  const [timestamp, setTimestamp] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSession = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const targetId = sessionId || 'snap_latest';

    try {
      // 1. Fetch from server API endpoint
      const response = await fetch(`/api/session?id=${targetId}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.image) {
          setImageSrc(data.image);
          if (data.title) setTitle(data.title);
          if (data.timestamp) {
            setTimestamp(new Date(data.timestamp).toLocaleDateString());
          }
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not fetch from server API, checking localStorage fallback:', err);
    }

    // 2. Fallback to localStorage (for same-device browsing)
    try {
      const stored = localStorage.getItem(targetId) || localStorage.getItem('snap_latest');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.image) {
          setImageSrc(parsed.image);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.timestamp) {
            setTimestamp(new Date(parsed.timestamp).toLocaleDateString());
          }
          setIsLoading(false);
          return;
        }
      }
    } catch (localErr) {
      console.error('LocalStorage parse error:', localErr);
    }

    setIsLoading(false);
    setErrorMsg('Could not find photo strip. Please ensure your phone is connected to the same Wi-Fi network as the photobooth!');
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const handleDownload = () => {
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.download = `snapbox-${Date.now()}.png`;
    link.href = imageSrc;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (navigator.share && imageSrc) {
      try {
        await navigator.share({
          title: title,
          text: 'Here is our photobooth strip from SnapBox!',
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleDownload();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
        <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin mb-4" />
        <h2 className="text-xl font-bold mb-1">Loading Your Photo Strip...</h2>
        <p className="text-slate-400 text-xs">Fetching high-resolution strip from the photobooth</p>
      </div>
    );
  }

  if (!imageSrc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
        <div className="w-16 h-16 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
          <Camera className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Photo Strip Not Found</h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xs mb-4 leading-relaxed">
          {errorMsg || 'Make sure your phone is on the same Wi-Fi network as the photobooth computer.'}
        </p>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={fetchSession}
            className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <button
            onClick={onNewSession}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-500/25"
          >
            Start New Photo Booth Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 flex flex-col items-center justify-between">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <button
          onClick={onNewSession}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>New Strip</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400">
          <Sparkles className="w-4 h-4" />
          <span>SnapBox Mobile</span>
        </div>
      </div>

      {/* Photo Strip Image */}
      <div className="w-full max-w-sm flex items-center justify-center my-auto py-2">
        <div className="relative group max-w-full">
          <img
            src={imageSrc}
            alt={title}
            className="w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-white/10"
          />
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="w-full max-w-md mt-4 space-y-2.5">
        <button
          onClick={handleDownload}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-extrabold text-base shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Download className="w-5 h-5" />
          <span>Save to Photos (Download PNG)</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-4 h-4 text-sky-400" />
            <span>Share</span>
          </button>

          <button
            onClick={onNewSession}
            className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 flex items-center justify-center gap-1.5"
          >
            <Camera className="w-4 h-4 text-pink-400" />
            <span>Take Photos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
