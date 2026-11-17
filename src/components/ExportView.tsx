
import React, { useEffect, useState } from 'react';
import { PhotoStripData } from '../types/photobooth';
import { renderStripToCanvas } from '../utils/canvasRenderer';
import { generatePhotoBoothQR, QRCodeResult } from '../utils/qrHelper';
import { QrCode, Download, Printer, Share2, Sparkles, Edit2, RotateCcw, Copy, Check, Wifi, Settings2 } from 'lucide-react';
import { QRCodeModal } from './QRCodeModal';
import { sfx } from '../utils/audio';

interface ExportViewProps {
  stripData: PhotoStripData;
  onBackToEdit: () => void;
  onReset: () => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  stripData,
  onBackToEdit,
  onReset,
}) => {
  const [renderedImageUrl, setRenderedImageUrl] = useState<string>('');
  const [qrInfo, setQrInfo] = useState<QRCodeResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [hostIp, setHostIp] = useState<string>('192.168.8.139');
  const [showIpEdit, setShowIpEdit] = useState<boolean>(false);

  const generateOutputs = async (ipToUse: string) => {
    setIsRendering(true);
    try {
      // Render at 2x scale for sharp high-DPI output
      const canvas = await renderStripToCanvas(stripData, 2);
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setRenderedImageUrl(dataUrl);

      // Generate QR Code with preferred Wi-Fi IP address
      const qr = await generatePhotoBoothQR(dataUrl, stripData.title, ipToUse);
      setQrInfo(qr);

      sfx.playSuccessFanfare();
    } catch (err) {
      console.error('Failed to generate strip canvas or QR:', err);
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    generateOutputs(hostIp);
  }, [stripData]);

  const handleUpdateIp = () => {
    generateOutputs(hostIp);
  };

  const handleDownload = () => {
    if (!renderedImageUrl) return;
    const link = document.createElement('a');
    link.download = `snapbox-${Date.now()}.png`;
    link.href = renderedImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!renderedImageUrl) return;
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`
        <html>
          <head>
            <title>SnapBox Print Photo Strip</title>
            <style>
              body { margin: 0; display: flex; align-items: center; justify-content: center; background: #fff; min-height: 100vh; }
              img { max-height: 95vh; max-width: 90vw; object-fit: contain; }
              @media print { body { margin: 0; } img { max-height: 100vh; width: auto; } }
            </style>
          </head>
          <body>
            <img src="${renderedImageUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWin.document.close();
    }
  };

  const handleCopyLink = async () => {
    if (!qrInfo) return;
    try {
      await navigator.clipboard.writeText(qrInfo.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8 animate-fadeIn">

      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Session Complete!
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Your Photo Strip is Ready
        </h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm sm:text-base">
          Scan the QR code with your phone camera to download directly to your photos, or print and save high-res copies below.
        </p>
      </div>

      {isRendering ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Rendering high-resolution photo strip & QR code...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Rendered Photo Strip Preview */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="relative group max-w-sm rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 hover:shadow-pink-500/20 transition-all">
              <img
                src={renderedImageUrl}
                alt="Final Photo Strip"
                className="w-full h-auto object-contain rounded-2xl"
              />
            </div>
          </div>

          {/* Right: QR Code Card & Download Hub */}
          <div className="lg:col-span-6 space-y-6">

            {/* The QR Code Hero Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-pink-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center gap-6">

                {/* QR Code Container */}
                <div
                  onClick={() => setIsModalOpen(true)}
                  className="cursor-pointer p-4 bg-white rounded-2xl shadow-xl ring-4 ring-pink-500/20 hover:scale-105 transition-transform flex-shrink-0 relative group"
                >
                  {qrInfo?.qrDataUrl ? (
                    <img
                      src={qrInfo.qrDataUrl}
                      alt="QR Code to scan"
                      className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                      Loading QR...
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    Click to Enlarge
                  </div>
                </div>

                {/* QR Instructions */}
                <div className="space-y-3 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold">
                    <QrCode className="w-3.5 h-3.5" />
                    Scan with Phone Camera
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Save Instantly to Phone</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Open your smartphone's camera app and point it at the code to view and save your photo strip.
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Make sure phone is connected to same Wi-Fi</span>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors"
                  >
                    <span>Open full screen QR modal</span>
                    <span>→</span>
                  </button>
                </div>

              </div>

              {/* Share URL input */}
              {qrInfo?.shareUrl && (
                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={qrInfo.shareUrl}
                      className="w-full bg-slate-950/80 px-3 py-2 rounded-xl text-xs text-slate-400 font-mono border border-slate-800 truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${copied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Network IP Config Toggle */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <button
                      onClick={() => setShowIpEdit(!showIpEdit)}
                      className="hover:text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      <Settings2 className="w-3 h-3" />
                      <span>{showIpEdit ? 'Hide Wi-Fi IP setting' : 'Change Wi-Fi IP address'}</span>
                    </button>
                    <span>Port: 5173</span>
                  </div>

                  {showIpEdit && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 animate-fadeIn">
                      <span className="text-xs text-slate-400 whitespace-nowrap">Wi-Fi IP:</span>
                      <input
                        type="text"
                        value={hostIp}
                        onChange={(e) => setHostIp(e.target.value)}
                        placeholder="e.g., 192.168.1.50"
                        className="bg-transparent text-xs text-white px-2 py-1 border-b border-slate-700 focus:outline-none focus:border-pink-500 flex-1 font-mono"
                      />
                      <button
                        onClick={handleUpdateIp}
                        className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold"
                      >
                        Update QR
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownload}
                className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold text-sm shadow-xl shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>

              <button
                onClick={handlePrint}
                className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Strip</span>
              </button>
            </div>

            {/* Secondary Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={onBackToEdit}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Stickers & Captions</span>
              </button>

              <button
                onClick={onReset}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start New Photobooth Session</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* QR Code Full Modal */}
      {qrInfo && (
        <QRCodeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          qrCodeUrl={qrInfo.qrDataUrl}
          shareUrl={qrInfo.shareUrl}
          renderedImageUrl={renderedImageUrl}
          title={stripData.title}
        />
      )}

    </div>
  );
};
