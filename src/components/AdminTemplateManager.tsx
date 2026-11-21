'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Check,
  Calendar,
  Layers,
  Palette,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Eye,
  X,
  Tag,
  Type,
  Smile,
} from 'lucide-react';
import { PictureTemplate, LayoutType, FilterType, FrameColor, StickerItem, PhotoStripData, BackgroundPattern, HeaderFont } from '../types/photobooth';
import { LAYOUT_OPTIONS, FRAME_COLORS } from './LayoutSelector';
import { FILTERS } from './FilterSelector';
import { StripPreview } from './StripPreview';
import { TEMPLATE_CATEGORIES } from '../data/presetTemplates';

interface AdminTemplateManagerProps {
  token: string;
  onLaunchBoothWithTemplate?: (template: PictureTemplate) => void;
}

export const MONTH_NAMES = [
  { num: 1, name: 'January', occasion: 'New Year', emoji: '✨' },
  { num: 2, name: 'February', occasion: "Valentine's & Love", emoji: '💖' },
  { num: 3, name: 'March', occasion: 'Spring & Grad', emoji: '🌸' },
  { num: 4, name: 'April', occasion: 'Easter & Pastel', emoji: '🐣' },
  { num: 5, name: 'May', occasion: "Mother's Day & Fiesta", emoji: '💐' },
  { num: 6, name: 'June', occasion: 'Pride & Summer', emoji: '🌈' },
  { num: 7, name: 'July', occasion: 'Midsummer Beach', emoji: '🏖️' },
  { num: 8, name: 'August', occasion: 'Golden Hour & Friendship', emoji: '🌻' },
  { num: 9, name: 'September', occasion: 'Autumn & Back to School', emoji: '🍂' },
  { num: 10, name: 'October', occasion: 'Halloween Boo', emoji: '🎃' },
  { num: 11, name: 'November', occasion: 'Thanksgiving & Gratitude', emoji: '🥧' },
  { num: 12, name: 'December', occasion: 'Merry Christmas & Magic', emoji: '🎄' },
];

const SAMPLE_PHOTOS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%234338ca"/><circle cx="200" cy="180" r="70" fill="%23fde047"/><circle cx="175" cy="170" r="8" fill="%230f172a"/><circle cx="225" cy="170" r="8" fill="%230f172a"/><path d="M170 205 Q200 235 230 205" stroke="%230f172a" stroke-width="6" fill="none" stroke-linecap="round"/><text x="200" y="320" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23ffffff" text-anchor="middle">Pose #1</text></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23db2777"/><circle cx="200" cy="180" r="70" fill="%23fbcfe8"/><circle cx="175" cy="170" r="8" fill="%230f172a"/><circle cx="225" cy="170" r="8" fill="%230f172a"/><path d="M170 205 Q200 235 230 205" stroke="%230f172a" stroke-width="6" fill="none" stroke-linecap="round"/><text x="200" y="320" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23ffffff" text-anchor="middle">Pose #2</text></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23059669"/><circle cx="200" cy="180" r="70" fill="%23a7f3d0"/><circle cx="175" cy="170" r="8" fill="%230f172a"/><circle cx="225" cy="170" r="8" fill="%230f172a"/><path d="M170 205 Q200 235 230 205" stroke="%230f172a" stroke-width="6" fill="none" stroke-linecap="round"/><text x="200" y="320" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23ffffff" text-anchor="middle">Pose #3</text></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23d97706"/><circle cx="200" cy="180" r="70" fill="%23fef08a"/><circle cx="175" cy="170" r="8" fill="%230f172a"/><circle cx="225" cy="170" r="8" fill="%230f172a"/><path d="M170 205 Q200 235 230 205" stroke="%230f172a" stroke-width="6" fill="none" stroke-linecap="round"/><text x="200" y="320" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23ffffff" text-anchor="middle">Pose #4</text></svg>',
];

