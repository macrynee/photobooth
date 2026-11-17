import app from '../server/index';
import { db } from '../server/db';

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    try {
      await db.init();
      initialized = true;
    } catch (err) {
      console.error('Database initialization error in serverless function:', err);
    }
  }
  return app(req, res);
}
