'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AuthLayout from '@/components/auth/authlayout'
import AuthInput from '@/components/auth/authinput'
import AuthButton from '@/components/auth/authbutton'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to send reset link')
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email address and we'll send you a link to reset your password"
    >

      <form onSubmit={handleSubmit}>
        <AuthInput
          label="Email address"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error ? <p className="mb-4 text-sm text-red-500">{error}</p> : null}

        <AuthButton type="submit">
          {loading ? 'Sending reset link...' : 'Send Reset Link'}
        </AuthButton>

        <div className="relative z-20 mt-8 text-center">
          <span className="text-[15px] text-[#7b7f8f]">Remember your password? </span>
          <Link
            href="/signin"
            className="relative z-20 inline-block cursor-pointer font-medium text-[#3b3f4a] hover:underline"
          >
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}