export const AdminTemplateManager: React.FC<AdminTemplateManagerProps> = ({
  token,
  onLaunchBoothWithTemplate,
}) => {
  const [templates, setTemplates] = useState<PictureTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<PictureTemplate | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formOccasion, setFormOccasion] = useState<string>('custom');
  const [formCategory, setFormCategory] = useState<string>('minimalist');
  const [formMonth, setFormMonth] = useState<number | null>(null);
  const [formLayout, setFormLayout] = useState<LayoutType>('strip-3');
  const [formFilter, setFormFilter] = useState<FilterType>('normal');
  const [formFrameColor, setFormFrameColor] = useState<FrameColor>('#ffffff');
  const [formBackgroundPattern, setFormBackgroundPattern] = useState<BackgroundPattern>('none');
  const [formHeaderFont, setFormHeaderFont] = useState<HeaderFont>('grotesk');
  const [formWatermarkText, setFormWatermarkText] = useState<string>('SILONG CAFE');
  const [formTitle, setFormTitle] = useState<string>('SILONG CAFE • STUDIO ARCHIVE');
  const [formSubtitle, setFormSubtitle] = useState<string>('memories forever ♡');
  const [formShowDate, setFormShowDate] = useState<boolean>(true);
  const [formStickers, setFormStickers] = useState<StickerItem[]>([]);
  const [newStickerEmoji, setNewStickerEmoji] = useState<string>('✨');

  // Load Templates
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/templates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormDescription('');
    setFormOccasion('custom');
    setFormCategory('minimalist');
    setFormMonth(null);
    setFormLayout('strip-3');
    setFormFilter('normal');
    setFormFrameColor('#ffffff');
    setFormBackgroundPattern('none');
    setFormHeaderFont('grotesk');
    setFormWatermarkText('SILONG CAFE');
    setFormTitle('SILONG CAFE • STUDIO ARCHIVE');
    setFormSubtitle('memories forever ♡');
    setFormShowDate(true);
    setFormStickers([
      { id: 'stk_1', type: 'emoji', content: '✨', x: 80, y: 15, scale: 1.2, rotation: 10 },
    ]);
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (template: PictureTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormDescription(template.description || '');
    setFormOccasion(template.occasion || 'custom');
    setFormCategory(template.category || 'minimalist');
    setFormMonth(template.month !== undefined ? template.month : null);
    setFormLayout(template.layout || 'strip-3');
    setFormFilter(template.filter || 'normal');
    setFormFrameColor(template.frameColor || '#ffffff');
    setFormBackgroundPattern(template.backgroundPattern || 'none');
    setFormHeaderFont(template.headerFont || 'grotesk');
    setFormWatermarkText(template.watermarkText || 'SILONG CAFE');
    setFormTitle(template.title || 'SILONG CAFE • STUDIO ARCHIVE');
    setFormSubtitle(template.subtitle || '');
    setFormShowDate(template.showDate ?? true);
    setFormStickers(template.stickers || []);
    setIsEditorOpen(true);
  };

  // Save Template
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        occasion: formOccasion,
        category: formCategory,
        month: formMonth,
        layout: formLayout,
        filter: formFilter,
        frameColor: formFrameColor,
        backgroundPattern: formBackgroundPattern,
        headerFont: formHeaderFont,
        watermarkText: formWatermarkText || 'SILONG CAFE',
        title: formTitle.trim(),
        subtitle: formSubtitle.trim(),
        showDate: formShowDate,
        stickers: formStickers,
      };

      const url = editingTemplate
        ? `/api/admin/templates/${editingTemplate.id}`
        : '/api/admin/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditorOpen(false);
        showNotification(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!');
        fetchTemplates();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save template');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('An error occurred while saving the template.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Template
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showNotification(`Deleted template "${name}"`);
        fetchTemplates();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete template');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Restore Default 12 Monthly Presets
  const handleRestoreMonthlyPresets = async () => {
    if (!window.confirm('Reset and restore all default 12-month occasion templates? Any modified system templates will be refreshed.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/templates/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showNotification('All 12-month occasion templates restored successfully!');
        fetchTemplates();
      }
    } catch (err) {
      console.error('Seed error:', err);
    }
  };

  // Sticker helpers in editor
  const addFormSticker = (content: string, type: 'emoji' | 'badge' | 'doodle' = 'emoji') => {
    const newStk: StickerItem = {
      id: 'stk_' + Math.random().toString(36).substring(2, 7),
      content,
      type,
      x: 50,
      y: 50,
      scale: 1.2,
      rotation: Math.floor(Math.random() * 20) - 10,
    };
    setFormStickers((prev) => [...prev, newStk]);
  };

  const removeFormSticker = (id: string) => {
    setFormStickers((prev) => prev.filter((s) => s.id !== id));
  };

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    if (selectedMonthFilter !== 'all') {
      if (selectedMonthFilter === 'custom') {
        if (tpl.month !== null && tpl.month !== undefined) return false;
      } else {
        const m = parseInt(selectedMonthFilter, 10);
        if (tpl.month !== m) return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tpl.name.toLowerCase().includes(q);
      const matchTitle = tpl.title.toLowerCase().includes(q);
      const matchOccasion = (tpl.occasion || '').toLowerCase().includes(q);
      return matchName || matchTitle || matchOccasion;
    }
    return true;
  });

  // Current preview strip data for editor modal
  const previewStripData: PhotoStripData = {
    layout: formLayout,
    filter: formFilter,
    frameColor: formFrameColor,
    photos: SAMPLE_PHOTOS,
    stickers: formStickers,
    title: formTitle || 'SILONG CAFE • STUDIO ARCHIVE',
    subtitle: formSubtitle,
    showDate: formShowDate,
    dateStr: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
    backgroundPattern: formBackgroundPattern,
    headerFont: formHeaderFont,
    watermarkText: formWatermarkText || 'SILONG CAFE',
    watermarkPosition: 'footer',
    category: formCategory,
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Alert */}
      {actionMessage && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Admin Studio Design & Template Manager
          </div>
          <h2 className="text-2xl font-black text-white">Picture & Occasion Templates</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Create and edit customized photo designs with custom headers, titles, frame colors, stickers, and seasonal monthly themes for everyone to use anytime.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRestoreMonthlyPresets}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Reset default 12-month templates"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Monthly Presets</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-pink-500/20 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Template</span>
          </button>
        </div>
      </div>

      {/* Month Filters & Search Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search templates by name, header, occasion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-pink-400">{filteredTemplates.length}</strong> of{' '}
            {templates.length} templates
          </div>
        </div>

        {/* 12-Month Quick Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedMonthFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
              selectedMonthFilter === 'all'
                ? 'bg-pink-500 border-pink-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🌟 All Templates
          </button>

          {MONTH_NAMES.map((m) => {
            const isSelected = selectedMonthFilter === m.num.toString();
            return (
              <button
                key={m.num}
                onClick={() => setSelectedMonthFilter(m.num.toString())}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-pink-500 border-pink-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.name}</span>
              </button>
            );
          })}

          <button
            onClick={() => setSelectedMonthFilter('custom')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
              selectedMonthFilter === 'custom'
                ? 'bg-pink-500 border-pink-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            ✨ Custom & Events
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading photobooth templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-3 p-6">
          <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No templates found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No templates match your current filter. Create a new design or reset the monthly presets.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Template Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((tpl) => {
            const monthInfo = tpl.month ? MONTH_NAMES.find((m) => m.num === tpl.month) : null;
            const layoutConfig = LAYOUT_OPTIONS.find((l) => l.id === tpl.layout) || LAYOUT_OPTIONS[0];

            return (
              <div
                key={tpl.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all p-4 flex flex-col justify-between group hover:shadow-xl hover:shadow-pink-500/5 relative overflow-hidden"
              >
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    {monthInfo ? (
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 font-extrabold text-[11px] flex items-center gap-1">
                        <span>{monthInfo.emoji}</span>
                        <span>{monthInfo.name}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-extrabold text-[11px] border border-slate-700">
                        {tpl.occasion ? tpl.occasion.toUpperCase() : 'CUSTOM'}
                      </span>
                    )}

                    {tpl.isSystem && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        Preset
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-semibold text-slate-400">
                    {layoutConfig.name.split(' ')[0]}
                  </span>
                </div>

                {/* Visual Strip Miniature Card */}
                <div
                  className="rounded-xl p-3 my-2 shadow-inner border border-slate-800/80 transition-transform group-hover:scale-[1.01]"
                  style={{ backgroundColor: tpl.frameColor }}
                >
                  <div className="text-center pb-2">
                    <p
                      className={`font-black text-[10px] tracking-wider uppercase font-retro truncate ${
                        tpl.frameColor === '#121214' || tpl.frameColor === '#0f172a'
                          ? 'text-white'
                          : 'text-slate-900'
                      }`}
                    >
                      {tpl.title}
                    </p>
                  </div>

                  {/* Photo Slot Boxes Mini */}
                  <div
                    className={`gap-1.5 ${
                      tpl.layout === 'grid-4'
                        ? 'grid grid-cols-2'
                        : 'flex flex-col'
                    }`}
                  >
                    {Array.from({ length: Math.min(layoutConfig.shots, 3) }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 rounded bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-[10px] text-slate-400 font-bold"
                      >
                        Shot #{i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Subtitle / note preview */}
                  {tpl.subtitle && (
                    <div className="text-center pt-2">
                      <p
                        className={`font-handwriting text-xs font-bold truncate ${
                          tpl.frameColor === '#121214' || tpl.frameColor === '#0f172a'
                            ? 'text-pink-400'
                            : 'text-pink-600'
                        }`}
                      >
                        {tpl.subtitle}
                      </p>
                    </div>
                  )}
                </div>

                {/* Template Info & Action Controls */}
                <div className="mt-3 space-y-2">
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-pink-300 transition-colors">
                      {tpl.name}
                    </h3>
                    {tpl.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {tpl.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
                    {onLaunchBoothWithTemplate && (
                      <button
                        onClick={() => onLaunchBoothWithTemplate(tpl)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 transition-colors"
                        title="Open in photobooth now"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Use in Booth</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        onClick={() => handleOpenEdit(tpl)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(tpl.id, tpl.name)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Template Visual Designer & Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <h3 className="font-extrabold text-white text-lg">
                  {editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Design New Picture Template'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - 2 Columns: Form on Left, Live Preview on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
              
              {/* Left Column: Form Controls (7 cols) */}
              <form onSubmit={handleSave} className="lg:col-span-7 p-6 space-y-5 border-r border-slate-800">
                
                {/* Basic Meta */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Golden Christmas Magic, Seoul Neon Vibes"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Occasion Month
                      </label>
                      <select
                        value={formMonth === null ? '' : formMonth}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : null;
                          setFormMonth(val);
                          if (val) {
                            const monthInfo = MONTH_NAMES.find((m) => m.num === val);
                            if (monthInfo) {
                              setFormOccasion(monthInfo.occasion.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                            }
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-pink-500"
                      >
                        <option value="">No specific month (Anytime / General)</option>
                        {MONTH_NAMES.map((m) => (
                          <option key={m.num} value={m.num}>
                            {m.emoji} Month {m.num}: {m.name} ({m.occasion})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Occasion Tag
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. christmas, birthday, wedding, summer"
                        value={formOccasion}
                        onChange={(e) => setFormOccasion(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Header Title & Subtitle */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400 uppercase tracking-wider">
                    <Type className="w-3.5 h-3.5" />
                    <span>Header Text & Subtitle Design</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Header Title (Top Brand Banner)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MERRY CHRISTMAS • 2026"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-retro uppercase focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Handwritten Note / Subtitle (Bottom)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. warm wishes & cozy kisses ♡"
                      value={formSubtitle}
                      onChange={(e) => setFormSubtitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-handwriting text-base focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="formShowDate"
                      checked={formShowDate}
                      onChange={(e) => setFormShowDate(e.target.checked)}
                      className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-slate-700 bg-slate-800"
                    />
                    <label htmlFor="formShowDate" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      Print current date watermark on strip footer
                    </label>
                  </div>
                </div>

                {/* Layout & Frame Color Selection */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Strip Layout
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LAYOUT_OPTIONS.map((layout) => {
                      const isSelected = formLayout === layout.id;
                      return (
                        <button
                          key={layout.id}
                          type="button"
                          onClick={() => setFormLayout(layout.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-pink-500/10 border-pink-500 ring-2 ring-pink-500/30 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">{layout.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{layout.shots} shots</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Frame Color Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Frame Background Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {FRAME_COLORS.map((c) => {
                      const isSelected = formFrameColor === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setFormFrameColor(c.hex)}
                          className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'border-pink-500 bg-pink-500/10 ring-2 ring-pink-500/30'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-[11px] text-slate-300 font-medium truncate">
                            {c.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Default Sticker Embellishments */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400 uppercase tracking-wider">
                      <Smile className="w-3.5 h-3.5" />
                      <span>Default Stickers ({formStickers.length})</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {['✨', '💖', '🎉', '🎄', '🎃', '🌸', '🌻', '⭐'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => addFormSticker(emoji, 'emoji')}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-pink-600/30 text-sm flex items-center justify-center transition-all"
                          title={`Add ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formStickers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formStickers.map((stk) => (
                        <span
                          key={stk.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                        >
                          <span>{stk.content}</span>
                          <button
                            type="button"
                            onClick={() => removeFormSticker(stk.id)}
                            className="text-slate-400 hover:text-rose-400 text-xs"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      No stickers added. Click quick emojis above to place festive decorations on this design.
                    </p>
                  )}
                </div>

              </form>

              {/* Right Column: Live Interactive Strip Preview (5 cols) */}
              <div className="lg:col-span-5 p-6 bg-slate-950 flex flex-col items-center justify-start space-y-4">
                <div className="text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Live Design Preview
                  </span>
                  <p className="text-[10px] text-slate-500">
                    This is how users will see the photo strip when they use this template.
                  </p>
                </div>

                <div className="w-full max-w-[320px]">
                  <StripPreview data={previewStripData} interactive={false} />
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/60">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !formName.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-pink-500/20 transition-all flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Saving Template...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Save & Publish Template</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
