import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'Please enter an access code.' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const record = await db.findAccessCode(cleanCode);

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Invalid access code. Please check your ticket or ask the booth host.' },
        { status: 404 }
      );
    }

    if (!record.is_active || record.current_uses >= 1) {
      return NextResponse.json(
        { success: false, error: 'This access code has already been used. Each code is valid for one single photobooth session.' },
        { status: 403 }
      );
    }

    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'This access code has expired.' }, { status: 403 });
    }

    // Automatically delete code permanently upon redemption (single-use)
    await db.redeemAndDeleteCode(record.id);

    return NextResponse.json({
      success: true,
      message: 'Access granted! Welcome to the photobooth.',
      code: record.code,
      codeId: record.id,
      note: record.note,
      remainingUses: 0,
    });
  } catch (err) {
    console.error('Verify code error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error verifying access code.' }, { status: 500 });
  }
}
