import { PhotoStripData, FilterType } from '../types/photobooth';
import { drawCanvasPattern, getCanvasHeaderFont, getSubtitlePartnerColor } from './patternStyles';

export const FILTER_CANVAS_MAP: Record<FilterType, string> = {
  normal: 'none',
  bw: 'grayscale(100%) contrast(125%) brightness(95%)',
  sepia: 'sepia(80%) contrast(110%) brightness(95%) saturate(120%)',
  film: 'contrast(115%) brightness(105%) saturate(130%) sepia(20%)',
  warm: 'sepia(35%) saturate(150%) hue-rotate(-15deg) brightness(105%)',
  cool: 'hue-rotate(185deg) saturate(110%) brightness(102%)',
  vibrant: 'saturate(200%) contrast(115%)',
  cyber: 'hue-rotate(280deg) saturate(160%) contrast(130%)',
  soft: 'brightness(110%) contrast(90%) saturate(115%)'
};

export async function renderStripToCanvas(data: PhotoStripData, scaleFactor: number = 2): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d canvas context');

  // Load all images first
  const loadedImages: HTMLImageElement[] = await Promise.all(
    data.photos.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = src;
        })
    )
  );

  // Layout metrics based on layout type & photo natural aspect ratio (default 1.0 square)
  const sampleImg = loadedImages.find((img) => img && img.width > 0);
  const photoAspect = sampleImg ? sampleImg.width / sampleImg.height : 1;

  let canvasWidth = 600;
  let canvasHeight = 1800;
  let photoWidth = 520;
  let photoHeight = Math.round(photoWidth / photoAspect);
  let photoPositions: Array<{ x: number; y: number; w: number; h: number }> = [];
  let footerY = 0;

  const pad = 40;
  const gap = 24;

  if (data.layout === 'strip-3') {
    canvasWidth = 600;
    photoWidth = canvasWidth - pad * 2; // 520
    photoHeight = Math.round(photoWidth / photoAspect);
    canvasHeight = pad + 3 * photoHeight + 2 * gap + 180; // space for footer
    photoPositions = [
      { x: pad, y: pad, w: photoWidth, h: photoHeight },
      { x: pad, y: pad + photoHeight + gap, w: photoWidth, h: photoHeight },
      { x: pad, y: pad + (photoHeight + gap) * 2, w: photoWidth, h: photoHeight },
    ];
    footerY = pad + (photoHeight + gap) * 3 + 20;
  } else if (data.layout === 'strip-4') {
    canvasWidth = 600;
    photoWidth = canvasWidth - pad * 2; // 520
    photoHeight = Math.round(photoWidth / photoAspect);
    canvasHeight = pad + 4 * photoHeight + 3 * gap + 180;
    photoPositions = [
      { x: pad, y: pad, w: photoWidth, h: photoHeight },
      { x: pad, y: pad + photoHeight + gap, w: photoWidth, h: photoHeight },
      { x: pad, y: pad + (photoHeight + gap) * 2, w: photoWidth, h: photoHeight },
      { x: pad, y: pad + (photoHeight + gap) * 3, w: photoWidth, h: photoHeight },
    ];
    footerY = pad + (photoHeight + gap) * 4 + 20;
  } else if (data.layout === 'grid-4') {
    canvasWidth = 800;
    const colWidth = (canvasWidth - pad * 2 - gap) / 2; // ~348
    photoWidth = colWidth;
    photoHeight = Math.round(photoWidth / photoAspect);
    canvasHeight = pad + 2 * photoHeight + gap + 180;
    photoPositions = [
      { x: pad, y: pad, w: photoWidth, h: photoHeight },
      { x: pad + photoWidth + gap, y: pad, w: photoWidth, h: photoHeight },
      { x: pad, y: pad + photoHeight + gap, w: photoWidth, h: photoHeight },
      { x: pad + photoWidth + gap, y: pad + photoHeight + gap, w: photoWidth, h: photoHeight },
    ];
    footerY = pad + (photoHeight + gap) * 2 + 20;
  } else if (data.layout === 'wide-2') {
    canvasWidth = 800;
    photoWidth = canvasWidth - pad * 2; // 720
    photoHeight = Math.round(photoWidth / photoAspect);
    canvasHeight = pad + 2 * photoHeight + gap + 180;
    photoPositions = [
      { x: pad, y: pad, w: photoWidth, h: photoHeight },
      { x: pad, y: pad + photoHeight + gap, w: photoWidth, h: photoHeight },
    ];
    footerY = pad + (photoHeight + gap) * 2 + 20;
  } else if (data.layout === 'polaroid-1') {
    canvasWidth = 700;
    photoWidth = canvasWidth - pad * 2; // 620
    photoHeight = Math.round(photoWidth / photoAspect);
    canvasHeight = pad + photoHeight + 260; // Extra tall classic bottom margin
    photoPositions = [{ x: pad, y: pad, w: photoWidth, h: photoHeight }];
    footerY = pad + photoHeight + 40;
  }

  // Set real canvas dimensions with scaling for high DPI
  canvas.width = canvasWidth * scaleFactor;
  canvas.height = canvasHeight * scaleFactor;
  ctx.scale(scaleFactor, scaleFactor);

  const isDarkFrame = data.frameColor === '#121214' || data.frameColor === '#0f172a';
  const watermark = data.watermarkText || 'SILONG CAFE';

  // 1. Draw Frame Background
  ctx.fillStyle = data.frameColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Background pattern if configured
  if (data.backgroundPattern && data.backgroundPattern !== 'none') {
    drawCanvasPattern(ctx, canvasWidth, canvasHeight, data.backgroundPattern, isDarkFrame);
  }

  // Custom frame borders
  if (data.borderStyle === 'double') {
    ctx.strokeStyle = data.borderColor || (isDarkFrame ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)');
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, canvasWidth - 12, canvasHeight - 12);
    ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);
  } else if (data.borderStyle === 'dashed') {
    ctx.strokeStyle = data.borderColor || (isDarkFrame ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)');
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(8, 8, canvasWidth - 16, canvasHeight - 16);
    ctx.setLineDash([]);
  } else if (data.frameColor === '#ffffff' || data.frameColor === '#fef3c7') {
    ctx.strokeStyle = data.borderColor || '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
  }

  // Header Watermark (if positioned at header)
  if (data.watermarkPosition === 'header') {
    ctx.textAlign = 'center';
    ctx.font = '700 11px "Space Grotesk", sans-serif';
    ctx.fillStyle = isDarkFrame ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.45)';
    ctx.fillText(`★ ${watermark} ★`, canvasWidth / 2, 22);
  }

  // 2. Draw Photos with Filter
  const filterStyle = FILTER_CANVAS_MAP[data.filter] || 'none';

  for (let i = 0; i < photoPositions.length; i++) {
    const pos = photoPositions[i];
    const img = loadedImages[i];

    // Background placeholder for missing shot
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(pos.x, pos.y, pos.w, pos.h);

    if (img) {
      ctx.save();
      
      // Clip rounded corners for modern clean booth feel
      const radius = 8;
      ctx.beginPath();
      ctx.moveTo(pos.x + radius, pos.y);
      ctx.lineTo(pos.x + pos.w - radius, pos.y);
      ctx.quadraticCurveTo(pos.x + pos.w, pos.y, pos.x + pos.w, pos.y + radius);
      ctx.lineTo(pos.x + pos.w, pos.y + pos.h - radius);
      ctx.quadraticCurveTo(pos.x + pos.w, pos.y + pos.h, pos.x + pos.w - radius, pos.y + pos.h);
      ctx.lineTo(pos.x + radius, pos.y + pos.h);
      ctx.quadraticCurveTo(pos.x, pos.y + pos.h, pos.x, pos.y + pos.h - radius);
      ctx.lineTo(pos.x, pos.y + radius);
      ctx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
      ctx.closePath();
      ctx.clip();

      // Apply CSS-compatible filter in canvas
      ctx.filter = filterStyle;

      // Crop and fill aspect ratio (cover mode)
      const imgRatio = img.width / img.height;
      const targetRatio = pos.w / pos.h;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;

      if (imgRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, pos.x, pos.y, pos.w, pos.h);
      ctx.restore();

      // Reset filter
      ctx.filter = 'none';

      // Optional film grain / border ring
      if (data.filter === 'film') {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 230, 180, 0.08)';
        ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
        ctx.restore();
      }
    }
  }

  // 3. Draw Footer Brand & Captions
  const textColor = data.textColor || (isDarkFrame ? '#f8fafc' : '#1e293b');
  const subtextColor = isDarkFrame ? '#94a3b8' : '#64748b';

  ctx.textAlign = 'center';
  ctx.fillStyle = textColor;

  // Title with custom font
  ctx.font = getCanvasHeaderFont(data.headerFont, 22);
  ctx.fillText((data.title || 'SILONG CAFE PHOTOBOOTH').toUpperCase(), canvasWidth / 2, footerY + 24);

  // Subtitle / Personal Note
  if (data.subtitle) {
    const subtitlePartner = getSubtitlePartnerColor(data.frameColor, data.category, data.subtitleColor);
    ctx.font = '600 28px "Caveat", cursive';
    ctx.fillStyle = subtitlePartner.hex;
    ctx.fillText(data.subtitle, canvasWidth / 2, footerY + 60);
  }

  // Date & SILONG CAFE Default Watermark
  if (data.showDate) {
    ctx.font = '600 13px "Space Grotesk", sans-serif';
    ctx.fillStyle = subtextColor;
    ctx.fillText(`${watermark} • ${data.dateStr}`, canvasWidth / 2, footerY + (data.subtitle ? 92 : 64));
  }

  // 4. Draw Interactive Stickers
  for (const sticker of data.stickers) {
    const absX = (sticker.x / 100) * canvasWidth;
    const absY = (sticker.y / 100) * canvasHeight;

    ctx.save();
    ctx.translate(absX, absY);
    ctx.rotate((sticker.rotation * Math.PI) / 180);
    ctx.scale(sticker.scale, sticker.scale);

    if (sticker.type === 'emoji') {
      ctx.font = '48px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sticker.content, 0, 0);
    } else if (sticker.type === 'badge') {
      // Draw badge background
      ctx.font = 'bold 18px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textMetrics = ctx.measureText(sticker.content);
      const bW = textMetrics.width + 24;
      const bH = 34;

      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      // rounded badge pill
      ctx.roundRect(-bW / 2, -bH / 2, bW, bH, 17);
      ctx.fill();

      // Badge text
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillText(sticker.content, 0, 1);
    } else if (sticker.type === 'doodle') {
      ctx.font = '700 36px "Caveat", cursive';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sticker.content, 0, 0);
    }

    ctx.restore();
  }

  return canvas;
}
