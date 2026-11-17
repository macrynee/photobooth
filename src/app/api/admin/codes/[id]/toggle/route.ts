import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { id } = params;
    const isActive = await db.toggleAccessCodeActive(id);
    return NextResponse.json({ success: true, is_active: isActive });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to toggle code status.' }, { status: 500 });
  }
}
