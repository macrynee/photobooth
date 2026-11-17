import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

function generateRandomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rand;
}

export async function GET(req: NextRequest) {
  const user = verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const codes = await db.getAllAccessCodes();
    return NextResponse.json({ success: true, codes });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to retrieve access codes.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { code, note, maxUses, expiresAt, count = 1 } = body;

    if (code && !/^[A-Z0-9]{5}$/i.test(code.trim())) {
      return NextResponse.json(
        { success: false, error: 'Access code must be exactly 5 alphanumeric characters.' },
        { status: 400 }
      );
    }

    const numCodes = Math.min(50, Math.max(1, parseInt(count, 10) || 1));
    const createdCodes = [];

    for (let i = 0; i < numCodes; i++) {
      let finalCode = code && numCodes === 1 ? code.trim().toUpperCase() : generateRandomCode();

      let attempts = 0;
      while ((await db.findAccessCode(finalCode)) && attempts < 10) {
        finalCode = generateRandomCode();
        attempts++;
      }

      const newCode = await db.createAccessCode(
        finalCode,
        note || (numCodes > 1 ? `Batch ticket #${i + 1}` : 'Single Pass'),
        parseInt(maxUses, 10) || 1,
        expiresAt || null,
        user.id || null
      );
      createdCodes.push(newCode);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully generated ${createdCodes.length} access code(s).`,
        codes: createdCodes,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Generate code error:', err);
    return NextResponse.json({ success: false, error: 'Failed to generate access codes.' }, { status: 500 });
  }
}
