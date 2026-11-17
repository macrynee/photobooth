import { NextRequest } from 'next/server';
import { GET as authMeGET } from '@/app/api/auth/me/route';

export async function GET(req: NextRequest) {
  return authMeGET(req);
}
