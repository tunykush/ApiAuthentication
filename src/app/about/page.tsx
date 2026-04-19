import Link from 'next/link'
import {
  GraduationCap,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Clock,
  CheckSquare,
  Building2,
  Users,
  Lightbulb,
} from 'lucide-react'

/* ─── Data ─────────────────────────────────────────────── */

const stats = [
  { value: '12+', label: 'Institutions onboarded', sub: 'across 4 countries' },
  { value: '50K+', label: 'Submissions graded', sub: 'and counting' },
  { value: '5.7×', label: 'Workload reduction', sub: 'vs manual grading' },
  { value: '46.4', label: 'NPS from early users', sub: 'industry-leading satisfaction' },
]

const values = [
  {
    icon: ShieldCheck,
    title: 'Human first',
    desc: 'AI assists — educators decide. Every score is auditable, overridable, and yours to own.',
  },
  {
    icon: Sparkles,
    title: 'Relentless accuracy',
    desc: 'We fine-tune on real academic rubrics, not generic benchmarks. Quality over speed, always.',
  },
  {
    icon: BarChart3,
    title: 'Radical transparency',
    desc: 'We show our reasoning. Every grade comes with cited evidence so educators can trust or challenge it.',
  },
  {
    icon: Clock,
    title: 'Time is sacred',
    desc: 'We obsess over minutes saved. Evenings and weekends belong to educators, not marking piles.',
  },
  {
    icon: Lightbulb,
    title: 'Continuous learning',
    desc: 'Your overrides train our model. The more you correct, the sharper Edgen AI gets for your context.',
  },
  {
    icon: Building2,
    title: 'Built for institutions',
    desc: 'Enterprise-grade security, SSO, LMS integrations, and dedicated support from day one.',
  },
]

const team = [
  {
    name: 'Aisha Rahman',
    role: 'Co-founder & CEO',
    bg: 'bg-slate-800',
    initial: 'A',
    bio: 'Former lecturer at NUS. Spent 12 years grading before deciding there had to be a better way.',
  },
  {
    name: 'Marcus Lim',
    role: 'Co-founder & CTO',
    bg: 'bg-slate-600',
    initial: 'M',
    bio: 'ML researcher with a focus on document understanding and rubric-aligned scoring models.',
  },
  {
    name: 'Priya Nair',
    role: 'Head of Product',
    bg: 'bg-slate-700',
    initial: 'P',
    bio: 'EdTech veteran. Shipped products used by 500K+ students across Southeast Asia.',
  },
  {
    name: 'Jordan Osei',
    role: 'Head of Customer Success',
    bg: 'bg-slate-500',
    initial: 'J',
    bio: 'Worked with university registrars for 8 years. Knows exactly where grading workflows break down.',
  },
]

const milestones = [
  { year: '2022', event: 'Founded in Singapore — frustrated lecturers meet frustrated ML researchers.' },
  { year: '2023', event: 'Launched private beta with 3 pilot universities. 10,000 submissions graded in month one.' },
  { year: '2024', event: 'Raised seed round. Expanded to 12 institutions across Singapore, Australia, and the UK.' },
  { year: '2025', event: 'Released enterprise tier with SSO, LMS integrations, and custom rubric libraries.' },
  { year: 'Now', event: 'Grading 50,000+ submissions a month. Still obsessed with saving educators time.' },
]

/* ─── Page ──────────────────────────────────────────────── */

export default function AboutPage() {
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
            Edgen AI — Our Story
          </span>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Built by educators,{' '}
            <span className="text-slate-500">for educators</span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-slate-500 md:text-lg">
            We started Edgen AI because we lived the problem — late nights buried in marking, rubrics that didn't survive contact with real submissions, and feedback that never had the depth students deserved.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-700"
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 px-6 py-8 md:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {stats.map(({ value, label, sub }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-slate-900">{value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-700">{label}</p>
              <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION ──────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 md:px-8">
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:items-center">
          {/* visual */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-900">
              <GraduationCap className="h-9 w-9 text-white" />
            </div>
            <p className="mt-6 text-sm font-bold text-slate-900">Our mission</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 max-w-xs mx-auto">
              Give every educator the time and insight to focus on what actually matters — teaching.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <div className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">
                5× faster grading
              </div>
              <div className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
                100% auditable
              </div>
            </div>
          </div>

          {/* copy */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Mission</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">
              We believe grading should never be a barrier to great teaching
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Marking is necessary — but spending 20 minutes per paper, multiplied by 150 students, is not. That time comes at the cost of lesson prep, student support, and personal wellbeing.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Edgen AI doesn't replace the educator. It eliminates the mechanical work so educators can spend more time on the parts only a human can do — nuanced feedback, pastoral care, and genuine connection with students.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                'Reduce grading time by up to 80%',
                'Maintain consistent, rubric-anchored standards',
                'Surface insights across whole-class performance',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── TIMELINE ─────────────────────────────────────── */}
      <section className="bg-slate-50 px-6 py-20 md:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">Journey</p>
          <h2 className="mt-3 text-center text-2xl font-bold text-slate-900 md:text-3xl">
            How we got here
          </h2>

          <div className="mt-12 space-y-0">
            {milestones.map(({ year, event }, i) => (
              <div key={year} className="relative flex gap-6">
                {/* line */}
                <div className="flex flex-col items-center">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="mt-1 w-px flex-1 bg-slate-200 mb-1" />
                  )}
                </div>
                {/* content */}
                <div className="pb-8">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{year}</p>
                  <p className="mt-1 text-sm text-slate-700 leading-relaxed">{event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES (dark) ─────────────────────────────────── */}
      <section className="bg-slate-900 px-6 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">Values</p>
          <h2 className="mt-3 text-center text-2xl font-bold text-white md:text-3xl">
            What we stand for
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-slate-700 bg-slate-800 p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="mt-5 text-sm font-bold text-white">{title}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">Team</p>
          <h2 className="mt-3 text-center text-2xl font-bold text-slate-900 md:text-3xl">
            The people behind Edgen AI
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-slate-500">
            A small, focused team with deep roots in both education and machine learning.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map(({ name, role, bg, initial, bio }) => (
              <div key={name} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${bg} text-base font-bold text-white`}>
                  {initial}
                </div>
                <p className="mt-4 text-sm font-bold text-slate-900">{name}</p>
                <p className="text-xs font-semibold text-slate-400">{role}</p>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOIN US ───────────────────────────────────────── */}
      <section className="bg-slate-50 px-6 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-2">
            {/* hiring */}
            <div className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">We're hiring</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  We're a small team looking for people who care deeply about education and craft. If that's you, get in touch.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:underline"
                >
                  See open roles <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* enterprise */}
            <div className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Partner with us</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  LMS providers, assessment publishers, and EdTech platforms — let's build something together.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:underline"
                >
                  Get in touch <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section className="bg-slate-800 px-6 py-14 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-xl font-bold text-white md:text-2xl">
              Ready to reclaim your time?
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Join hundreds of educators already saving hours every week with Edgen AI.
            </p>
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
