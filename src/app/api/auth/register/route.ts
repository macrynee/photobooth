import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, error: 'Username, email, and password are required.' }, { status: 400 });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return NextResponse.json({ success: false, error: 'Username must be between 3 and 30 characters long.' }, { status: 400 });
    }

    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const existingUser = await db.findAdminByUsernameOrEmail(cleanUsername);
    if (existingUser && existingUser.username.toLowerCase() === cleanUsername.toLowerCase()) {
      return NextResponse.json({ success: false, error: `Username "${cleanUsername}" is already taken.` }, { status: 409 });
    }

    const existingEmail = await db.findAdminByUsernameOrEmail(cleanEmail);
    if (existingEmail && existingEmail.email.toLowerCase() === cleanEmail.toLowerCase()) {
      return NextResponse.json({ success: false, error: `Email "${cleanEmail}" is already registered. Please log in.` }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await db.createAdmin(cleanUsername, cleanEmail, passwordHash);

    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role || 'admin',
    });

    const userInfo = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role || 'admin',
      createdAt: newUser.created_at,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Account registered successfully!',
        token,
        user: userInfo,
        admin: userInfo,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ success: false, error: 'An error occurred while registering your account.' }, { status: 500 });
  }
}
