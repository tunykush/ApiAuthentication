'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Mail,
  Clock,
  MessageSquare,
  Building2,
  ArrowRight,
  GraduationCap,
  CheckSquare,
} from 'lucide-react'

/* ─── Data ─────────────────────────────────────────────── */

const contactCards = [
  {
    icon: Mail,
    title: 'Email us',
    desc: "Send us a message and we'll get back to you promptly.",
    detail: 'support@edgenai.com',
  },
  {
    icon: Clock,
    title: 'Response time',
    desc: 'We aim to reply to all enquiries within one business day.',
    detail: '< 24 hours',
  },
  {
    icon: Building2,
    title: 'Enterprise & sales',
    desc: 'Need a custom institutional plan or integration support?',
    detail: 'sales@edgenai.com',
  },
]

const topics = [
  'General enquiry',
  'Technical support',
  'Billing & plans',
  'Enterprise / sales',
  'Partnership',
  'Other',
]

/* ─── Page ──────────────────────────────────────────────── */

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white px-6 pb-20 pt-20 text-center md:px-8 md:pt-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-size-[48px_48px] opacity-60"
        />

        <div className="relative mx-auto max-w-2xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            <GraduationCap className="h-3.5 w-3.5 text-slate-900" />
            Edgen AI — Support
          </span>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Get in <span className="text-slate-500">Touch</span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-slate-500 md:text-lg">
            Have a question, a feature request, or need help getting started? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* ── CONTACT CARDS ────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 px-6 py-14 md:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {contactCards.map(({ icon: Icon, title, desc, detail }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-900">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
              <p className="mt-3 text-xs font-semibold text-slate-700">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT FORM ─────────────────────────────────── */}
      <section className="bg-white px-6 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 md:grid-cols-2 md:items-start">

            {/* left — info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Contact</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">Send us a message</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Fill in the form and a member of our team will get back to you within one business day. For urgent issues, email us directly.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  'Describe your issue or request in detail',
                  'Include your institution name if applicable',
                  'Attach screenshots via email if needed',
                  'We reply to every message personally',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                    <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* right — form */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8">
              {submitted ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900">
                    <MessageSquare className="h-7 w-7 text-white" />
                  </div>
                  <p className="mt-5 text-base font-bold text-slate-900">Message sent!</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Thanks for reaching out. We'll reply within one business day.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', topic: '', message: '' }) }}
                    className="mt-8 rounded-lg border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Name */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Full name
                    </label>
                    <input
                      name="name"
                      type="text"
                      required
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Email address
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="jane@university.edu"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Topic
                    </label>
                    <select
                      name="topic"
                      required
                      value={form.topic}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    >
                      <option value="" disabled>Select a topic</option>
                      {topics.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Message
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      placeholder="Tell us how we can help…"
                      value={form.message}
                      onChange={handleChange}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-700"
                  >
                    Send message <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section className="bg-slate-800 px-6 py-14 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-xl font-bold text-white md:text-2xl">
              Not sure where to start?
            </h2>
            <p className="mt-2 text-sm text-slate-400">Create a free account and explore Edgen AI with no commitment.</p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-md transition hover:bg-slate-100"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white px-6 py-8 text-center md:px-8">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Edgen AI. All rights reserved.</p>
      </footer>

    </div>
  )
}
