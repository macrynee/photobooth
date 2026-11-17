import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const stats = await db.getStats();
    const recentSessions = await db.getAllPhotoSessions(8);
    return NextResponse.json({
      success: true,
      stats,
      recentSessions,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard metrics.' }, { status: 500 });
  }
}
