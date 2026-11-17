import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

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

interface LocalStoreData {
  admins: AdminRecord[];
  access_codes: AccessCodeRecord[];
  photo_sessions: PhotoSessionRecord[];
}

const localDbPath = path.resolve(process.cwd(), 'database', 'local_db.json');

// Singleton Pool for Next.js to prevent connection exhaustion during development hot-reloading
const globalForPg = globalThis as unknown as { pgPool?: Pool; pgInitPromise?: Promise<void> };

const dbUrl = process.env.DATABASE_URL;
let pgPool: Pool | null = globalForPg.pgPool || null;
let usePg = false;

if (!pgPool && dbUrl) {
  try {
    const isRemote = dbUrl.includes('sslmode=') || dbUrl.includes('.neon.tech') || !dbUrl.includes('localhost');
    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    });
    globalForPg.pgPool = pgPool;
  } catch (err) {
    console.warn('⚠️ Could not initialize PostgreSQL pool:', err);
  }
}

function getLocalStore(): LocalStoreData {
  if (!fs.existsSync(localDbPath)) {
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
    };
    try {
      fs.mkdirSync(path.dirname(localDbPath), { recursive: true });
      fs.writeFileSync(localDbPath, JSON.stringify(initialData, null, 2));
    } catch {}
    return initialData;
  }

  try {
    const raw = fs.readFileSync(localDbPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { admins: [], access_codes: [], photo_sessions: [] };
  }
}

function saveLocalStore(data: LocalStoreData) {
  try {
    fs.mkdirSync(path.dirname(localDbPath), { recursive: true });
    fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
  } catch {}
}

export const db = {
  async init() {
    if (globalForPg.pgInitPromise) {
      return globalForPg.pgInitPromise;
    }

    globalForPg.pgInitPromise = (async () => {
      if (pgPool) {
        try {
          const client = await pgPool.connect();
          const res = await client.query('SELECT NOW()');
          usePg = true;
          console.log('✅ Connected to PostgreSQL successfully at:', res.rows[0].now);

          // Verify default admin 'mac' has a valid password hash in PostgreSQL
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

          client.release();
        } catch (err) {
          console.warn('ℹ️ PostgreSQL not reachable, using local persistent JSON store (database/local_db.json):', (err as Error).message);
          usePg = false;
        }
      } else {
        usePg = false;
      }

      // Ensure local store has valid mac hash
      const store = getLocalStore();
      const localMac = store.admins.find((a) => a.username.toLowerCase() === 'mac');
      if (localMac && !bcrypt.compareSync('macqwerty', localMac.password_hash)) {
        localMac.password_hash = bcrypt.hashSync('macqwerty', 10);
        saveLocalStore(store);
      }
    })();

    return globalForPg.pgInitPromise;
  },

  async findAdminByUsernameOrEmail(identifier: string): Promise<AdminRecord | null> {
    await this.init();
    const clean = identifier.trim().toLowerCase();
    if (usePg && pgPool) {
      const res = await pgPool.query(
        'SELECT * FROM admins WHERE LOWER(username) = $1 OR LOWER(email) = $1 LIMIT 1',
        [clean]
      );
      return res.rows[0] || null;
    }
    const store = getLocalStore();
    return (
      store.admins.find(
        (a) => a.username.toLowerCase() === clean || a.email.toLowerCase() === clean
      ) || null
    );
  },

  async createAdmin(username: string, email: string, passwordHash: string): Promise<AdminRecord> {
    await this.init();
    const id = 'admin_' + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();

    if (usePg && pgPool) {
      const res = await pgPool.query(
        'INSERT INTO admins (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
        [username, email, passwordHash]
      );
      return res.rows[0];
    }

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
    await this.init();
    if (usePg && pgPool) {
      const res = await pgPool.query('SELECT * FROM access_codes ORDER BY created_at DESC');
      return res.rows;
    }
    const store = getLocalStore();
    return [...store.access_codes].reverse();
  },

  async findAccessCode(codeString: string): Promise<AccessCodeRecord | null> {
    await this.init();
    const cleanCode = codeString.trim().toUpperCase();
    if (usePg && pgPool) {
      const res = await pgPool.query('SELECT * FROM access_codes WHERE code = $1 LIMIT 1', [cleanCode]);
      return res.rows[0] || null;
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
    await this.init();
    const id = 'code_' + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();
    const cleanCode = code.trim().toUpperCase();

    if (usePg && pgPool) {
      const isUuid = createdBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(createdBy);
      const res = await pgPool.query(
        'INSERT INTO access_codes (code, note, max_uses, expires_at, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [cleanCode, note, maxUses, expiresAt, isUuid ? createdBy : null]
      );
      return res.rows[0];
    }

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
    await this.init();
    if (usePg && pgPool) {
      await pgPool.query('DELETE FROM access_codes WHERE id = $1', [id]);
      return;
    }
    const store = getLocalStore();
    const idx = store.access_codes.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.access_codes.splice(idx, 1);
      saveLocalStore(store);
    }
  },

  async toggleAccessCodeActive(id: string): Promise<boolean> {
    await this.init();
    if (usePg && pgPool) {
      const res = await pgPool.query(
        'UPDATE access_codes SET is_active = NOT is_active WHERE id = $1 RETURNING is_active',
        [id]
      );
      return res.rows[0]?.is_active ?? false;
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
    await this.init();
    if (usePg && pgPool) {
      const res = await pgPool.query('DELETE FROM access_codes WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
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
    await this.init();
    const createdAt = new Date().toISOString();
    if (usePg && pgPool) {
      const isAccessCodeUuid = record.access_code_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.access_code_id);
      await pgPool.query(
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
    await this.init();
    if (usePg && pgPool) {
      const res = await pgPool.query('SELECT * FROM photo_sessions WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] || null;
    }
    const store = getLocalStore();
    return store.photo_sessions.find((p) => p.id === id) || store.photo_sessions[store.photo_sessions.length - 1] || null;
  },

  async getAllPhotoSessions(limit: number = 20): Promise<PhotoSessionRecord[]> {
    await this.init();
    if (usePg && pgPool) {
      const res = await pgPool.query('SELECT * FROM photo_sessions ORDER BY created_at DESC LIMIT $1', [limit]);
      return res.rows;
    }
    const store = getLocalStore();
    return [...store.photo_sessions].reverse().slice(0, limit);
  },

  async getStats() {
    await this.init();
    if (usePg && pgPool) {
      const totalCodesRes = await pgPool.query('SELECT COUNT(*) FROM access_codes');
      const activeCodesRes = await pgPool.query('SELECT COUNT(*) FROM access_codes WHERE is_active = true');
      const totalSessionsRes = await pgPool.query('SELECT COUNT(*) FROM photo_sessions');
      const totalUsesRes = await pgPool.query('SELECT COALESCE(SUM(current_uses), 0) as total FROM access_codes');

      return {
        totalCodes: parseInt(totalCodesRes.rows[0].count, 10),
        activeCodes: parseInt(activeCodesRes.rows[0].count, 10),
        totalSessions: parseInt(totalSessionsRes.rows[0].count, 10),
        totalRedemptions: parseInt(totalUsesRes.rows[0].total, 10),
      };
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
};
