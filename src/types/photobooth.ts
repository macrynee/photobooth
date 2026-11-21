export type LayoutType = 'strip-3' | 'strip-4' | 'grid-4' | 'wide-2' | 'polaroid-1';
export type DeviceRatioMode = 'camera' | 'cp' | 'ipad' | 'laptop';

export type TemplateCategory =
  | 'all'
  | 'minimalist'
  | 'elegant'
  | 'birthday'
  | 'wedding'
  | 'graduation'
  | 'retro-y2k'
  | 'christmas'
  | 'corporate'
  | 'aesthetic'
  | 'anniversary'
  | 'halloween';

export type BackgroundPattern = 'none' | 'dots' | 'grid' | 'stripes' | 'hearts' | 'stars' | 'checker' | 'sparkles';

export type HeaderFont = 'grotesk' | 'sans' | 'serif' | 'handwriting' | 'modern' | 'retro';

export interface LayoutConfig {
  id: LayoutType;
  name: string;
  shots: number;
  description: string;
  aspectRatio: string;
  gridClass: string;
  badge: string;
}

export type FilterType = 
  | 'normal' 
  | 'bw' 
  | 'sepia' 
  | 'film' 
  | 'warm' 
  | 'cool' 
  | 'vibrant' 
  | 'cyber' 
  | 'soft';

export interface FilterConfig {
  id: FilterType;
  name: string;
  cssFilter: string;
  previewColor: string;
  tagline: string;
}

export type FrameColor = 
  | '#ffffff' // Pure White
  | '#121214' // Classic Midnight Black
  | '#ffe4e6' // Pastel Blossom Pink
  | '#ede9fe' // Dreamy Lavender
  | '#d1fae5' // Mint Matcha
  | '#fef3c7' // Butter Vintage Cream
  | '#0f172a' // Deep Navy
  | '#ff007f'; // Neon Pop Pink

export interface FrameColorOption {
  hex: FrameColor;
  name: string;
  textColor: string;
}

export interface StickerItem {
  id: string;
  content: string; // emoji or svg/symbol
  type: 'emoji' | 'badge' | 'doodle';
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  scale: number; // 0.5 to 2.5
  rotation: number; // degrees -180 to 180
}

export interface PhotoStripData {
  layout: LayoutType;
  filter: FilterType;
  frameColor: FrameColor;
  photos: string[]; // data URLs
  stickers: StickerItem[];
  title: string;
  subtitle: string;
  showDate: boolean;
  dateStr: string;
  category?: string;
  backgroundPattern?: BackgroundPattern;
  backgroundImage?: string;
  headerFont?: HeaderFont;
  textColor?: string;
  watermarkText?: string; // Default: 'SILONG CAFE'
  watermarkPosition?: 'header' | 'footer';
  borderStyle?: 'solid' | 'dashed' | 'double' | 'rounded' | 'none';
  borderColor?: string;
}

export interface PictureTemplate {
  id: string;
  name: string;
  description?: string;
  occasion: string;
  category?: string; // e.g. 'minimalist', 'elegant', 'birthday', 'wedding', 'graduation', 'retro-y2k', 'christmas', 'corporate', 'aesthetic', 'anniversary', 'halloween'
  month?: number | null; // 1 to 12
  layout: LayoutType;
  filter: FilterType;
  frameColor: FrameColor;
  backgroundPattern?: BackgroundPattern;
  backgroundImage?: string;
  headerFont?: HeaderFont;
  textColor?: string;
  watermarkText?: string; // Default: 'SILONG CAFE'
  watermarkPosition?: 'header' | 'footer';
  borderStyle?: 'solid' | 'dashed' | 'double' | 'rounded' | 'none';
  borderColor?: string;
  title: string;
  subtitle: string;
  showDate: boolean;
  stickers: StickerItem[];
  isDefault?: boolean;
  isSystem?: boolean;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AppStep = 'setup' | 'capture' | 'customize' | 'export';
