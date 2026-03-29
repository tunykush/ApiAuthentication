import Link from 'next/link'
import UserMenu from '@/components/auth/usermenu'

export default function TopBar() {
  return (
    <header className="border-b border-black/8 bg-[#f5f5f3] px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">
          auth
        </Link>

        <UserMenu />
      </div>
    </header>
  )
}