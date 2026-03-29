'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { accounts } from '@/components/auth/mockusers'

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(1)
  const ref = useRef<HTMLDivElement>(null)

  const currentAccount =
    accounts.find((account) => account.id === selectedId) ?? accounts[0]

  useEffect(() => {
    async function loadCurrentUser() {
      // const res = await fetch('/api/me')
      // const data = await res.json()

      // if (data.user?.id) {
      //   setSelectedId(1)
      // }
      setSelectedId(1)
    }

    loadCurrentUser()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSwitchAccount(userId: number) {
    const res = await fetch('/api/switch-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })

    if (res.ok) {
      setSelectedId(userId)
      setOpen(false)
      window.location.reload()
    }
  }

  async function handleSignOut() {
    await fetch('/api/signout', {
      method: 'POST',
    })

    window.location.href = '/signin'
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-3 py-2 shadow-sm transition hover:bg-[#fafafa]"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#3b82f6,#1e1b4b)] text-sm font-semibold text-white">
          {currentAccount.initials}
        </div>

        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium text-[#111111]">{currentAccount.name}</p>
          <p className="text-xs text-[#7b7f8f]">{currentAccount.email}</p>
        </div>

        <svg
          className={`h-4 w-4 text-[#6b7280] transition ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 w-[430px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <div className="border-b border-black/8 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#3b82f6,#1e1b4b)] text-lg font-semibold text-white">
                {currentAccount.initials}
              </div>

              <div>
                <p className="text-[20px] font-semibold text-[#111111]">
                  {currentAccount.name}
                </p>
                <p className="mt-1 text-[15px] text-[#6f7380]">
                  {currentAccount.email}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-[15px] font-medium text-[#222222] transition hover:bg-[#f2f2f2]"
              >
                <span>⚙️</span>
                <span>Manage Account</span>
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] font-medium text-[#222222] transition hover:bg-[#fafafa]"
              >
                <span>↪</span>
                <span>Sign out</span>
              </button>
            </div>
          </div>

          <div className="border-b border-black/8">
            {accounts.map((account) => {
              const isSelected = account.id === selectedId

              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => handleSwitchAccount(account.id)}
                  className={`flex w-full items-center justify-between px-5 py-4 text-left transition ${
                    isSelected ? 'bg-[#f3f3f3]' : 'bg-white hover:bg-[#fafafa]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#93c5fd,#1d4ed8)] text-sm font-semibold text-white">
                      {account.initials}
                    </div>

                    <div>
                      <p className="text-[16px] font-medium text-[#111111]">
                        {account.name}
                      </p>
                      <p className="mt-1 text-[14px] text-[#6f7380]">
                        {account.email}
                      </p>
                    </div>
                  </div>

                  <span className="text-lg text-[#6f7380]">→</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-4 border-b border-black/8 bg-white px-5 py-5 text-left transition hover:bg-[#fafafa]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-lg text-[#6f7380]">
              +
            </div>
            <span className="text-[16px] font-medium text-[#6f7380]">
              Add account
            </span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-4 bg-white px-5 py-5 text-left transition hover:bg-[#fafafa]"
          >
            <span className="text-lg text-[#6f7380]">↪</span>
            <span className="text-[16px] font-medium text-[#6f7380]">
              Sign out of all accounts
            </span>
          </button>
        </div>
      ) : null}
    </div>
  )
}