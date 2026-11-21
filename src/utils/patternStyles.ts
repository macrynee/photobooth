import { BackgroundPattern, HeaderFont } from '../types/photobooth';

export function getPatternCss(pattern?: BackgroundPattern, isDark: boolean = false): React.CSSProperties {
  if (!pattern || pattern === 'none') {
    return {};
  }

  const dotColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)';
  const stripeColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  const checkerA = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';

  switch (pattern) {
    case 'dots':
      return {
        backgroundImage: `radial-gradient(${dotColor} 1.5px, transparent 1.5px)`,
        backgroundSize: '16px 16px',
      };
    case 'grid':
      return {
        backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      };
    case 'stripes':
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${stripeColor}, ${stripeColor} 2px, transparent 2px, transparent 12px)`,
      };
    case 'checker':
      return {
        backgroundImage: `conic-gradient(${checkerA} 90deg, transparent 90deg 180deg, ${checkerA} 180deg 270deg, transparent 270deg)`,
        backgroundSize: '24px 24px',
      };
    case 'hearts': {
      const heartFill = isDark ? '%23f472b6' : '%23f43f5e';
      const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="${heartFill}" fill-opacity="0.12" d="M16 26s-10-6.5-10-13a5.5 5.5 0 0 1 10-3.3A5.5 5.5 0 0 1 26 13c0 6.5-10 13-10 13z"/></svg>`;
      return {
        backgroundImage: `url("${svg}")`,
        backgroundSize: '32px 32px',
      };
    }
    case 'stars': {
      const starFill = isDark ? '%23fde047' : '%23eab308';
      const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><polygon fill="${starFill}" fill-opacity="0.12" points="16,4 19,12 28,12 21,17 24,25 16,20 8,25 11,17 4,12 13,12"/></svg>`;
      return {
        backgroundImage: `url("${svg}")`,
        backgroundSize: '32px 32px',
      };
    }
    case 'sparkles': {
      const sparkFill = isDark ? '%23ffffff' : '%23d97706';
      const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path fill="${sparkFill}" fill-opacity="0.12" d="M14 2 L16 10 L24 14 L16 18 L14 26 L12 18 L4 14 L12 10 Z"/></svg>`;
      return {
        backgroundImage: `url("${svg}")`,
        backgroundSize: '28px 28px',
      };
    }
    default:
      return {};
  }
}

export function getFontFamilyClass(font?: HeaderFont): string {
  switch (font) {
    case 'serif':
      return 'font-serif tracking-wider';
    case 'handwriting':
      return 'font-handwriting tracking-normal';
    case 'modern':
      return 'font-sans font-extrabold tracking-widest';
    case 'retro':
      return 'font-mono font-bold tracking-widest';
    case 'grotesk':
    default:
      return 'font-retro tracking-widest';
  }
}

export function getCanvasHeaderFont(font?: HeaderFont, size: number = 22): string {
  switch (font) {
    case 'serif':
      return `700 ${size}px "Playfair Display", "Georgia", serif`;
    case 'handwriting':
      return `700 ${size + 4}px "Caveat", "Comic Sans MS", cursive`;
    case 'modern':
      return `800 ${size}px "Montserrat", "Segoe UI", sans-serif`;
    case 'retro':
      return `800 ${size}px "Courier New", monospace`;
    case 'grotesk':
    default:
      return `700 ${size}px "Space Grotesk", sans-serif`;
  }
}

