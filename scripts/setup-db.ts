import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in environment.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  console.log('Connecting to Neon PostgreSQL...');
  const client = await pool.connect();
  try {
    const timeRes = await client.query('SELECT NOW()');
    console.log('✅ Connected successfully! Server time:', timeRes.rows[0].now);

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const existingTables = tablesRes.rows.map((r: { table_name: string }) => r.table_name);
    console.log('Existing tables in public schema:', existingTables);

    const schemaPath = path.resolve(process.cwd(), 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('Running database/schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(schemaSql);
      console.log('✅ Schema executed successfully!');
    }

    // Verify tables
    const verifyRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Verified tables:', verifyRes.rows.map((r: { table_name: string }) => r.table_name));

    // Verify admin
    const adminRes = await client.query('SELECT id, username, email, role FROM admins');
    console.log('Admins in DB:', adminRes.rows);

    // Verify codes
    const codesRes = await client.query('SELECT code, note, is_active FROM access_codes');
    console.log('Access codes in DB:', codesRes.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Database error:', err);
  process.exit(1);
});
