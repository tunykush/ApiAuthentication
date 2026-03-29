type AuthButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
}

export default function authbutton({
  children,
  ...props
}: AuthButtonProps) {
  return (
    <button
      {...props}
      className="mt-2 h-[54px] w-full rounded-xl bg-[linear-gradient(180deg,#4d4f5c_0%,#2f313a_100%)] px-4 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_2px_8px_rgba(0,0,0,0.12)] transition hover:brightness-105"
    >
      <span className="inline-flex items-center gap-2">
        {children}
        <span className="text-[11px]">▶</span>
      </span>
    </button>
  )
}