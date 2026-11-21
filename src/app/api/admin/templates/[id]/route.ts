import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

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
    if (body.month !== undefined) updatePayload.month = body.month;
    if (body.layout !== undefined) updatePayload.layout = body.layout;
    if (body.filter !== undefined) updatePayload.filter = body.filter;
    if (body.frameColor !== undefined) updatePayload.frame_color = body.frameColor;
    if (body.frame_color !== undefined) updatePayload.frame_color = body.frame_color;
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
