'use client'

import Link from 'next/link'
import React from 'react'
import TopBar from '@/components/auth/topbar'
import DashboardProfile from '@/components/auth/dashboardprofile'
import { AiOutlineProfile } from "react-icons/ai";
import { AiOutlineSecurityScan } from "react-icons/ai";
import { AiOutlineMoneyCollect } from "react-icons/ai";
import { AiOutlineApi } from "react-icons/ai";


export default function DashboardPage() {
  const [active, setActive] = React.useState(0)
  const menus = [
    { label: 'Profile', icon: <AiOutlineProfile/> },
    { label: 'Security', icon: <AiOutlineSecurityScan /> },
    { label: 'Billing', icon: <AiOutlineMoneyCollect /> },
    { label: 'API keys', icon: <AiOutlineApi /> },
  ]
  const renderContent = () => {
    switch (active) {
      case 0:
        return <DashboardProfile />

      case 1:
        return (
          <div className="mt-6">
            <h2 className="text-xl font-semibold">Security</h2>
            <p className="mt-2 text-gray-500">
              Change password, enable 2FA...
            </p>
          </div>
        )

      case 2:
        return (
          <div className="mt-6">
            <h2 className="text-xl font-semibold">Billing</h2>
            <p className="mt-2 text-gray-500">
              Manage your payment methods and invoices.
            </p>
          </div>
        )

      case 3:
        return (
          <div className="mt-6">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <p className="mt-2 text-gray-500">
              Create and manage your API keys.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f3] text-[#111111]">
      <TopBar />

      <div className="px-6 py-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          
          <div className="grid min-h-[680px] md:grid-cols-[240px_1fr]">
            
            {/* Sidebar */}
            <aside className="border-r border-black/8 bg-[#fbfbfb] p-6">
              <h2 className="text-[18px] font-semibold">Account</h2>
              <p className="mt-1 text-[14px] text-[#7b7f8f]">
                Manage your account info.
              </p>

              <nav className="mt-8 space-y-2">
                {menus.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`flex w-full items-center cursor-pointer rounded-xl px-4 py-3 text-left text-[15px] font-medium ${
                      active === i
                        ? 'bg-[#f1f1f1] text-[#111111]'
                        : 'text-[#6a6e7b]'
                    }`}
                  >
                    {item.icon}&nbsp; {item.label}
                  </button>
                ))}
              </nav>

              <p className="mt-28 text-[14px] font-medium text-[#8a8d97]">
                Secured by custom auth UI
              </p>
            </aside>

            {/* Content */}
            <section className="p-8">
              <h1 className="text-[30px] font-semibold tracking-[-0.02em]">
                {menus[active].label}
              </h1>

              {/* Nội dung thay đổi */}
              {renderContent()}

              {/* Footer actions */}
              <div className="mt-10 flex gap-4">
                <Link
                  href="/"
                  className="rounded-xl border border-black/10 px-5 py-3 text-[15px] font-medium"
                >
                  Home
                </Link>

                <Link
                  href="/signin"
                  className="rounded-xl bg-[#2f313a] px-5 py-3 text-[15px] font-medium text-white"
                >
                  Sign out
                </Link>
              </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  )
}