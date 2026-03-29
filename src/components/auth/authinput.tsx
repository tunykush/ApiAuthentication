type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export default function authinput({ label, ...props }: AuthInputProps) {
  return (
    <div className="mb-5">
      <label className="mb-3 block text-[15px] font-medium text-[#111111]">
        {label}
      </label>
      <input
        {...props}
        className="h-[52px] w-full rounded-xl border border-black/12 bg-white px-4 text-[16px] text-[#111111] outline-none transition placeholder:text-[#b1b4bf] focus:border-[#8f94a3] focus:ring-2 focus:ring-black/5"
      />
    </div>
  )
}