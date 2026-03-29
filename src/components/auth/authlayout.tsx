import LogoMark from '@/components/auth/logomark'

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#f5f5f3] px-4 py-8 text-[#111111] h-screen flex items-center justify-center">
      <div className="mx-auto w-full max-w-[520px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <div className="px-7 py-10 sm:px-10">
          {/* <LogoMark /> */}

          <div className="text-center">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#111111]">
              {title}
            </h1>
            <p className="mt-3 text-[15px] leading-6 text-[#7b7f8f]">
              {subtitle}
            </p>
          </div>

          <div className="mt-8">{children}</div>
        </div>

        <div className="border-t border-black/6 bg-[#fafafa] px-7 py-6 text-center sm:px-10">
          <p className="text-[14px] text-[#7b7f8f]">Secured by your custom auth UI</p>
        </div>
      </div>
    </main>
  )
}