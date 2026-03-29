type SocialButtonProps = {
  icon: React.ReactNode
  children: React.ReactNode
  badge?: string
}

export default function socialbutton({
  icon,
  children,
  badge,
}: SocialButtonProps) {
  return (
    <button
      type="button"
      className="relative mb-3 flex h-[52px] w-full items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-[15px] font-medium text-[#444854] transition hover:bg-[#fafafa]"
    >
      {badge ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-black/8 bg-[#f3f3f3] px-3 py-1 text-[12px] text-[#7a7d87]">
          {badge}
        </span>
      ) : null}

      <span className="mr-3 inline-flex items-center">{icon}</span>
      <span>{children}</span>
    </button>
  )
}