export function drawCanvasPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pattern?: BackgroundPattern,
  isDark: boolean = false
) {
  if (!pattern || pattern === 'none') return;

  ctx.save();
  const fillAlpha = isDark ? 0.08 : 0.05;
  const strokeColor = isDark ? `rgba(255, 255, 255, ${fillAlpha})` : `rgba(0, 0, 0, ${fillAlpha})`;
  ctx.fillStyle = strokeColor;
  ctx.strokeStyle = strokeColor;

  if (pattern === 'dots') {
    const spacing = 20;
    const radius = 1.5;
    for (let x = 10; x < width; x += spacing) {
      for (let y = 10; y < height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === 'grid') {
    const spacing = 24;
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (pattern === 'stripes') {
    ctx.lineWidth = 2;
    const spacing = 16;
    for (let d = -height; d <= width + height; d += spacing) {
      ctx.beginPath();
      ctx.moveTo(d, 0);
      ctx.lineTo(d + height, height);
      ctx.stroke();
    }
  } else if (pattern === 'checker') {
    const size = 24;
    for (let x = 0; x < width; x += size * 2) {
      for (let y = 0; y < height; y += size * 2) {
        ctx.fillRect(x, y, size, size);
        ctx.fillRect(x + size, y + size, size, size);
      }
    }
  } else if (pattern === 'hearts') {
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const spacing = 36;
    for (let x = 18; x < width; x += spacing) {
      for (let y = 18; y < height; y += spacing) {
        ctx.fillText('♡', x, y);
      }
    }
  } else if (pattern === 'stars') {
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const spacing = 36;
    for (let x = 18; x < width; x += spacing) {
      for (let y = 18; y < height; y += spacing) {
        ctx.fillText('★', x, y);
      }
    }
  } else if (pattern === 'sparkles') {
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const spacing = 32;
    for (let x = 16; x < width; x += spacing) {
      for (let y = 16; y < height; y += spacing) {
        ctx.fillText('✦', x, y);
      }
    }
  }

  ctx.restore();
}

export function getSubtitlePartnerColor(
  frameColor: string = '#ffffff',
  category?: string,
  customColor?: string
): { hex: string; className: string } {
  if (customColor) {
    return { hex: customColor, className: '' };
  }

  const cleanFrame = frameColor.toLowerCase();
  const isDark = cleanFrame === '#121214' || cleanFrame === '#0f172a';

  // 1. Coordinated Category themes
  if (category) {
    switch (category) {
      case 'elegant':
        return isDark
          ? { hex: '#fbbf24', className: 'text-amber-300' } // Champagne Gold
          : { hex: '#92400e', className: 'text-amber-800' }; // Rich Heritage Bronze
      case 'halloween':
        return { hex: '#f97316', className: 'text-orange-500' }; // Pumpkin Spooky Orange
      case 'christmas':
        return isDark
          ? { hex: '#4ade80', className: 'text-emerald-400' } // Holiday Pine Green
          : { hex: '#b91c1c', className: 'text-red-700' }; // Cranberry Red
      case 'graduation':
        return cleanFrame === '#0f172a'
          ? { hex: '#38bdf8', className: 'text-sky-400' } // Academic Sky Blue
          : { hex: '#047857', className: 'text-emerald-700' }; // Mint Emerald
      case 'corporate':
        return isDark
          ? { hex: '#60a5fa', className: 'text-blue-400' } // Executive Electric Blue
          : { hex: '#1e40af', className: 'text-blue-800' }; // Deep Navy Blue
      case 'retro-y2k':
        return cleanFrame === '#ff007f'
          ? { hex: '#fef08a', className: 'text-yellow-200' } // Neon Cyber Yellow
          : { hex: '#06b6d4', className: 'text-cyan-500' }; // Cyber Cyan
      case 'anniversary':
        return cleanFrame === '#fef3c7'
          ? { hex: '#b45309', className: 'text-amber-700' } // Golden Milestone Amber
          : { hex: '#db2777', className: 'text-pink-600' }; // Romance Pink
      case 'aesthetic':
        return cleanFrame === '#ede9fe'
          ? { hex: '#7c3aed', className: 'text-purple-600' } // Dreamy Lavender Purple
          : { hex: '#b45309', className: 'text-amber-700' }; // Cozy Warm Mocha
      case 'minimalist':
        return isDark
          ? { hex: '#cbd5e1', className: 'text-slate-300' } // Minimalist Silver
          : { hex: '#334155', className: 'text-slate-700' }; // Studio Charcoal
    }
  }

  // 2. Coordinated Frame Background Color Pairing
  switch (cleanFrame) {
    case '#ffffff': // Pure White -> Charcoal / Slate
      return { hex: '#334155', className: 'text-slate-700' };
    case '#121214': // Classic Noir Black -> Champagne Gold
      return { hex: '#fbbf24', className: 'text-amber-300' };
    case '#ffe4e6': // Pastel Blossom Pink -> Deep Wine Rose
      return { hex: '#be185d', className: 'text-rose-700' };
    case '#ede9fe': // Dreamy Lavender -> Deep Velvet Violet
      return { hex: '#7c3aed', className: 'text-purple-600' };
    case '#d1fae5': // Mint Matcha -> Forest Matcha Green
      return { hex: '#047857', className: 'text-emerald-700' };
    case '#fef3c7': // Butter Vintage Cream -> Warm Vintage Bronze / Coffee
      return { hex: '#92400e', className: 'text-amber-800' };
    case '#0f172a': // Deep Slate Navy -> Ice Sky Blue
      return { hex: '#38bdf8', className: 'text-sky-400' };
    case '#ff007f': // Neon Pop Pink -> Cyber Electric Yellow
      return { hex: '#fef08a', className: 'text-yellow-200' };
    default:
      return isDark
        ? { hex: '#fbbf24', className: 'text-amber-300' }
        : { hex: '#334155', className: 'text-slate-700' };
  }
}
