import { NextRequest } from 'next/server';
import { POST as authRegisterPOST } from '@/app/api/auth/register/route';

export async function POST(req: NextRequest) {
  return authRegisterPOST(req);
}
