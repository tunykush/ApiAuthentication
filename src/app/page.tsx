import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import {
  Upload,
  ClipboardList,
  Sparkles,
  CheckSquare,
  ChevronDown,
  ArrowRight,
  GraduationCap,
  Clock,
  BarChart3,
  ShieldCheck,
  Building2,
} from 'lucide-react';

async function isLoggedIn(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return false;
    const decoded = jwtDecode<{ exp?: number }>(token);
    const now = Math.floor(Date.now() / 1000);
    return !decoded.exp || decoded.exp > now;
  } catch {
    return false;
  }
}

/* ─── Data ─────────────────────────────────────────────── */

const steps = [
  { icon: Upload, label: 'Upload Assignments', desc: 'Drag & drop student submissions in PDF or DOCX.' },
  { icon: ClipboardList, label: 'Set your Rubric', desc: 'Define marking criteria once. Reuse every semester.' },
  { icon: Sparkles, label: 'AI grades & suggests', desc: 'Our model scores each answer and writes feedback.' },
  { icon: CheckSquare, label: 'Review & Approve', desc: 'Accept, edit or override — you have the final say.' },
];

const bigStats = [
  { value: '5.7×', label: 'Scoring workload reduction', sub: 'vs manual grading' },
  { value: '50+', label: 'Direct hours saved per term', sub: 'per lecturer' },
  { value: '8 hrs', label: 'Average turnaround time', sub: 'down from 3 days' },
  { value: '46.4', label: 'NPS score from early users', sub: 'across 12 institutions' },
];

const calloutStats = [
  { value: '10+ hrs', label: 'saved every exam cycle' },
  { value: '1 in 4', label: 'errors caught by AI review' },
  { value: 'After-hours', label: 'grading — finally optional' },
];

const featureCards = [
  {
    icon: Clock,
    title: 'Save up to 80% of grading time',
    desc: 'Batch-process entire classes in minutes, not days. Focus on teaching, not paperwork.',
  },
  {
    icon: BarChart3,
    title: 'Consistent, unbiased feedback quality',
    desc: 'Rubric-anchored scoring eliminates fatigue bias and keeps grades fair across all submissions.',
  },
  {
    icon: ShieldCheck,
    title: 'Handle large classes with ease',
    desc: 'From 30 to 3 000 students — Edgen AI scales to your institution without slowing down.',
  },
];

const faqs = [
  {
    q: 'How does Edgen AI grade assignments?',
    a: 'Edgen AI uses large language models fine-tuned on academic rubrics. It reads each submission, maps answers to your criteria, assigns partial marks, and writes per-criterion feedback — all in seconds.',
  },
  {
    q: 'How does the grading process work?',
    a: 'Upload → configure rubric → one-click grade. Each submission gets an AI-suggested score and comments. You review, tweak if needed, then approve. Export to your LMS with a single click.',
  },
  {
    q: 'What if I disagree with the AI?',
    a: 'You always have the final say. Override any score or comment inline. The system learns from your corrections over time, improving accuracy for future batches.',
  },
  {
    q: 'How much does Edgen AI cost?',
    a: 'We offer a free tier for up to 50 submissions per month. Institutional plans are priced per seat — contact us for a quote tailored to your class sizes.',
  },
];

/* ─── Sub-components ────────────────────────────────────── */

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-slate-200 last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-semibold text-slate-900 marker:hidden">
        {q}
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <p className="pb-5 text-sm leading-relaxed text-slate-500">{a}</p>
    </details>
  );
}

/* ─── Page ──────────────────────────────────────────────── */

