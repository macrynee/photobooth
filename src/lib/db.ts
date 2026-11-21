import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { PRESET_GALLERY_TEMPLATES } from '../data/presetTemplates';

export interface AdminRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface AccessCodeRecord {
  id: string;
  code: string;
  note: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PhotoSessionRecord {
  id: string;
  access_code_id: string | null;
  access_code: string | null;
  image_data: string;
  title: string;
  subtitle: string;
  layout: string;
  filter: string;
  frame_color: string;
  created_at: string;
}

export interface PictureTemplateRecord {
  id: string;
  name: string;
  description: string;
  occasion: string;
  category?: string;
  month: number | null;
  layout: string;
  filter: string;
  frame_color: string;
  background_pattern?: string;
  background_image?: string;
  header_font?: string;
  text_color?: string;
  watermark_text?: string;
  watermark_position?: string;
  border_style?: string;
  border_color?: string;
  title: string;
  subtitle: string;
  show_date: boolean;
  stickers: any[];
  is_default: boolean;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at?: string;
}

export const PRESET_MONTHLY_TEMPLATES: PictureTemplateRecord[] = PRESET_GALLERY_TEMPLATES.map((t) => ({
  id: t.id,
  name: t.name,
  description: t.description || '',
  occasion: t.occasion,
  category: t.category || 'minimalist',
  month: typeof t.month === 'number' ? t.month : null,
  layout: t.layout,
  filter: t.filter,
  frame_color: t.frameColor,
  background_pattern: t.backgroundPattern || 'none',
  background_image: t.backgroundImage,
  header_font: t.headerFont || 'grotesk',
  text_color: t.textColor,
  watermark_text: t.watermarkText || 'SILONG CAFE',
  watermark_position: t.watermarkPosition || 'footer',
  border_style: t.borderStyle || 'solid',
  border_color: t.borderColor,
  title: t.title,
  subtitle: t.subtitle,
  show_date: t.showDate,
  stickers: t.stickers || [],
  is_default: !!t.isDefault,
  is_system: true,
  created_by: 'system',
  created_at: t.createdAt || '2026-01-01T00:00:00.000Z',
}));

interface LocalStoreData {
  admins: AdminRecord[];
  access_codes: AccessCodeRecord[];
  photo_sessions: PhotoSessionRecord[];
  picture_templates: PictureTemplateRecord[];
}

// Support serverless / read-only filesystem (on Vercel, only /tmp is writable)
const bundledDbPath = path.resolve(process.cwd(), 'database', 'local_db.json');
const localDbPath = process.env.VERCEL
  ? path.resolve('/tmp', 'local_db.json')
  : bundledDbPath;

// Singleton Pool on globalThis to prevent connection leaks across serverless requests
const globalForPg = globalThis as unknown as { pgPool?: Pool };

function getPool(): Pool | null {
  if (globalForPg.pgPool) {
    return globalForPg.pgPool;
  }
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return null;
  }
  try {
    const isRemote = dbUrl.includes('sslmode=') || dbUrl.includes('.neon.tech') || !dbUrl.includes('localhost');
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    globalForPg.pgPool = pool;
    return pool;
  } catch (err) {
    console.error('Failed to create PostgreSQL pool:', err);
    return null;
  }
}

