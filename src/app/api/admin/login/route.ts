import { NextRequest } from 'next/server';
import { POST as authLoginPOST } from '@/app/api/auth/login/route';

export async function POST(req: NextRequest) {
  return authLoginPOST(req);
}
