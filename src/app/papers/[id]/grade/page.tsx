'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Upload, X, FileText, Loader2, Lock, RefreshCw,
  CheckCircle2, GraduationCap, Settings,
} from 'lucide-react';
import { Submission, GradeFile } from '@/components/papers/types';
import { normalizeStatus, isActive, StatusBadge } from '@/components/papers/StatusBadge';

function CircleProgress({ progress }: { progress: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 -rotate-90">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
      <circle cx="20" cy="20" r={r} fill="none" stroke="#0f172a" strokeWidth="4"
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ - (progress / 100) * circ}
        className="transition-all duration-300"
      />
    </svg>
  );
}

export default function GradePage() {
  const params = useParams();
  const router = useRouter();
  const paperId = Number(params.id);
  const [paperName, setPaperName] = React.useState<string>(`Paper #${paperId}`);

  React.useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('paperFileNames') ?? '{}');
    if (stored[paperId]) setPaperName(stored[paperId]);
  }, [paperId]);

  // ── Submissions ───────────────────────────────────────────────────────────
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = React.useState(true);
  const sseMap = React.useRef<Map<number, EventSource>>(new Map());

  const pollFallback = React.useCallback((submissionId: number) => {
    // Fallback polling when SSE is unavailable. Polls every 8s until terminal.
    const poll = async () => {
      try {
        const res = await fetch(`/api/ag/status?submission_id=${submissionId}&stream=false`, { cache: 'no-store' });
        if (!res.ok) return;
        const d = await res.json().catch(() => null);
        if (!d) return;
        const newStatus = normalizeStatus(d.validation_status ?? d.status ?? '');
        if (!newStatus) return;
        setSubmissions((prev) =>
          prev.map((s) =>
            s.submission_id === submissionId
              ? { ...s, validation_status: newStatus,
                  total_score: d.total_score ?? d.score ?? s.total_score,
                  max_score: d.max_score ?? d.total_max_score ?? s.max_score,
                  is_finalized: newStatus === 'FINALIZED' }
              : s
          )
        );
        if (!['SUCCESS', 'FINALIZED', 'FAILED', 'TIMEOUT'].includes(newStatus)) {
          setTimeout(poll, 8_000);
        }
      } catch {
        setTimeout(poll, 10_000);
      }
    };
    setTimeout(poll, 5_000);
  }, []);

  const startSSE = React.useCallback((submissionId: number) => {
    if (sseMap.current.has(submissionId)) return;
    const es = new EventSource(`/api/ag/status?submission_id=${submissionId}`);
    sseMap.current.set(submissionId, es);
    let receivedEvent = false;

    es.onmessage = (evt) => {
      receivedEvent = true;
      try {
        const d = JSON.parse(evt.data);
        const newStatus = normalizeStatus(d.validation_status ?? d.status ?? '');
        setSubmissions((prev) =>
          prev.map((s) =>
            s.submission_id === submissionId
              ? { ...s, validation_status: newStatus,
                  total_score: d.total_score ?? d.score ?? s.total_score,
                  max_score: d.max_score ?? d.total_max_score ?? s.max_score,
                  is_finalized: newStatus === 'FINALIZED' }
              : s
          )
        );
        if (['SUCCESS', 'FINALIZED', 'FAILED', 'TIMEOUT'].includes(newStatus)) {
          es.close(); sseMap.current.delete(submissionId);
        }
      } catch { /* ignore */ }
    };
    es.onerror = () => {
      es.close();
      sseMap.current.delete(submissionId);
      // If SSE failed before any event, fall back to polling
      if (!receivedEvent) pollFallback(submissionId);
    };
  }, [pollFallback]);

  const loadSubmissions = React.useCallback(async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch(`/api/ag/list-submissions?paper_id=${paperId}`, { cache: 'no-store' });
      const data = await res.json().catch(() => []);
      // Backend may return a raw array OR a wrapper object { submissions: [...] }
      const raw: Submission[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.submissions) ? data.submissions
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.results) ? data.results
        : [];
      const normalized = raw.map((s: Submission) => ({
        ...s,
        validation_status: normalizeStatus(s.validation_status),
        student_id: s.student_id && s.student_id !== 'NONE' ? s.student_id : null,
      }));
      setSubmissions(normalized);
      normalized.forEach((s: Submission) => { if (isActive(s.validation_status)) startSSE(s.submission_id); });
    } catch { setSubmissions([]); }
    finally { setLoadingSubs(false); }
  }, [paperId, startSSE]);

  React.useEffect(() => {
    loadSubmissions();
    return () => { sseMap.current.forEach((es) => es.close()); sseMap.current.clear(); };
  }, [loadSubmissions]);

  // ── Upload grading files ──────────────────────────────────────────────────
  const [gradeFiles, setGradeFiles] = React.useState<GradeFile[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleUpload = React.useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const picked = Array.from(fileList).slice(0, 20);
    const newFiles: GradeFile[] = picked.map((file, i) => ({ id: Date.now() + i, file, progress: 0, done: false }));
    setGradeFiles((prev) => [...newFiles, ...prev]);

    for (const gf of newFiles) {
      let p = 0;
      const ticker = setInterval(() => {
        p += Math.floor(Math.random() * 15) + 5;
        setGradeFiles((prev) => prev.map((f) => f.id === gf.id ? { ...f, progress: Math.min(p, 85) } : f));
      }, 200);

      try {
        const fd = new FormData();
        fd.append('file', gf.file);
        fd.append('paper_id', String(paperId));
        fd.append('exam_id', '1');
        const res = await fetch('/api/ag/upload-grade', { method: 'POST', body: fd });
        const data = await res.json().catch(() => null);
        clearInterval(ticker);
        if (!res.ok) throw new Error(data?.error || data?.message || 'Upload failed');

        const submissionId: number = data?.submission_id ?? data?.Assignment_id;
        setGradeFiles((prev) => prev.map((f) => f.id === gf.id ? { ...f, progress: 100, done: true } : f));

        if (submissionId) {
          const initStatus = normalizeStatus(data.validation_status ?? 'PENDING');
          setSubmissions((prev) => {
            if (prev.find((s) => s.submission_id === submissionId)) return prev;
            return [{ submission_id: submissionId, student_id: gf.file.name.replace(/\.[^.]+$/, ''),
              validation_status: initStatus, total_score: null, max_score: null, is_finalized: false }, ...prev];
          });
          if (isActive(initStatus)) startSSE(submissionId);
        }
      } catch (err) {
        clearInterval(ticker);
        setGradeFiles((prev) => prev.map((f) => f.id === gf.id ? { ...f, progress: 0, error: err instanceof Error ? err.message : 'Upload failed' } : f));
      }
    }
  }, [paperId, startSSE]);

  // ── Finalize ──────────────────────────────────────────────────────────────
  const [finalizing, setFinalizing] = React.useState<number | null>(null);

  const finalizeSubmission = async (submissionId: number) => {
    setFinalizing(submissionId);
    try {
      const res = await fetch('/api/ag/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId }),
      });
      if (!res.ok) return;
      setSubmissions((prev) => prev.map((s) =>
        s.submission_id === submissionId ? { ...s, validation_status: 'FINALIZED', is_finalized: true } : s
      ));
    } catch { /* ignore */ }
    finally { setFinalizing(null); }
  };

  const finalizedCount = submissions.filter((s) => s.validation_status === 'FINALIZED').length;
  const successCount = submissions.filter((s) => s.validation_status === 'SUCCESS').length;

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-6 py-8 text-slate-900 md:px-10">
      <div className="space-y-6">

        {/* Breadcrumb */}
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
          <span className="text-sm font-semibold text-slate-900">Grade</span>
        </div>

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Grade Submissions</h1>
            <p className="mt-0.5 text-sm text-slate-500">Upload student answer sheets and review AI grading</p>
          </div>
          <button
            onClick={() => router.push(`/papers/${paperId}/setup`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" /> Setup
          </button>
        </div>

        {/* Stats + Upload — side by side on wide screens */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">

        {/* Left: Stats */}
        <div className="grid grid-cols-3 gap-3 content-start">
          {[
            { label: 'Total', value: submissions.length, color: 'text-slate-900' },
            { label: 'Ready to review', value: successCount, color: 'text-sky-700' },
            { label: 'Finalized', value: finalizedCount, color: 'text-violet-700' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Right: Upload zone */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Upload Answer Sheets</p>
          <label
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); }}
            className={`block cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isDragging ? 'border-slate-400 bg-white' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Upload className="h-5 w-5 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-700">Drop student answer sheets here</p>
              <p className="text-xs text-slate-400">PDF / DOCX · up to 20 files · 5 MB each</p>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                className="mt-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Browse files
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </label>

          {gradeFiles.length > 0 && (
            <div className="mt-2 space-y-2">
              {gradeFiles.map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                    <CircleProgress progress={f.progress} />
                    <Upload className="absolute h-3 w-3 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{f.file.name}</p>
                    <p className="text-xs text-slate-400">
                      {f.error ? <span className="text-rose-500">{f.error}</span>
                        : f.done ? <span className="text-emerald-600">Uploaded · grading in progress</span>
                        : `Uploading ${f.progress}%`}
                    </p>
                  </div>
                  <button type="button" onClick={() => setGradeFiles((p) => p.filter((g) => g.id !== f.id))} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>{/* end stats+upload grid */}

        {/* Submissions table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Submissions</h2>
            <button onClick={loadSubmissions} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loadingSubs ? (
            <div className="flex flex-col items-center py-12 text-slate-400">
              <Loader2 className="mb-2 h-6 w-6 animate-spin" />
              <p className="text-sm">Loading submissions…</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-slate-400">
              <GraduationCap className="mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">No submissions yet</p>
              <p className="text-xs">Upload student answer sheets above to begin</p>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] uppercase tracking-widest text-slate-500">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const norm = sub.validation_status;
                  const canReview = norm === 'SUCCESS' || norm === 'FINALIZED';
                  const canFinalize = norm === 'SUCCESS' && !sub.is_finalized;
                  const isFinalizing = finalizing === sub.submission_id;
                  const scoreStr = sub.total_score !== null && sub.max_score !== null
                    ? `${sub.total_score} / ${sub.max_score}`
                    : sub.total_score !== null ? String(sub.total_score) : '—';

                  return (
                    <tr key={sub.submission_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{sub.student_id ?? `Submission #${sub.submission_id}`}</p>
                        <p className="text-xs text-slate-400">#{sub.submission_id}</p>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={norm} /></td>
                      <td className="px-5 py-3.5 tabular-nums text-slate-700">{scoreStr}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {canReview && (
                            <button
                              type="button"
                              onClick={() => router.push(`/papers/${paperId}/grade/${sub.submission_id}`)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                              <FileText className="h-3.5 w-3.5" /> Review
                            </button>
                          )}
                          {canFinalize && (
                            <button
                              type="button"
                              disabled={isFinalizing}
                              onClick={() => finalizeSubmission(sub.submission_id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
                            >
                              {isFinalizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Lock className="h-3.5 w-3.5" /> Finalize</>}
                            </button>
                          )}
                          {norm === 'FINALIZED' && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Done
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </main>
  );
}