function getLocalStore(): LocalStoreData {
  if (fs.existsSync(localDbPath)) {
    try {
      const raw = fs.readFileSync(localDbPath, 'utf-8');
      const data: LocalStoreData = JSON.parse(raw);
      if (!data.picture_templates || data.picture_templates.length === 0) {
        data.picture_templates = [...PRESET_MONTHLY_TEMPLATES];
        saveLocalStore(data);
      }
      return data;
    } catch {}
  }

  // If running in /tmp and bundled db exists, copy from bundled db
  if (localDbPath !== bundledDbPath && fs.existsSync(bundledDbPath)) {
    try {
      const raw = fs.readFileSync(bundledDbPath, 'utf-8');
      const data: LocalStoreData = JSON.parse(raw);
      if (!data.picture_templates || data.picture_templates.length === 0) {
        data.picture_templates = [...PRESET_MONTHLY_TEMPLATES];
      }
      saveLocalStore(data);
      return data;
    } catch {}
  }

  const initialHash = bcrypt.hashSync('macqwerty', 10);
  const initialData: LocalStoreData = {
    admins: [
      {
        id: 'admin_1',
        username: 'mac',
        email: 'mac@snapbox.local',
        password_hash: initialHash,
        role: 'admin',
        created_at: new Date().toISOString(),
      },
    ],
    access_codes: [
      {
        id: 'code_1',
        code: '8K2M9',
        note: 'Single Session Pass',
        max_uses: 1,
        current_uses: 0,
        is_active: true,
        expires_at: null,
        created_by: 'admin_1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'code_2',
        code: '7B4X1',
        note: 'Single Session Pass',
        max_uses: 1,
        current_uses: 0,
        is_active: true,
        expires_at: null,
        created_by: 'admin_1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'code_3',
        code: 'A59F2',
        note: 'Single Session Pass',
        max_uses: 1,
        current_uses: 0,
        is_active: true,
        expires_at: null,
        created_by: 'admin_1',
        created_at: new Date().toISOString(),
      },
    ],
    photo_sessions: [],
    picture_templates: [...PRESET_MONTHLY_TEMPLATES],
  };
  saveLocalStore(initialData);
  return initialData;
}

function saveLocalStore(data: LocalStoreData) {
  try {
    fs.mkdirSync(path.dirname(localDbPath), { recursive: true });
    fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn('Could not write local store:', (err as Error).message);
  }
}