export default async function HomePage() {
  const loggedIn = await isLoggedIn();
  if (loggedIn) redirect('/papers');
  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white px-6 pb-20 pt-20 text-center md:px-8 md:pt-28">
        {/* subtle grid bg */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-size-[48px_48px] opacity-60"
        />

        <div className="relative mx-auto max-w-3xl">
          {/* badge */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            <GraduationCap className="h-3.5 w-3.5 text-slate-900" />
            Edgen AI — Academic Grading Platform
          </span>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
            Grade Assignments{' '}
            <span className="text-slate-500">10x Faster</span> with AI
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-500 md:text-lg">
            Upload exam papers, configure rubrics, and let AI grade every submission — with feedback educators actually trust.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-700"
            >
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Create free account
            </Link>
          </div>
        </div>
      </section>

      {/* ── QUICK STATS STRIP ────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 px-6 py-8 md:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-extrabold text-slate-900">7+ hrs</p>
            <p className="mt-1 text-xs text-slate-500">saved per assignment batch</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">98%</p>
            <p className="mt-1 text-xs text-slate-500">feedback accuracy rate</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">5×</p>
            <p className="mt-1 text-xs text-slate-500">faster than manual grading</p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="bg-white px-6 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">How it works</p>
          <h2 className="mt-3 text-center text-2xl font-bold text-slate-900 md:text-3xl">
            Four steps to a graded class
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, label, desc }, i) => (
              <div key={label} className="relative rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <span className="absolute right-4 top-4 text-xs font-bold text-slate-200">0{i + 1}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-900">{label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BIG STATS ────────────────────────────────────── */}
      <section className="bg-slate-50 px-6 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bigStats.map(({ value, label, sub }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-3xl font-extrabold text-slate-900">{value}</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
              </div>
            ))}
          </div>

          {/* callout row */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {calloutStats.map(({ value, label }) => (
              <div key={value} className="rounded-xl bg-slate-900 p-5 text-white">
                <p className="text-2xl font-extrabold">{value}</p>
                <p className="mt-1 text-xs text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIME SAVED SECTION ───────────────────────────── */}
      <section className="bg-white px-6 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Impact</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">Time saved, life reclaimed</h2>
          <p className="mt-3 max-w-lg text-sm text-slate-500">
            Educators using Edgen AI report reclaiming evenings and weekends they used to spend buried in marking.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* left card */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <p className="text-sm font-bold text-slate-900">Average time per assignment (pairs)</p>
              <div className="mt-6 space-y-4">
                {[
                  { label: 'Without Edgen AI', pct: 88, mins: '22 min' },
                  { label: 'With Edgen AI', pct: 18, mins: '4 min' },
                ].map(({ label, pct, mins }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>{label}</span><span className="font-semibold text-slate-900">{mins}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2.5 rounded-full bg-slate-900"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* right card */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <p className="text-sm font-bold text-slate-900">Who saves the most time</p>
              <div className="mt-6 space-y-3">
                {[
                  { role: 'University lecturers', pct: 82 },
                  { role: 'High-school teachers', pct: 71 },
                  { role: 'Teaching assistants', pct: 68 },
                  { role: 'Online educators', pct: 59 },
                ].map(({ role, pct }) => (
                  <div key={role} className="flex items-center gap-3 text-xs">
                    <span className="w-36 shrink-0 text-slate-600">{role}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-slate-800" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right font-semibold text-slate-900">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE CARDS (dark) ─────────────────────────── */}
      <section className="bg-slate-900 px-6 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, desc }) => (
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

      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section className="bg-slate-800 px-6 py-14 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-xl font-bold text-white md:text-2xl">
              Reclaim your time. Revolutionize your classroom.
            </h2>
            <p className="mt-2 text-sm text-slate-400">Join hundreds of educators already saving hours every week.</p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-md transition hover:bg-slate-100"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── YOU STAY IN CONTROL ──────────────────────────── */}
      <section className="bg-white px-6 py-20 md:px-8">
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:items-center">
          {/* visual placeholder */}
          <div className="order-2 md:order-1 rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-900">
              <ShieldCheck className="h-9 w-9 text-white" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-800">Full human oversight</p>
            <p className="mt-1 text-xs text-slate-500">Every AI decision is auditable and editable.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/signin"
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sign up free
              </Link>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Control</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">You stay in control, always</h2>
            <ul className="mt-6 space-y-4">
              {[
                'Override any AI score or comment with one click',
                'Review flagged submissions before they go live',
                'Set confidence thresholds — low-confidence items escalate to you',
                'Full audit log of every AI and human decision',
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

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="bg-slate-50 px-6 py-20 md:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">FAQ</p>
          <h2 className="mt-3 text-center text-2xl font-bold text-slate-900 md:text-3xl">Common questions</h2>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white px-6">
            {faqs.map((item) => (
              <FaqItem key={item.q} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── ENTERPRISE ───────────────────────────────────── */}
      <section className="bg-white px-6 py-20 md:px-8">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Enterprise</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">Scale AI Across Your Institution</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Edgen AI offers institutional plans with SSO, custom rubric libraries, LMS integrations, and dedicated support. Trusted by universities and schools worldwide.
            </p>
            <Link
              href="/waitlist"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Contact sales <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {[
              { icon: Building2, title: 'Business Automation', desc: 'Integrate grading into your existing LMS and workflows with our REST API and webhooks.' },
              { icon: ShieldCheck, title: 'Enterprise Security', desc: 'SOC 2-ready infrastructure, data residency options, and role-based access control.' },
              { icon: BarChart3, title: 'Analytics & Reporting', desc: 'Aggregate insights across departments — track grading throughput, consistency, and outcomes.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white px-6 py-8 text-center md:px-8">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Edgen AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
