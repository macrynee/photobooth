import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = verifyAuthToken(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const user = await db.findAdminByUsernameOrEmail(authUser.username);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User profile not found.' }, { status: 404 });
    }

    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    };

    return NextResponse.json({
      success: true,
      user: userInfo,
      admin: userInfo,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to retrieve profile.' }, { status: 500 });
  }
}
