'use client'

import { useEffect, useState } from 'react'

type CurrentUser = {
  id: number
  name: string
  email: string
  initials: string
}

export default function DashboardProfile() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' })
        if (!res.ok) throw new Error('No user')
        const data = await res.json()

        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          initials:
            (data.name || 'U')
              .split(' ')
              .map((n: string) => n[0])
              .join('') || 'U',
        })
      } catch (err) {
        console.error('Failed to load user', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  if (loading) {
    return <p className="mt-8 text-[16px] text-[#7b7f8f]">Loading...</p>
  }

  if (!user) {
    return (
      <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-[16px] text-[#7b7f8f]">No signed-in user found.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="flex items-center justify-between border-b border-black/8 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#93c5fd,#1d4ed8)] text-sm font-semibold text-white">
            {user.initials}
          </div>
          <div>
            <p className="text-[14px] text-[#7b7f8f]">Profile</p>
            <p className="mt-1 text-[18px] font-medium text-[#111111]">
              {user.name}
            </p>
          </div>
        </div>

        <button className="rounded-xl px-4 py-2 text-[14px] font-medium text-[#111111]">
          Update profile
        </button>
      </div>

      <div className="border-b border-black/8 pb-6">
        <div className="grid grid-cols-[220px_1fr] gap-4">
          <p className="text-[14px] font-medium text-[#111111]">Email addresses</p>
          <div>
            <p className="text-[17px] font-medium text-[#111111]">{user.email}</p>
            <button className="mt-3 text-[15px] font-medium text-[#3b3f4a]">
              + Add email address
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-black/8 pb-6">
        <div className="grid grid-cols-[220px_1fr] gap-4">
          <p className="text-[14px] font-medium text-[#111111]">Phone number</p>
          <div>
            <p className="text-[17px] font-medium text-[#111111]">+1 (555) 123-4567</p>
            <button className="mt-3 text-[15px] font-medium text-[#3b3f4a]">
              + Add phone number
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-[220px_1fr] gap-4">
          <p className="text-[14px] font-medium text-[#111111]">Connected accounts</p>
          <div>
            <p className="text-[17px] font-medium text-[#111111]">
              Google <span className="text-[#7b7f8f]">· {user.email}</span>
            </p>
            <button className="mt-3 text-[15px] font-medium text-[#3b3f4a]">
              + Connect account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}