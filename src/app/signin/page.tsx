import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import SignInForm from './SignInForm';

export default async function SignInPage() {
  // If already logged in with a valid token, skip the login form
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (token) {
      const decoded = jwtDecode<{ exp?: number }>(token);
      const now = Math.floor(Date.now() / 1000);
      if (!decoded.exp || decoded.exp > now) {
        redirect('/papers');
      }
    }
  } catch {
    // Invalid token — show the form
  }

  return <SignInForm />;
}
