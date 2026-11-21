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
      month,
      layout = 'strip-3',
      filter = 'normal',
      frameColor = '#ffffff',
      frame_color,
      title = 'SNAPBOX PHOTOBOOTH',
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
      month: typeof month === 'number' ? month : null,
      layout,
      filter,
      frame_color: frame_color || frameColor || '#ffffff',
      title: (title || 'SNAPBOX PHOTOBOOTH').trim(),
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
