import { POST as authLogoutPOST } from '@/app/api/auth/logout/route';

export async function POST() {
  return authLogoutPOST();
}
