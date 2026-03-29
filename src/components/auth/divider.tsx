export default function divider() {
  return (
    <div className="my-8 flex items-center gap-4">
      <div className="h-px flex-1 bg-black/8" />
      <span className="text-[15px] text-[#6f7380]">or</span>
      <div className="h-px flex-1 bg-black/8" />
    </div>
  )
}