export const db = {
  async init() {
    const pool = getPool();
    if (pool) {
      try {
        const client = await pool.connect();
        const res = await client.query('SELECT NOW()');
        console.log('✅ Connected to PostgreSQL successfully at:', res.rows[0].now);

        try {
          const adminCheck = await client.query('SELECT id, password_hash FROM admins WHERE LOWER(username) = $1 LIMIT 1', ['mac']);
          if (adminCheck.rows.length > 0) {
            const currentHash = adminCheck.rows[0].password_hash;
            if (!bcrypt.compareSync('macqwerty', currentHash)) {
              const freshHash = bcrypt.hashSync('macqwerty', 10);
              await client.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [freshHash, adminCheck.rows[0].id]);
              console.log('🔑 Updated admin "mac" password hash in PostgreSQL to ensure macqwerty login.');
            }
          }
        } catch (adminErr) {
          console.warn('Admin verification notice:', adminErr);
        }

        // Initialize / verify picture_templates table in PostgreSQL
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS picture_templates (
              id VARCHAR(64) PRIMARY KEY,
              name VARCHAR(120) NOT NULL,
              description TEXT,
              occasion VARCHAR(64),
              category VARCHAR(64) DEFAULT 'minimalist',
              month INT,
              layout VARCHAR(32) NOT NULL DEFAULT 'strip-3',
              filter VARCHAR(32) NOT NULL DEFAULT 'normal',
              frame_color VARCHAR(32) NOT NULL DEFAULT '#ffffff',
              background_pattern VARCHAR(64) DEFAULT 'none',
              background_image TEXT,
              header_font VARCHAR(64) DEFAULT 'grotesk',
              text_color VARCHAR(32),
              watermark_text VARCHAR(120) DEFAULT 'SILONG CAFE',
              watermark_position VARCHAR(32) DEFAULT 'footer',
              border_style VARCHAR(32) DEFAULT 'solid',
              border_color VARCHAR(32),
              title VARCHAR(120) NOT NULL DEFAULT 'SILONG CAFE • PHOTOBOOTH',
              subtitle VARCHAR(120) DEFAULT '',
              show_date BOOLEAN NOT NULL DEFAULT true,
              stickers JSONB DEFAULT '[]'::jsonb,
              is_default BOOLEAN NOT NULL DEFAULT false,
              is_system BOOLEAN NOT NULL DEFAULT false,
              created_by VARCHAR(64),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Ensure new columns exist if table was already created earlier
            ALTER TABLE picture_templates ADD COLUMN IF NOT EXISTS category VARCHAR(64) DEFAULT 'minimalist';
            ALTER TABLE picture_templates ADD COLUMN IF NOT EXISTS background_pattern VARCHAR(64) DEFAULT 'none';
            ALTER TABLE picture_templates ADD COLUMN IF NOT EXISTS background_image TEXT;
            ALTER TABLE picture_templates ADD COLUMN IF NOT EXISTS header_font VARCHAR(64) DEFAULT 'grotesk';
            ALTER TABLE picture_templates ADD COLUMN IF NOT EXISTS text_color VARCHAR(32);
            ALTER TABLE picture_templates ADD COLUMN IF NOT EXISTS watermark_text VARCHAR(120) DEFAULT 'SILONG CAFE';
            ALTER TABLE picture_templates ADD COLUMN IF NOT EXISTS watermark_position VARCHAR(32) DEFAULT 'footer';
            ALTER TABLE picture_templates ADD COLUMN IF NOT EXISTS border_style VARCHAR(32) DEFAULT 'solid';
            ALTER TABLE picture_templates ADD COLUMN IF NOT EXISTS border_color VARCHAR(32);
          `);

          const tplCount = await client.query('SELECT COUNT(*) FROM picture_templates');
          if (parseInt(tplCount.rows[0].count, 10) === 0) {
            console.log('🎨 Seeding initial gallery templates into PostgreSQL...');
            for (const tpl of PRESET_MONTHLY_TEMPLATES) {
              await client.query(
                `INSERT INTO picture_templates 
                 (id, name, description, occasion, category, month, layout, filter, frame_color, background_pattern, background_image, header_font, text_color, watermark_text, watermark_position, border_style, border_color, title, subtitle, show_date, stickers, is_default, is_system, created_by, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $25)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  tpl.id,
                  tpl.name,
                  tpl.description,
                  tpl.occasion,
                  tpl.category || 'minimalist',
                  tpl.month,
                  tpl.layout,
                  tpl.filter,
                  tpl.frame_color,
                  tpl.background_pattern || 'none',
                  tpl.background_image || null,
                  tpl.header_font || 'grotesk',
                  tpl.text_color || null,
                  tpl.watermark_text || 'SILONG CAFE',
                  tpl.watermark_position || 'footer',
                  tpl.border_style || 'solid',
                  tpl.border_color || null,
                  tpl.title,
                  tpl.subtitle,
                  tpl.show_date,
                  JSON.stringify(tpl.stickers),
                  tpl.is_default,
                  tpl.is_system,
                  tpl.created_by,
                  tpl.created_at,
                ]
              );
            }
            console.log('✅ Gallery templates seeded successfully in PostgreSQL.');
          }
        } catch (tplInitErr) {
          console.warn('Template table init notice:', tplInitErr);
        }

        client.release();
        return;
      } catch (err) {
        console.error('⚠️ PostgreSQL connection failed:', (err as Error).message);
      }
    } else {
      console.warn('⚠️ No DATABASE_URL found in environment variables. Running on local fallback store.');
    }
  },

  async findAdminByUsernameOrEmail(identifier: string): Promise<AdminRecord | null> {
    const clean = identifier.trim().toLowerCase();
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(
          'SELECT * FROM admins WHERE LOWER(username) = $1 OR LOWER(email) = $1 LIMIT 1',
          [clean]
        );
        return res.rows[0] || null;
      } catch (err) {
        console.error('PostgreSQL findAdminByUsernameOrEmail error:', err);
      }
    }
    const store = getLocalStore();
    return (
      store.admins.find(
        (a) => a.username.toLowerCase() === clean || a.email.toLowerCase() === clean
      ) || null
    );
  },

  async createAdmin(username: string, email: string, passwordHash: string): Promise<AdminRecord> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(
          'INSERT INTO admins (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
          [username, email, passwordHash]
        );
        return res.rows[0];
      } catch (err) {
        console.error('PostgreSQL createAdmin error:', err);
        throw err;
      }
    }

    const id = 'admin_' + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();
    const store = getLocalStore();
    const newAdmin: AdminRecord = {
      id,
      username,
      email,
      password_hash: passwordHash,
      role: 'admin',
      created_at: createdAt,
    };
    store.admins.push(newAdmin);
    saveLocalStore(store);
    return newAdmin;
  },

  async getAllAccessCodes(): Promise<AccessCodeRecord[]> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM access_codes ORDER BY created_at DESC');
        return res.rows;
      } catch (err) {
        console.error('PostgreSQL getAllAccessCodes error:', err);
      }
    }
    const store = getLocalStore();
    return [...store.access_codes].reverse();
  },

  async findAccessCode(codeString: string): Promise<AccessCodeRecord | null> {
    const cleanCode = codeString.trim().toUpperCase();
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM access_codes WHERE code = $1 LIMIT 1', [cleanCode]);
        return res.rows[0] || null;
      } catch (err) {
        console.error('PostgreSQL findAccessCode error:', err);
      }
    }
    const store = getLocalStore();
    return store.access_codes.find((c) => c.code.toUpperCase() === cleanCode) || null;
  },

  async createAccessCode(
    code: string,
    note: string = '',
    maxUses: number = 1,
    expiresAt: string | null = null,
    createdBy: string | null = null
  ): Promise<AccessCodeRecord> {
    const cleanCode = code.trim().toUpperCase();
    const pool = getPool();
    if (pool) {
      try {
        const isUuid = createdBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(createdBy);
        const res = await pool.query(
          'INSERT INTO access_codes (code, note, max_uses, expires_at, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [cleanCode, note, maxUses, expiresAt, isUuid ? createdBy : null]
        );
        return res.rows[0];
      } catch (err) {
        console.error('PostgreSQL createAccessCode error:', err);
        throw err;
      }
    }

    const id = 'code_' + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();
    const store = getLocalStore();
    const newCode: AccessCodeRecord = {
      id,
      code: cleanCode,
      note,
      max_uses: maxUses,
      current_uses: 0,
      is_active: true,
      expires_at: expiresAt,
      created_by: createdBy,
      created_at: createdAt,
    };
    store.access_codes.push(newCode);
    saveLocalStore(store);
    return newCode;
  },

  async redeemAndDeleteCode(id: string): Promise<void> {
    const pool = getPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM access_codes WHERE id = $1', [id]);
        return;
      } catch (err) {
        console.error('PostgreSQL redeemAndDeleteCode error:', err);
      }
    }
    const store = getLocalStore();
    const idx = store.access_codes.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.access_codes.splice(idx, 1);
      saveLocalStore(store);
    }
  },

  async toggleAccessCodeActive(id: string): Promise<boolean> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(
          'UPDATE access_codes SET is_active = NOT is_active WHERE id = $1 RETURNING is_active',
          [id]
        );
        return res.rows[0]?.is_active ?? false;
      } catch (err) {
        console.error('PostgreSQL toggleAccessCodeActive error:', err);
      }
    }
    const store = getLocalStore();
    const code = store.access_codes.find((c) => c.id === id);
    if (code) {
      code.is_active = !code.is_active;
      saveLocalStore(store);
      return code.is_active;
    }
    return false;
  },

  async deleteAccessCode(id: string): Promise<boolean> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query('DELETE FROM access_codes WHERE id = $1', [id]);
        return (res.rowCount ?? 0) > 0;
      } catch (err) {
        console.error('PostgreSQL deleteAccessCode error:', err);
      }
    }
    const store = getLocalStore();
    const idx = store.access_codes.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.access_codes.splice(idx, 1);
      saveLocalStore(store);
      return true;
    }
    return false;
  },

  async savePhotoSession(record: {
    id: string;
    access_code?: string;
    access_code_id?: string;
    image_data: string;
    title: string;
    subtitle: string;
    layout: string;
    filter: string;
    frame_color: string;
  }): Promise<void> {
    const createdAt = new Date().toISOString();
    const pool = getPool();
    if (pool) {
      try {
        const isAccessCodeUuid = record.access_code_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.access_code_id);
        await pool.query(
          `INSERT INTO photo_sessions (id, access_code, access_code_id, image_data, title, subtitle, layout, filter, frame_color, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET image_data = EXCLUDED.image_data, title = EXCLUDED.title`,
          [
            record.id,
            record.access_code || null,
            isAccessCodeUuid ? record.access_code_id : null,
            record.image_data,
            record.title,
            record.subtitle,
            record.layout,
            record.filter,
            record.frame_color,
            createdAt,
          ]
        );
        return;
      } catch (err) {
        console.error('PostgreSQL savePhotoSession error:', err);
        throw err;
      }
    }

    const store = getLocalStore();
    const existingIdx = store.photo_sessions.findIndex((p) => p.id === record.id);
    const item: PhotoSessionRecord = {
      id: record.id,
      access_code: record.access_code || null,
      access_code_id: record.access_code_id || null,
      image_data: record.image_data,
      title: record.title,
      subtitle: record.subtitle,
      layout: record.layout,
      filter: record.filter,
      frame_color: record.frame_color,
      created_at: createdAt,
    };

    if (existingIdx !== -1) {
      store.photo_sessions[existingIdx] = item;
    } else {
      store.photo_sessions.push(item);
    }
    saveLocalStore(store);
  },

  async getPhotoSession(id: string): Promise<PhotoSessionRecord | null> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM photo_sessions WHERE id = $1 LIMIT 1', [id]);
        return res.rows[0] || null;
      } catch (err) {
        console.error('PostgreSQL getPhotoSession error:', err);
      }
    }
    const store = getLocalStore();
    return store.photo_sessions.find((p) => p.id === id) || store.photo_sessions[store.photo_sessions.length - 1] || null;
  },

  async getAllPhotoSessions(limit: number = 20): Promise<PhotoSessionRecord[]> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM photo_sessions ORDER BY created_at DESC LIMIT $1', [limit]);
        return res.rows;
      } catch (err) {
        console.error('PostgreSQL getAllPhotoSessions error:', err);
      }
    }
    const store = getLocalStore();
    return [...store.photo_sessions].reverse().slice(0, limit);
  },

  async getStats() {
    const pool = getPool();
    if (pool) {
      try {
        const totalCodesRes = await pool.query('SELECT COUNT(*) FROM access_codes');
        const activeCodesRes = await pool.query('SELECT COUNT(*) FROM access_codes WHERE is_active = true');
        const totalSessionsRes = await pool.query('SELECT COUNT(*) FROM photo_sessions');
        const totalUsesRes = await pool.query('SELECT COALESCE(SUM(current_uses), 0) as total FROM access_codes');

        return {
          totalCodes: parseInt(totalCodesRes.rows[0].count, 10),
          activeCodes: parseInt(activeCodesRes.rows[0].count, 10),
          totalSessions: parseInt(totalSessionsRes.rows[0].count, 10),
          totalRedemptions: parseInt(totalUsesRes.rows[0].total, 10),
        };
      } catch (err) {
        console.error('PostgreSQL getStats error:', err);
      }
    }

    const store = getLocalStore();
    const totalCodes = store.access_codes.length;
    const activeCodes = store.access_codes.filter((c) => c.is_active).length;
    const totalSessions = store.photo_sessions.length;
    const totalRedemptions = store.access_codes.reduce((acc, c) => acc + (c.current_uses || 0), 0);

    return {
      totalCodes,
      activeCodes,
      totalSessions,
      totalRedemptions,
    };
  },

  async getAllTemplates(options?: { month?: number; occasion?: string }): Promise<PictureTemplateRecord[]> {
    const pool = getPool();
    if (pool) {
      try {
        let query = 'SELECT * FROM picture_templates';
        const params: any[] = [];
        const conditions: string[] = [];

        if (options?.month) {
          params.push(options.month);
          conditions.push(`month = $${params.length}`);
        }
        if (options?.occasion) {
          params.push(options.occasion);
          conditions.push(`occasion = $${params.length}`);
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY month ASC NULLS LAST, is_default DESC, created_at DESC';

        const res = await pool.query(query, params);
        return res.rows.map((row) => ({
          ...row,
          stickers: typeof row.stickers === 'string' ? JSON.parse(row.stickers) : row.stickers || [],
        }));
      } catch (err) {
        console.error('PostgreSQL getAllTemplates error:', err);
      }
    }
    const store = getLocalStore();
    let list = store.picture_templates || PRESET_MONTHLY_TEMPLATES;
    if (options?.month) {
      list = list.filter((t) => t.month === options.month);
    }
    if (options?.occasion) {
      list = list.filter((t) => t.occasion === options.occasion);
    }
    return list;
  },

  async getTemplateById(id: string): Promise<PictureTemplateRecord | null> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM picture_templates WHERE id = $1 LIMIT 1', [id]);
        if (res.rows[0]) {
          const row = res.rows[0];
          return {
            ...row,
            stickers: typeof row.stickers === 'string' ? JSON.parse(row.stickers) : row.stickers || [],
          };
        }
        return null;
      } catch (err) {
        console.error('PostgreSQL getTemplateById error:', err);
      }
    }
    const store = getLocalStore();
    return (store.picture_templates || PRESET_MONTHLY_TEMPLATES).find((t) => t.id === id) || null;
  },

  async createTemplate(data: Partial<PictureTemplateRecord>): Promise<PictureTemplateRecord> {
    const id = data.id || 'tpl_' + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();
    const item: PictureTemplateRecord = {
      id,
      name: data.name || 'Untitled Template',
      description: data.description || '',
      occasion: data.occasion || 'custom',
      category: data.category || 'minimalist',
      month: typeof data.month === 'number' ? data.month : null,
      layout: data.layout || 'strip-3',
      filter: data.filter || 'normal',
      frame_color: data.frame_color || '#ffffff',
      background_pattern: data.background_pattern || 'none',
      background_image: data.background_image || undefined,
      header_font: data.header_font || 'grotesk',
      text_color: data.text_color || undefined,
      watermark_text: data.watermark_text || 'SILONG CAFE',
      watermark_position: data.watermark_position || 'footer',
      border_style: data.border_style || 'solid',
      border_color: data.border_color || undefined,
      title: data.title || 'SILONG CAFE • PHOTOBOOTH',
      subtitle: data.subtitle || '',
      show_date: data.show_date ?? true,
      stickers: data.stickers || [],
      is_default: data.is_default || false,
      is_system: data.is_system || false,
      created_by: data.created_by || null,
      created_at: createdAt,
      updated_at: createdAt,
    };

    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(
          `INSERT INTO picture_templates 
           (id, name, description, occasion, category, month, layout, filter, frame_color, background_pattern, background_image, header_font, text_color, watermark_text, watermark_position, border_style, border_color, title, subtitle, show_date, stickers, is_default, is_system, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
           RETURNING *`,
          [
            item.id,
            item.name,
            item.description,
            item.occasion,
            item.category,
            item.month,
            item.layout,
            item.filter,
            item.frame_color,
            item.background_pattern,
            item.background_image || null,
            item.header_font,
            item.text_color || null,
            item.watermark_text,
            item.watermark_position,
            item.border_style,
            item.border_color || null,
            item.title,
            item.subtitle,
            item.show_date,
            JSON.stringify(item.stickers),
            item.is_default,
            item.is_system,
            item.created_by,
            item.created_at,
            item.updated_at,
          ]
        );
        const row = res.rows[0];
        return {
          ...row,
          stickers: typeof row.stickers === 'string' ? JSON.parse(row.stickers) : row.stickers || [],
        };
      } catch (err) {
        console.error('PostgreSQL createTemplate error:', err);
        throw err;
      }
    }

    const store = getLocalStore();
    if (!store.picture_templates) store.picture_templates = [...PRESET_MONTHLY_TEMPLATES];
    store.picture_templates.push(item);
    saveLocalStore(store);
    return item;
  },

  async updateTemplate(id: string, data: Partial<PictureTemplateRecord>): Promise<PictureTemplateRecord | null> {
    const updatedAt = new Date().toISOString();
    const pool = getPool();
    if (pool) {
      try {
        const current = await this.getTemplateById(id);
        if (!current) return null;

        const merged: PictureTemplateRecord = {
          ...current,
          ...data,
          updated_at: updatedAt,
        };

        const res = await pool.query(
          `UPDATE picture_templates SET 
             name = $1, description = $2, occasion = $3, category = $4, month = $5, layout = $6,
             filter = $7, frame_color = $8, background_pattern = $9, background_image = $10,
             header_font = $11, text_color = $12, watermark_text = $13, watermark_position = $14,
             border_style = $15, border_color = $16, title = $17, subtitle = $18, show_date = $19,
             stickers = $20, is_default = $21, updated_at = $22
           WHERE id = $23
           RETURNING *`,
          [
            merged.name,
            merged.description,
            merged.occasion,
            merged.category || 'minimalist',
            merged.month,
            merged.layout,
            merged.filter,
            merged.frame_color,
            merged.background_pattern || 'none',
            merged.background_image || null,
            merged.header_font || 'grotesk',
            merged.text_color || null,
            merged.watermark_text || 'SILONG CAFE',
            merged.watermark_position || 'footer',
            merged.border_style || 'solid',
            merged.border_color || null,
            merged.title,
            merged.subtitle,
            merged.show_date,
            JSON.stringify(merged.stickers),
            merged.is_default,
            updatedAt,
            id,
          ]
        );
        const row = res.rows[0];
        return {
          ...row,
          stickers: typeof row.stickers === 'string' ? JSON.parse(row.stickers) : row.stickers || [],
        };
      } catch (err) {
        console.error('PostgreSQL updateTemplate error:', err);
        throw err;
      }
    }

    const store = getLocalStore();
    if (!store.picture_templates) store.picture_templates = [...PRESET_MONTHLY_TEMPLATES];
    const idx = store.picture_templates.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    store.picture_templates[idx] = {
      ...store.picture_templates[idx],
      ...data,
      updated_at: updatedAt,
    };
    saveLocalStore(store);
    return store.picture_templates[idx];
  },

  async deleteTemplate(id: string): Promise<boolean> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query('DELETE FROM picture_templates WHERE id = $1', [id]);
        return (res.rowCount ?? 0) > 0;
      } catch (err) {
        console.error('PostgreSQL deleteTemplate error:', err);
        throw err;
      }
    }
    const store = getLocalStore();
    if (!store.picture_templates) return false;
    const idx = store.picture_templates.findIndex((t) => t.id === id);
    if (idx !== -1) {
      store.picture_templates.splice(idx, 1);
      saveLocalStore(store);
      return true;
    }
    return false;
  },

  async resetTemplates(): Promise<void> {
    const pool = getPool();
    if (pool) {
      try {
        for (const tpl of PRESET_MONTHLY_TEMPLATES) {
          await pool.query(
            `INSERT INTO picture_templates 
             (id, name, description, occasion, month, layout, filter, frame_color, title, subtitle, show_date, stickers, is_default, is_system, created_by, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               description = EXCLUDED.description,
               occasion = EXCLUDED.occasion,
               month = EXCLUDED.month,
               layout = EXCLUDED.layout,
               filter = EXCLUDED.filter,
               frame_color = EXCLUDED.frame_color,
               title = EXCLUDED.title,
               subtitle = EXCLUDED.subtitle,
               show_date = EXCLUDED.show_date,
               stickers = EXCLUDED.stickers`,
            [
              tpl.id,
              tpl.name,
              tpl.description,
              tpl.occasion,
              tpl.month,
              tpl.layout,
              tpl.filter,
              tpl.frame_color,
              tpl.title,
              tpl.subtitle,
              tpl.show_date,
              JSON.stringify(tpl.stickers),
              tpl.is_default,
              tpl.is_system,
              tpl.created_by,
              tpl.created_at,
            ]
          );
        }
        return;
      } catch (err) {
        console.error('PostgreSQL resetTemplates error:', err);
      }
    }
    const store = getLocalStore();
    store.picture_templates = [...PRESET_MONTHLY_TEMPLATES];
    saveLocalStore(store);
  },
};
