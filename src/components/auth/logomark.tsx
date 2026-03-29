export default function logomark() {
  return (
    <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-xl bg-[#111318] shadow-sm">
      <div className="relative h-6 w-6">
        <span className="absolute left-1/2 top-0 h-6 w-[2px] -translate-x-1/2 rounded bg-white" />
        <span className="absolute left-1/2 top-0 h-6 w-[2px] -translate-x-1/2 rotate-45 rounded bg-white" />
        <span className="absolute left-1/2 top-0 h-6 w-[2px] -translate-x-1/2 rotate-90 rounded bg-white" />
        <span className="absolute left-1/2 top-0 h-6 w-[2px] -translate-x-1/2 rotate-[135deg] rounded bg-white" />
      </div>
    </div>
  )
}