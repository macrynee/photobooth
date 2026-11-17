import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { usernameOrEmail, username, email, password } = body;
    const identifier = String(usernameOrEmail || username || email || '').trim();

    if (!identifier || !password) {
      return NextResponse.json({ success: false, error: 'Username or email, and password are required.' }, { status: 400 });
    }

    const user = await db.findAdminByUsernameOrEmail(identifier);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid username/email or password.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: 'Invalid username/email or password.' }, { status: 401 });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'admin',
    });

    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'admin',
      createdAt: user.created_at,
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      token,
      user: userInfo,
      admin: userInfo,
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, error: 'An internal server error occurred while logging in.' }, { status: 500 });
  }
}
