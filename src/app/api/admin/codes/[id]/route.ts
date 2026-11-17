import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { id } = params;
    const deleted = await db.deleteAccessCode(id);
    return NextResponse.json({ success: deleted });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to delete access code.' }, { status: 500 });
  }
}
