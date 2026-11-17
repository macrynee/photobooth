import dotenv from 'dotenv';
dotenv.config();

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'snapbox_jwt_secret_key_2026';

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================================
// 1. REGISTER ENDPOINT
// POST /api/auth/register (or /api/admin/register)
// ============================================================
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validation: Required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required.',
      });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // Validation: Username format
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({
        success: false,
        error: 'Username must be between 3 and 30 characters long.',
      });
    }

    // Validation: Email format
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.',
      });
    }

    // Validation: Password strength
    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    // Check if username already exists
    const existingUser = await db.findAdminByUsernameOrEmail(cleanUsername);
    if (existingUser && existingUser.username.toLowerCase() === cleanUsername.toLowerCase()) {
      return res.status(409).json({
        success: false,
        error: `Username "${cleanUsername}" is already taken. Please choose another.`,
      });
    }

    // Check if email already exists
    const existingEmail = await db.findAdminByUsernameOrEmail(cleanEmail);
    if (existingEmail && existingEmail.email.toLowerCase() === cleanEmail.toLowerCase()) {
      return res.status(409).json({
        success: false,
        error: `Email "${cleanEmail}" is already registered. Please log in instead.`,
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Save user/admin to database (PostgreSQL or local persistent store)
    const newUser = await db.createAdmin(cleanUsername, cleanEmail, passwordHash);

    // Generate JWT auth token
    const token = jwt.sign(
      {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role || 'admin',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role || 'admin',
        createdAt: newUser.created_at,
      },
      admin: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role || 'admin',
      },
    });
  } catch (err: unknown) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while registering your account.',
    });
  }
});

// ============================================================
// 2. LOGIN ENDPOINT
// POST /api/auth/login (or /api/admin/login)
// ============================================================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, username, email, password } = req.body;
    const identifier = String(usernameOrEmail || username || email || '').trim();

    // Validation: Required fields
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username or email, and password are required.',
      });
    }

    // Search user in database
    const user = await db.findAdminByUsernameOrEmail(identifier);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username/email or password.',
      });
    }

    // Compare password with bcrypt hash
    const isPasswordValid = await bcrypt.compare(String(password), user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username/email or password.',
      });
    }

    // Generate JWT auth token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'admin',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'admin',
        createdAt: user.created_at,
      },
      // Backward compatibility alias
      admin: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'admin',
      },
    });
  } catch (err: unknown) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while logging in.',
    });
  }
});

// ============================================================
// 3. GET CURRENT PROFILE (Authenticated)
// GET /api/auth/me (or /api/admin/me)
// ============================================================
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const user = await db.findAdminByUsernameOrEmail(req.user.username);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
      admin: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
  }
});

// ============================================================
// 4. LOGOUT ENDPOINT
// POST /api/auth/logout
// ============================================================
router.post('/logout', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export default router;
