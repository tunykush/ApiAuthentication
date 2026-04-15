'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Upload, Loader2, Lock, BookOpen, ChevronRight,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import { normalizeStatus, isTerminal, isActive, StatusBadge } from '@/components/papers/StatusBadge';

function extractMsg(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const d = data as Record<string, unknown>;
  if (typeof d.error === 'string') return d.error;
  if (d.error && typeof d.error === 'object') {
    const e = d.error as Record<string, unknown>;
    if (typeof e.message === 'string') return e.message;
  }
  if (typeof d.message === 'string') return d.message;
  if (typeof d.detail === 'string') return d.detail;
  return JSON.stringify(data);
}

export default function SetupPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = Number(params.id);
  const [paperName, setPaperName] = React.useState<string>(`Paper #${paperId}`);

  React.useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('paperFileNames') ?? '{}');
    if (stored[paperId]) setPaperName(stored[paperId]);
  }, [paperId]);

  // ── Paper status ───────────────────────────────────────────────────────────
  const [paperStatus, setPaperStatus] = React.useState<string>('PENDING');
  const [paperFinalized, setPaperFinalized] = React.useState(false);
  const paperPollRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/paper-status?paper_id=${paperId}`, { cache: 'no-store' });
        const d = await res.json().catch(() => null);
        const raw = d?.validation_status ?? d?.ingestion_status ?? d?.status ?? '';
        const s = normalizeStatus(raw);
        if (!cancelled) {
          setPaperStatus(s);
          if (d?.is_finalized) setPaperFinalized(true);
          if (s !== 'SUCCESS') paperPollRef.current = setTimeout(poll, 8_000);
        }
      } catch {
        if (!cancelled) paperPollRef.current = setTimeout(poll, 8_000);
      }
    };
    poll();
    return () => { cancelled = true; if (paperPollRef.current) clearTimeout(paperPollRef.current); };
  }, [paperId]);

  // ── Rubric ────────────────────────────────────────────────────────────────
  const [rubricStatus, setRubricStatus] = React.useState<string | null>(null);
  const [rubricChecking, setRubricChecking] = React.useState(true);
  const [rubricCreating, setRubricCreating] = React.useState(false);
  const [rubricFinalizing, setRubricFinalizing] = React.useState(false);
  const [rubricMsg, setRubricMsg] = React.useState<{ ok: boolean; warn?: boolean; text: string } | null>(null);
  const rubricSseRef = React.useRef<EventSource | null>(null);

  const startRubricSSE = React.useCallback(() => {
    rubricSseRef.current?.close();
    const es = new EventSource(`/api/rh/status?paper_id=${paperId}&stream=true`);
    rubricSseRef.current = es;
    es.onmessage = (evt) => {
      try {
        const d = JSON.parse(evt.data);
        const raw = d.status ?? d.validation_status ?? d.rubric_status ?? d.state ?? '';
        const s = normalizeStatus(raw);
        setRubricStatus(s);
        if (isTerminal(s)) { es.close(); rubricSseRef.current = null; }
      } catch { /* ignore */ }
    };
    es.onerror = () => { es.close(); rubricSseRef.current = null; };
  }, [paperId]);

  // Load existing rubric status on mount
  React.useEffect(() => {
    let cancelled = false;
    setRubricChecking(true);
    (async () => {
      try {
        const res = await fetch(`/api/rh/status?paper_id=${paperId}`, { cache: 'no-store' });
        if (cancelled) return;
        if (res.ok) {
          const d = await res.json().catch(() => null);
          if (d && !cancelled) {
            const raw = d.status ?? d.validation_status ?? d.rubric_status ?? d.state ?? '';
            const s = normalizeStatus(raw);
            if (s) setRubricStatus(s);
            if (s && s !== 'FAILED') setPaperFinalized(true);
            if (isActive(s)) startRubricSSE();
          }
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setRubricChecking(false); }
    })();
    return () => {
      cancelled = true;
      rubricSseRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId]);

  const createRubric = async () => {
    setRubricCreating(true);
    setRubricMsg(null);
    try {
      if (!paperFinalized) {
        const fRes = await fetch('/api/qh/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paper_id: paperId }),
        });
        if (!fRes.ok) {
          const fd = await fRes.json().catch(() => null);
          throw new Error(fd?.error ?? fd?.message ?? 'Paper finalization failed');
        }
        setPaperFinalized(true);
      }
      const res = await fetch('/api/rh/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: paperId }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 412) {
        setRubricMsg({ ok: false, warn: true, text: 'Paper is still being ingested. Please wait 1–2 minutes and try again.' });
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? data?.message ?? 'Create failed');
      setRubricStatus('PENDING');
      startRubricSSE();
    } catch (err) {
      setRubricMsg({ ok: false, text: err instanceof Error ? err.message : 'Create failed' });
    } finally {
      setRubricCreating(false);
    }
  };


  const finalizeRubric = async () => {
    setRubricFinalizing(true);
    setRubricMsg(null);
    try {
      const res = await fetch('/api/rh/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: paperId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMsg(data, 'Finalize failed'));
      setRubricStatus('FINALIZED');
      setRubricMsg({ ok: true, text: 'Rubric finalized.' });
    } catch (err) {
      setRubricMsg({ ok: false, text: err instanceof Error ? err.message : 'Finalize failed' });
    } finally {
      setRubricFinalizing(false);
    }
  };

  // ── Sample Answer ─────────────────────────────────────────────────────────
  const [shPaperId, setShPaperId] = React.useState<number | null>(null);
  const [shFileName, setShFileName] = React.useState<string | null>(null);
  const [shStatus, setShStatus] = React.useState<string | null>(null);
  const [shUploading, setShUploading] = React.useState(false);
  const [shFinalizing, setShFinalizing] = React.useState(false);
  const [shMsg, setShMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const shFileRef = React.useRef<HTMLInputElement | null>(null);
  // Generation counter — increment to cancel all previous polling loops
  const shPollGenRef = React.useRef(0);

  const pollShStatus = React.useCallback((id: number) => {
    const gen = ++shPollGenRef.current; // snapshot current generation
    const poll = async () => {
      if (gen !== shPollGenRef.current) return; // stale — a newer upload started
      try {
        const r = await fetch(`/api/sh/status?paper_id=${id}`, { cache: 'no-store' });
        const d = await r.json().catch(() => null);
        if (gen !== shPollGenRef.current) return;
        if (!r.ok) {
          if (r.status !== 404) setTimeout(poll, 8_000);
          return;
        }
        const raw =
          d?.status ??
          d?.validation_status ??
          d?.ingestion_status ??
          d?.sample_status ??
          d?.state ??
          '';
        const s = normalizeStatus(raw);
        if (s) setShStatus(s);
        if (!isTerminal(s)) setTimeout(poll, 6_000);
      } catch { if (gen === shPollGenRef.current) setTimeout(poll, 8_000); }
    };
    poll();
  }, []);

  // Load persisted sample answer and fetch current status on mount
  React.useEffect(() => {
    let cancelled = false;

    // Restore from localStorage immediately so UI doesn't flicker
    const storedId = localStorage.getItem(`shId_${paperId}`);
    const storedName = localStorage.getItem(`shName_${paperId}`);
    if (storedName) setShFileName(storedName);

    (async () => {
      // 1. Try fetching from API first (recovers state even if localStorage is cleared)
      try {
        const res = await fetch(`/api/sh/get?paper_id=${paperId}`, { cache: 'no-store' });
        if (!cancelled && res.ok) {
          const d = await res.json().catch(() => null);
          const raw =
            d?.status ??
            d?.validation_status ??
            d?.ingestion_status ??
            d?.sample_status ??
            d?.state ??
            '';
          const s = normalizeStatus(raw);
          const id: number = d?.paper_id ?? d?.sh_id ?? d?.id ?? paperId;
          if (id && !cancelled) {
            setShPaperId(id);
            if (s) setShStatus(s);
            if (!isTerminal(s)) pollShStatus(id);
          }
          return;
        }
      } catch { /* fall through to localStorage */ }

      // 2. Fall back to localStorage
      if (cancelled) return;
      if (!storedId) return;
      const id = Number(storedId);
      if (!id) return;
      setShPaperId(id);
      pollShStatus(id);
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId]);

  const uploadSampleAnswer = async (file: File) => {
    // Cancel any in-flight status polling from a previous upload
    shPollGenRef.current += 1;
    setShUploading(true);
    setShMsg(null);
    setShStatus(null); // clear stale status so UI resets cleanly
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('exam_id', '1');
      const res = await fetch('/api/sh/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMsg(data, 'Upload failed'));
      // prefer sh_id (sample answer ID) over paper_id; fall back to paper_id
      const id: number = data?.sh_id ?? data?.paper_id ?? data?.id ?? paperId;
      if (id) {
        setShPaperId(id);
        setShStatus('PENDING');
        setShFileName(file.name);
        localStorage.setItem(`shId_${paperId}`, String(id));
        localStorage.setItem(`shName_${paperId}`, file.name);
        setTimeout(() => pollShStatus(id), 3000);
      }
      setShMsg({ ok: true, text: 'Sample answer uploaded successfully.' });
    } catch (err) {
      setShMsg({ ok: false, text: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      setShUploading(false);
    }
  };

  const finalizeSampleAnswer = async () => {
    if (!shPaperId) return;
    setShFinalizing(true);
    setShMsg(null);
    try {
      const res = await fetch('/api/sh/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: shPaperId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractMsg(data, 'Finalize failed'));
      setShStatus('FINALIZED');
      setShMsg({ ok: true, text: 'Sample answer finalized.' });
    } catch (err) {
      setShMsg({ ok: false, text: err instanceof Error ? err.message : 'Finalize failed' });
    } finally {
      setShFinalizing(false);
    }
  };

  const rubricFinalized = rubricStatus === 'FINALIZED';
  const rubricReady = rubricStatus === 'SUCCESS' || rubricFinalized;
  const rubricActive = rubricStatus === 'PENDING' || rubricStatus === 'RUNNING';

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Breadcrumb + header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/papers')}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 hover:bg-white hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Papers
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-700 truncate">{paperName}</span>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-900">Setup</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Paper Setup</h1>
            <p className="mt-0.5 text-sm text-slate-500">Configure rubric and sample answer before grading</p>
          </div>
          {/* Paper status chip */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
            paperStatus === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {paperStatus === 'SUCCESS'
              ? <><CheckCircle2 className="h-3.5 w-3.5" /> Paper Ready</>
              : <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing…</>
            }
          </span>
        </div>

        {/* Step 1: Rubric */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                rubricFinalized ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'
              }`}>
                {rubricFinalized ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </div>
              <div>
                <p className="font-semibold text-slate-900">Rubric</p>
                <p className="text-xs text-slate-500">Auto-generated from your paper · editable before finalizing</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {rubricChecking ? (
                // Still fetching existing rubric — show neutral spinner, not "paper processing"
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking…
                </span>
              ) : rubricStatus ? (
                <StatusBadge status={rubricStatus} />
              ) : paperStatus !== 'SUCCESS' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Paper processing…
                </span>
              ) : (
                <button
                  type="button"
                  disabled={rubricCreating}
                  onClick={createRubric}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                >
                  {rubricCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                  Create Rubric
                </button>
              )}
            </div>
          </div>

          {rubricActive && (
            <div className="flex items-center gap-2 bg-sky-50 px-5 py-4 text-sm text-sky-700">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              Generating rubric from paper… this may take a moment.
            </div>
          )}

          {rubricStatus === 'FAILED' && (
            <div className="flex items-center justify-between bg-rose-50 px-5 py-4">
              <div className="flex items-center gap-2 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Rubric generation failed.
              </div>
              <button type="button" onClick={createRubric} className="text-sm font-medium text-rose-700 underline">Retry</button>
            </div>
          )}

          {rubricReady && !rubricFinalized && (
            <div className="px-5 pb-5">
              <button
                type="button"
                disabled={rubricFinalizing}
                onClick={finalizeRubric}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                {rubricFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Finalize Rubric
              </button>
              {rubricMsg && (
                <p className={`mt-2 text-sm ${rubricMsg.ok ? 'text-emerald-600' : rubricMsg.warn ? 'text-amber-600' : 'text-rose-600'}`}>
                  {rubricMsg.text}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Sample Answer */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                shStatus === 'FINALIZED' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {shStatus === 'FINALIZED' ? <CheckCircle2 className="h-4 w-4" /> : '2'}
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  Sample Answer
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">optional</span>
                </p>
                <p className="text-xs text-slate-500">Upload a model answer to improve grading accuracy</p>
              </div>
            </div>
            {shStatus && <StatusBadge status={shStatus} />}
          </div>

          <div className="space-y-3 px-5 py-4">
            {/* Uploaded file card */}
            {shFileName && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200">
                  <Upload className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{shFileName}</p>
                  <p className="text-xs text-slate-400">
                    {shStatus === 'FINALIZED' ? 'Finalized' : shStatus === 'SUCCESS' ? 'Ready' : 'Processing…'}
                  </p>
                </div>
                {shStatus === 'FINALIZED' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                {(shStatus === 'PENDING' || shStatus === 'RUNNING') && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />}
              </div>
            )}

            {/* Upload zone — always visible so user can replace even after finalize */}
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
              <Upload className="h-5 w-5 shrink-0 text-slate-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {shUploading
                    ? 'Uploading…'
                    : shFileName
                    ? 'Replace sample answer'
                    : 'Click to upload sample answer'}
                </p>
                <p className="text-xs text-slate-500">PDF / DOCX</p>
              </div>
              {shUploading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
              <input
                ref={shFileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={shUploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSampleAnswer(f); e.target.value = ''; }}
              />
            </label>

            {shStatus === 'SUCCESS' && (
              <button
                type="button"
                disabled={shFinalizing}
                onClick={finalizeSampleAnswer}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                {shFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Finalize Sample Answer
              </button>
            )}

            {shMsg && (
              <p className={`text-sm ${shMsg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{shMsg.text}</p>
            )}
          </div>
        </div>

        {/* CTA: Go to Grade */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="font-semibold text-slate-900">Ready to grade?</p>
            <p className="text-sm text-slate-500">Upload student submissions and start auto-grading</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/papers/${paperId}/grade`)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Start Grading
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </main>
  );
}
