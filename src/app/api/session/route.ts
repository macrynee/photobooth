import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || 'snap_latest';

    const session = await db.getPhotoSession(id);
    if (session) {
      return NextResponse.json({
        image: session.image_data,
        title: session.title,
        subtitle: session.subtitle,
        timestamp: session.created_at,
      });
    }

    return NextResponse.json({ error: 'Photo strip session not found.' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to retrieve session.' }, { status: 500 });
  }
}
