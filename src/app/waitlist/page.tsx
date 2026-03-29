'use client'

import Link from 'next/link'
import { useState } from 'react'
import AuthLayout from '@/components/auth/authlayout'
import AuthInput from '@/components/auth/authinput'
import AuthButton from '@/components/auth/authbutton'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Joined waitlist with: ${email}`)
  }

  return (
    <AuthLayout
      title="Join the waitlist"
      subtitle="Enter your email address and we'll let you know when your spot is ready."
    >
      <form onSubmit={handleSubmit}>
        <AuthInput
          label="Email address"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AuthButton type="submit">Join the waitlist</AuthButton>

        <p className="mt-8 text-center text-[15px] text-[#7b7f8f]">
          Already have access?{' '}
          <Link href="/signin" className="font-medium text-[#3b3f4a] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}