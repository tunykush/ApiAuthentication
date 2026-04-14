import { cookies } from 'next/headers';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';
import { UserMenu } from './UserMenu';
import { GraduationCap } from 'lucide-react';

async function getUser(): Promise<{ name: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;
    const decoded = jwtDecode<{ exp?: number; sub?: string; name?: string; username?: string }>(token);
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    const name = decoded.name ?? decoded.username ?? decoded.sub ?? 'User';
    return { name };
  } catch {
    return null;
  }
}

export default async function Header() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-900 transition hover:opacity-75"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">Edgen AI</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/papers"
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                My Papers
              </Link>
              <UserMenu name={user.name} />
            </>
          ) : (
            <Link
              href="/signin"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
