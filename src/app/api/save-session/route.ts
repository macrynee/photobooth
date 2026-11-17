import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, accessCode, accessCodeId, image, title, subtitle, layout, filter, frameColor } = body;
    const sessionId = id || 'snap_' + Math.random().toString(36).substring(2, 9);

    await db.savePhotoSession({
      id: sessionId,
      access_code: accessCode,
      access_code_id: accessCodeId,
      image_data: image,
      title: title || 'SnapBox Photo Strip',
      subtitle: subtitle || '',
      layout: layout || 'strip-3',
      filter: filter || 'normal',
      frame_color: frameColor || '#ffffff',
    });

    return NextResponse.json({ success: true, id: sessionId });
  } catch (err) {
    console.error('Save session error:', err);
    return NextResponse.json({ error: 'Failed to save photo session.' }, { status: 500 });
  }
}
