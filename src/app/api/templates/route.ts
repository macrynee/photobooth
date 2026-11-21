import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PRESET_GALLERY_TEMPLATES } from '@/data/presetTemplates';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');
    const occasionParam = searchParams.get('occasion');
    const categoryParam = searchParams.get('category');

    const options: { month?: number; occasion?: string } = {};
    if (monthParam) {
      const parsedMonth = parseInt(monthParam, 10);
      if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        options.month = parsedMonth;
      }
    }
    if (occasionParam) {
      options.occasion = occasionParam;
    }

    const rawTemplates = await db.getAllTemplates(options);
    
    // Normalize database records to PictureTemplate structure
    const templates = (rawTemplates && rawTemplates.length > 0 ? rawTemplates : PRESET_GALLERY_TEMPLATES).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      occasion: row.occasion,
      category: row.category || 'minimalist',
      month: row.month,
      layout: row.layout,
      filter: row.filter,
      frameColor: row.frameColor || row.frame_color || '#ffffff',
      backgroundPattern: row.backgroundPattern || row.background_pattern || 'none',
      backgroundImage: row.backgroundImage || row.background_image || undefined,
      headerFont: row.headerFont || row.header_font || 'grotesk',
      textColor: row.textColor || row.text_color || undefined,
      subtitleColor: row.subtitleColor || row.subtitle_color || undefined,
      watermarkText: row.watermarkText || row.watermark_text || 'SILONG CAFE',
      watermarkPosition: row.watermarkPosition || row.watermark_position || 'footer',
      borderStyle: row.borderStyle || row.border_style || 'solid',
      borderColor: row.borderColor || row.border_color || undefined,
      title: row.title || 'SILONG CAFE • PHOTOBOOTH',
      subtitle: row.subtitle || '',
      showDate: row.showDate !== undefined ? row.showDate : (row.show_date !== undefined ? row.show_date : true),
      stickers: Array.isArray(row.stickers) ? row.stickers : (typeof row.stickers === 'string' ? JSON.parse(row.stickers) : []),
      isDefault: row.isDefault !== undefined ? row.isDefault : row.is_default,
      isSystem: row.isSystem !== undefined ? row.isSystem : row.is_system,
      createdBy: row.createdBy || row.created_by,
      createdAt: row.createdAt || row.created_at,
      updatedAt: row.updatedAt || row.updated_at,
    }));

    const filtered = categoryParam && categoryParam !== 'all'
      ? templates.filter((t) => t.category === categoryParam)
      : templates;

    return NextResponse.json({ success: true, templates: filtered });
  } catch (err) {
    console.error('Failed to retrieve templates, falling back to preset gallery:', err);
    return NextResponse.json({ success: true, templates: PRESET_GALLERY_TEMPLATES });
  }
}
