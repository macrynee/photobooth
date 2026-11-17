'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface AccessCodeModalProps {
  isOpen: boolean;
  onSuccess: (code: string, note?: string) => void;
  onOpenAdminLogin: () => void;
}

export const AccessCodeModal: React.FC<AccessCodeModalProps> = ({
  isOpen,
  onSuccess,
  onOpenAdminLogin,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric characters (letters and digits), max 5 characters
    const clean = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 5);
    setCode(clean);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 5) {
      setError('Please enter your 5-character access code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        throw new Error(`Server returned error ${response.status} (${response.statusText || 'Internal error'})`);
      }

      if (response.ok && data?.success) {
        onSuccess(data.code, data.note);
      } else {
        setError(data?.error || 'Invalid or expired access code.');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not connect to authentication server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        
        {/* Glow Header Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 p-0.5 shadow-xl shadow-pink-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Lock className="w-8 h-8 text-pink-400" />
          </div>
        </div>

        {/* Title & Prompt */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold uppercase tracking-wider">
            <KeyRound className="w-3.5 h-3.5" />
            Booth Access Gate
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Enter 5-Digit Access Code
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            Please enter your 5-digit alphanumeric pass code provided by the booth administrator.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Code Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              value={code}
              onChange={handleInputChange}
              placeholder="•••••"
              autoFocus
              className="w-full px-4 py-4 text-center text-3xl font-mono font-black tracking-[0.4em] uppercase rounded-2xl bg-slate-950 border-2 border-slate-700 text-pink-400 placeholder-slate-700 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all shadow-inner"
              maxLength={5}
            />

            {/* Visual 5-slot pill indicator */}
            <div className="flex items-center justify-center gap-2.5 mt-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    code.length > i
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 scale-110 shadow-md shadow-pink-500/40'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 5}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-extrabold text-base shadow-xl shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Unlock & Enter Photobooth</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Admin Login Gateway Link (No code displayed) */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-pink-300 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
            <span>Are you an administrator? <strong>Sign In to Dashboard</strong></span>
          </button>
        </div>

      </div>
    </div>
  );
};
