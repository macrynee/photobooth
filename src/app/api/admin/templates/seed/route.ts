import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    await db.resetTemplates();
    const templates = await db.getAllTemplates();
    return NextResponse.json({
      success: true,
      message: 'All 12-month occasion templates have been restored and updated.',
      templates,
    });
  } catch (err) {
    console.error('Failed to restore templates:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to restore default templates.' },
      { status: 500 }
    );
  }
}
