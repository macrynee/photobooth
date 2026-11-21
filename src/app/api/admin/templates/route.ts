import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const templates = await db.getAllTemplates();
    return NextResponse.json({ success: true, templates });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve templates.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      description,
      occasion = 'custom',
      category = 'minimalist',
      month,
      layout = 'strip-3',
      filter = 'normal',
      frameColor = '#ffffff',
      frame_color,
      backgroundPattern = 'none',
      background_pattern,
      backgroundImage,
      background_image,
      headerFont = 'grotesk',
      header_font,
      textColor,
      text_color,
      subtitleColor,
      subtitle_color,
      watermarkText = 'SILONG CAFE',
      watermark_text,
      watermarkPosition = 'footer',
      watermark_position,
      borderStyle = 'solid',
      border_style,
      borderColor,
      border_color,
      title = 'SILONG CAFE • PHOTOBOOTH',
      subtitle = '',
      showDate = true,
      show_date,
      stickers = [],
      isDefault = false,
      is_default,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Template name is required.' },
        { status: 400 }
      );
    }

    const newTemplate = await db.createTemplate({
      name: name.trim(),
      description: (description || '').trim(),
      occasion: (occasion || 'custom').trim(),
      category: (category || 'minimalist').trim(),
      month: typeof month === 'number' ? month : null,
      layout,
      filter,
      frame_color: frame_color || frameColor || '#ffffff',
      background_pattern: background_pattern || backgroundPattern || 'none',
      background_image: background_image || backgroundImage || undefined,
      header_font: header_font || headerFont || 'grotesk',
      text_color: text_color || textColor || undefined,
      subtitle_color: subtitle_color || subtitleColor || undefined,
      watermark_text: watermark_text || watermarkText || 'SILONG CAFE',
      watermark_position: watermark_position || watermarkPosition || 'footer',
      border_style: border_style || borderStyle || 'solid',
      border_color: border_color || borderColor || undefined,
      title: (title || 'SILONG CAFE • PHOTOBOOTH').trim(),
      subtitle: (subtitle || '').trim(),
      show_date: show_date !== undefined ? show_date : showDate,
      stickers: Array.isArray(stickers) ? stickers : [],
      is_default: is_default !== undefined ? is_default : isDefault,
      is_system: false,
      created_by: user.id,
    });

    return NextResponse.json({ success: true, template: newTemplate });
  } catch (err) {
    console.error('Failed to create template:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create template.' },
      { status: 500 }
    );
  }
}
