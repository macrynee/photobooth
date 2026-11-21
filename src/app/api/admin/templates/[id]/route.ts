import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const template = await db.getTemplateById(params.id);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, template });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve template.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updatePayload: Record<string, any> = {};

    if (body.name !== undefined) updatePayload.name = body.name.trim();
    if (body.description !== undefined) updatePayload.description = body.description.trim();
    if (body.occasion !== undefined) updatePayload.occasion = body.occasion.trim();
    if (body.category !== undefined) updatePayload.category = body.category.trim();
    if (body.month !== undefined) updatePayload.month = body.month;
    if (body.layout !== undefined) updatePayload.layout = body.layout;
    if (body.filter !== undefined) updatePayload.filter = body.filter;
    if (body.frameColor !== undefined) updatePayload.frame_color = body.frameColor;
    if (body.frame_color !== undefined) updatePayload.frame_color = body.frame_color;
    if (body.backgroundPattern !== undefined) updatePayload.background_pattern = body.backgroundPattern;
    if (body.background_pattern !== undefined) updatePayload.background_pattern = body.background_pattern;
    if (body.backgroundImage !== undefined) updatePayload.background_image = body.backgroundImage;
    if (body.background_image !== undefined) updatePayload.background_image = body.background_image;
    if (body.headerFont !== undefined) updatePayload.header_font = body.headerFont;
    if (body.header_font !== undefined) updatePayload.header_font = body.header_font;
    if (body.textColor !== undefined) updatePayload.text_color = body.textColor;
    if (body.text_color !== undefined) updatePayload.text_color = body.text_color;
    if (body.subtitleColor !== undefined) updatePayload.subtitle_color = body.subtitleColor;
    if (body.subtitle_color !== undefined) updatePayload.subtitle_color = body.subtitle_color;
    if (body.watermarkText !== undefined) updatePayload.watermark_text = body.watermarkText;
    if (body.watermark_text !== undefined) updatePayload.watermark_text = body.watermark_text;
    if (body.watermarkPosition !== undefined) updatePayload.watermark_position = body.watermarkPosition;
    if (body.watermark_position !== undefined) updatePayload.watermark_position = body.watermark_position;
    if (body.borderStyle !== undefined) updatePayload.border_style = body.borderStyle;
    if (body.border_style !== undefined) updatePayload.border_style = body.border_style;
    if (body.borderColor !== undefined) updatePayload.border_color = body.borderColor;
    if (body.border_color !== undefined) updatePayload.border_color = body.border_color;
    if (body.title !== undefined) updatePayload.title = body.title.trim();
    if (body.subtitle !== undefined) updatePayload.subtitle = body.subtitle.trim();
    if (body.showDate !== undefined) updatePayload.show_date = body.showDate;
    if (body.show_date !== undefined) updatePayload.show_date = body.show_date;
    if (body.stickers !== undefined) updatePayload.stickers = body.stickers;
    if (body.isDefault !== undefined) updatePayload.is_default = body.isDefault;
    if (body.is_default !== undefined) updatePayload.is_default = body.is_default;

    const updated = await db.updateTemplate(params.id, updatePayload);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Template not found or could not be updated.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, template: updated });
  } catch (err) {
    console.error('Failed to update template:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update template.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const deleted = await db.deleteTemplate(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Template not found or could not be deleted.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: 'Template deleted successfully.' });
  } catch (err) {
    console.error('Failed to delete template:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete template.' },
      { status: 500 }
    );
  }
}
