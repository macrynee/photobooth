import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db';
import authRouter from './routes/auth';
import { authenticateToken, AuthenticatedRequest } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper: Generate Random 5-digit alphanumeric Access Code (numbers & letters)
function generateRandomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rand;
}

// ============================================================
// 1. AUTHENTICATION ROUTES (Register, Login, Me, Logout)
// Mounted at both /api/auth and /api/admin
// ============================================================
app.use('/api/auth', authRouter);
app.use('/api/admin', authRouter);

// ============================================================
// 2. Photobooth User Access Code Verification (Public Gate)
// POST /api/auth/verify-code
// ============================================================
app.post('/api/auth/verify-code', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Please enter an access code.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const record = await db.findAccessCode(cleanCode);

    if (!record) {
      return res.status(404).json({ success: false, error: 'Invalid access code. Please check your ticket or ask the booth host.' });
    }

    if (!record.is_active || record.current_uses >= 1) {
      return res.status(403).json({ success: false, error: 'This access code has already been used. Each code is valid for one single photobooth session.' });
    }

    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      return res.status(403).json({ success: false, error: 'This access code has expired.' });
    }

    // Automatically delete code permanently upon redemption (single-use)
    await db.redeemAndDeleteCode(record.id);

    return res.json({
      success: true,
      message: 'Access granted! Welcome to the photobooth.',
      code: record.code,
      codeId: record.id,
      note: record.note,
      remainingUses: 0,
    });
  } catch (err: unknown) {
    console.error('Verify code error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error verifying access code.' });
  }
});

// ============================================================
// 3. Admin Access Code Management (CRUD)
// ============================================================
app.get('/api/admin/codes', authenticateToken, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const codes = await db.getAllAccessCodes();
    return res.json({ success: true, codes });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Failed to retrieve access codes.' });
  }
});

app.post('/api/admin/codes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, note, maxUses, expiresAt, count = 1 } = req.body;

    if (code && !/^[A-Z0-9]{5}$/i.test(code.trim())) {
      return res.status(400).json({ error: 'Access code must be exactly 5 alphanumeric characters (letters and numbers).' });
    }

    const numCodes = Math.min(50, Math.max(1, parseInt(count, 10) || 1));
    const createdCodes = [];

    for (let i = 0; i < numCodes; i++) {
      let finalCode = (code && numCodes === 1) ? code.trim().toUpperCase() : generateRandomCode();
      
      // Ensure unique code
      let attempts = 0;
      while (await db.findAccessCode(finalCode) && attempts < 10) {
        finalCode = generateRandomCode();
        attempts++;
      }

      const newCode = await db.createAccessCode(
        finalCode,
        note || (numCodes > 1 ? `Batch ticket #${i + 1}` : 'Single Pass'),
        parseInt(maxUses, 10) || 1,
        expiresAt || null,
        req.user?.id || null
      );
      createdCodes.push(newCode);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully generated ${createdCodes.length} access code(s).`,
      codes: createdCodes,
    });
  } catch (err: unknown) {
    console.error('Generate code error:', err);
    return res.status(500).json({ error: 'Failed to generate access codes.' });
  }
});

app.patch('/api/admin/codes/:id/toggle', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const isActive = await db.toggleAccessCodeActive(id);
    return res.json({ success: true, is_active: isActive });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Failed to toggle code status.' });
  }
});

app.delete('/api/admin/codes/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteAccessCode(id);
    return res.json({ success: deleted });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Failed to delete access code.' });
  }
});

// ============================================================
// 4. Admin Dashboard Stats
// ============================================================
app.get('/api/admin/stats', authenticateToken, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await db.getStats();
    const recentSessions = await db.getAllPhotoSessions(8);
    return res.json({
      success: true,
      stats,
      recentSessions,
    });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
  }
});

// ============================================================
// 5. Photo Sessions & QR Code Storage
// ============================================================
app.post('/api/save-session', async (req: Request, res: Response) => {
  try {
    const { id, accessCode, accessCodeId, image, title, subtitle, layout, filter, frameColor } = req.body;
    const sessionId = id || 'snap_' + Math.random().toString(36).substring(2, 9);

    await db.savePhotoSession({
      id: sessionId,
      access_code: accessCode,
      access_code_id: accessCodeId,
      image_data: image,
      title: title || 'SnapBox Photo Strip',
      subtitle: subtitle || '',
      layout: layout || 'strip-3',
      filter: filter || 'normal',
      frame_color: frameColor || '#ffffff',
    });

    return res.json({ success: true, id: sessionId });
  } catch (err: unknown) {
    console.error('Save session error:', err);
    return res.status(500).json({ error: 'Failed to save photo session.' });
  }
});

app.get('/api/session', async (req: Request, res: Response) => {
  try {
    const id = (req.query.id as string) || 'snap_latest';
    const session = await db.getPhotoSession(id);

    if (session) {
      return res.json({
        image: session.image_data,
        title: session.title,
        subtitle: session.subtitle,
        timestamp: session.created_at,
      });
    }

    return res.status(404).json({ error: 'Photo strip session not found.' });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Failed to retrieve session.' });
  }
});

// Launch Server
export async function startServer() {
  await db.init();
  app.listen(PORT, () => {
    console.log(`🚀 Photobooth API Backend running on http://localhost:${PORT}`);
  });
}

// Auto-start server in standalone Node environment (not in Vercel serverless)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
