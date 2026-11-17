import React, { useState } from 'react';
import { QrCode, Download, Printer, Share2, Copy, Check, ExternalLink, X, Sparkles } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl: string;
  shareUrl: string;
  renderedImageUrl: string;
  title?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  qrCodeUrl,
  shareUrl,
  renderedImageUrl,
  title = 'SnapBox Photo Strip',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.download = `snapbox-${Date.now()}.png`;
    link.href = renderedImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Photo Strip - SnapBox</title>
            <style>
              body {
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                min-height: 100vh;
              }
              img {
                max-height: 95vh;
                max-width: 90vw;
                object-fit: contain;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              }
              @media print {
                body { margin: 0; background: none; }
                img { max-height: 100vh; width: auto; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <img src="${renderedImageUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: 'Check out our photo booth strip from SnapBox!',
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold uppercase tracking-wider">
            <QrCode className="w-3.5 h-3.5" />
            Instant Mobile Download
          </div>
          <h3 className="text-2xl font-black text-white">Scan to Save Your Strip</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Point your smartphone camera at this QR code to instantly view and save this photo strip directly to your phone.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex justify-center my-4">
          <div className="relative p-5 rounded-3xl bg-white shadow-2xl shadow-pink-500/20 ring-4 ring-pink-500/30 group">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="Scan to download photo strip"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                Generating QR Code...
              </div>
            )}
            
            {/* Center Logo in QR Code */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-pink-500 flex items-center justify-center shadow-lg border-2 border-white pointer-events-none">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Shareable Link Input with Copy */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-950 border border-slate-800">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full bg-transparent px-2 text-xs text-slate-400 focus:outline-none truncate font-mono"
          />
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-pink-600 hover:bg-pink-500 text-white'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Download & Print Actions */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <button
            onClick={handleDownloadImage}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700/60 group"
          >
            <Download className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Download PNG</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700/60 group"
          >
            <Printer className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Print Strip</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700/60 group"
          >
            <Share2 className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Share Link</span>
          </button>
        </div>

      </div>
    </div>
  );
};
