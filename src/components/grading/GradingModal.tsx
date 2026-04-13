'use client';

import * as React from 'react';
import {
  X,
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Loader2,
  Lock,
  RefreshCw,
  Settings,
  BookOpen,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Submission = {
  submission_id: number;
  student_id: string | null;
  validation_status: string;
  total_score: number | null;
  max_score: number | null;
  is_finalized: boolean;
};

type QuestionResult = {
  canonical_question_id: string;
  display_label?: string;
  final_score: number;
  max_marks: number;
  raw_score_before_override?: number;
  needs_review?: boolean;
  evaluations?: { score: number; rationale: string }[];
};

type GradingData = {
  question_results?: QuestionResult[];
  totals?: { total_score?: number };
  total_max?: number;
};

type GradeFile = {
  id: number;
  file: File;
  progress: number;
  done: boolean;
  error?: string;
};

type Override = { score: string; reason: string };

// ─── Status helpers ───────────────────────────────────────────────────────────

function normalizeStatus(s: string): string {
  const u = (s ?? '').toUpperCase();
  if (['READY', 'COMPLETED', 'COMPLETE', 'DONE'].includes(u)) return 'SUCCESS';
  if (['ERROR', 'FAILURE'].includes(u)) return 'FAILED';
  if (['IN_PROGRESS', 'PROCESSING', 'QUEUED', 'STARTED'].includes(u)) return 'RUNNING';
  return u;
}

function isTerminal(s: string) {
  return ['SUCCESS', 'FINALIZED', 'FAILED', 'TIMEOUT'].includes(normalizeStatus(s));
}

function isActive(s: string) {
  return ['PENDING', 'RUNNING'].includes(normalizeStatus(s));
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const norm = normalizeStatus(status);
  type Cfg = { cls: string; icon: React.ReactNode; label: string };
  const map: Record<string, Cfg> = {
    PENDING: {
      cls: 'bg-amber-50 text-amber-700',
      icon: <Clock3 className="h-3.5 w-3.5" />,
      label: 'Pending',
    },
    RUNNING: {
      cls: 'bg-sky-50 text-sky-700',
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      label: 'Running',
    },
    SUCCESS: {
      cls: 'bg-emerald-50 text-emerald-700',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: 'Success',
    },
    FINALIZED: {
      cls: 'bg-violet-50 text-violet-700',
      icon: <Lock className="h-3.5 w-3.5" />,
      label: 'Finalized',
    },
    FAILED: {
      cls: 'bg-rose-50 text-rose-700',
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      label: 'Failed',
    },
    TIMEOUT: {
      cls: 'bg-orange-50 text-orange-700',
      icon: <Clock3 className="h-3.5 w-3.5" />,
      label: 'Timeout',
    },
  };
  const c = map[norm] ?? {
    cls: 'bg-slate-100 text-slate-600',
    icon: <Clock3 className="h-3.5 w-3.5" />,
    label: norm,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.cls}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

// ─── CircleProgress ───────────────────────────────────────────────────────────

function CircleProgress({ progress }: { progress: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="#0f172a"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - (progress / 100) * circ}
        className="transition-all duration-300"
      />
    </svg>
  );
}

// ─── GradingModal ─────────────────────────────────────────────────────────────

export default function GradingModal({
  paper,
  paperName,
  onClose,
}: {
  paper: { paper_id: number; validation_status: string; is_finalized?: boolean };
  paperName: string;
  onClose: () => void;
}) {
  const paperId = paper.paper_id;

  // View
  const [view, setView] = React.useState<'setup' | 'list' | 'review'>('setup');

  // ── Paper ingestion status ────────────────────────────────────────────────
  // validation_status from list-paper = upload OK, but ingestion (OCR/parse)
  // is tracked separately by /qh/{id}/status — always poll that endpoint.
  const [paperStatus, setPaperStatus] = React.useState<string>('PENDING');
  const [paperFinalized, setPaperFinalized] = React.useState<boolean>(paper.is_finalized ?? false);
  const paperPollRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/paper-status?paper_id=${paperId}`, { cache: 'no-store' });
        const d = await res.json().catch(() => null);
        // qh status endpoint may return ingestion_status, status, or validation_status
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
    return () => {
      cancelled = true;
      if (paperPollRef.current) clearTimeout(paperPollRef.current);
    };
  }, [paperId]);

  // ── Setup: Rubric ─────────────────────────────────────────────────────────
  const [rubricStatus, setRubricStatus] = React.useState<string | null>(null);
  const [rubricJson, setRubricJson] = React.useState<string>('');
  const [rubricCreating, setRubricCreating] = React.useState(false);
  const [rubricSaving, setRubricSaving] = React.useState(false);
  const [rubricFinalizing, setRubricFinalizing] = React.useState(false);
  const [rubricMsg, setRubricMsg] = React.useState<{ ok: boolean; warn?: boolean; text: string } | null>(null);
  const rubricSseRef = React.useRef<EventSource | null>(null);

  // Load existing rubric state on mount so user doesn't have to re-create every time
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/rh/status?paper_id=${paperId}`, { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const d = await res.json().catch(() => null);
        if (!d || cancelled) return;
        const s = normalizeStatus(d.status ?? d.validation_status ?? '');
        if (s) setRubricStatus(s);
        if (d.rubric) setRubricJson(JSON.stringify(d.rubric, null, 2));
        // If rubric exists, paper was already finalized
        if (s && s !== 'FAILED') setPaperFinalized(true);
        // If rubric is still in progress, resume SSE tracking
        if (isActive(s)) startRubricSSE();
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId]);

  // ── Setup: Sample Answer ─────────────────────────────────────────────────
  const [shPaperId, setShPaperId] = React.useState<number | null>(null);
  const [shStatus, setShStatus] = React.useState<string | null>(null);
  const [shUploading, setShUploading] = React.useState(false);
  const [shFinalizing, setShFinalizing] = React.useState(false);
  const [shMsg, setShMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const shFileRef = React.useRef<HTMLInputElement | null>(null);

  // Submissions list
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = React.useState(true);

  // Upload student answers
  const [gradeFiles, setGradeFiles] = React.useState<GradeFile[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Finalize
  const [finalizing, setFinalizing] = React.useState<number | null>(null);

  // Review
  const [reviewSub, setReviewSub] = React.useState<Submission | null>(null);
  const [gradingData, setGradingData] = React.useState<GradingData | null>(null);
  const [loadingReview, setLoadingReview] = React.useState(false);
  const [overrides, setOverrides] = React.useState<Record<string, Override>>({});
  const [saving, setSaving] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  // SSE map: submission_id → EventSource
  const sseMap = React.useRef<Map<number, EventSource>>(new Map());

  const startSSE = React.useCallback((submissionId: number) => {
    if (sseMap.current.has(submissionId)) return;
    const es = new EventSource(`/api/ag/status?submission_id=${submissionId}`);
    sseMap.current.set(submissionId, es);

    es.onmessage = (evt) => {
      try {
        const d = JSON.parse(evt.data);
        console.log('[ag-status SSE]', d);
        const newStatus = normalizeStatus(d.validation_status ?? d.status ?? '');
        setSubmissions((prev) =>
          prev.map((s) =>
            s.submission_id === submissionId
              ? {
                  ...s,
                  validation_status: newStatus,
                  total_score: d.total_score ?? d.score ?? s.total_score,
                  max_score: d.max_score ?? d.total_max_score ?? s.max_score,
                  is_finalized: newStatus === 'FINALIZED',
                }
              : s
          )
        );
        if (isTerminal(newStatus)) {
          es.close();
          sseMap.current.delete(submissionId);
        }
      } catch {
        // malformed SSE frame — ignore
      }
    };

    es.onerror = () => {
      es.close();
      sseMap.current.delete(submissionId);
    };
  }, []);

  // Load submissions
  const loadSubmissions = React.useCallback(async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch(`/api/ag/list-submissions?paper_id=${paperId}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => []);
      const list: Submission[] = Array.isArray(data) ? data : [];
      const normalized = list.map((s) => ({
        ...s,
        validation_status: normalizeStatus(s.validation_status),
        student_id: s.student_id && s.student_id !== 'NONE' ? s.student_id : null,
      }));
      setSubmissions(normalized);
      normalized.forEach((s) => {
        if (isActive(s.validation_status)) startSSE(s.submission_id);
      });
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubs(false);
    }
  }, [paperId, startSSE]);

  React.useEffect(() => {
    loadSubmissions();
    return () => {
      sseMap.current.forEach((es) => es.close());
      sseMap.current.clear();
      rubricSseRef.current?.close();
    };
  }, [loadSubmissions]);

  // ── Rubric handlers ───────────────────────────────────────────────────────

  const startRubricSSE = React.useCallback(() => {
    rubricSseRef.current?.close();
    const es = new EventSource(`/api/rh/status?paper_id=${paperId}&stream=true`);
    rubricSseRef.current = es;
    es.onmessage = (evt) => {
      try {
        const d = JSON.parse(evt.data);
        const s = normalizeStatus(d.status ?? d.validation_status ?? '');
        setRubricStatus(s);
        if (d.rubric) setRubricJson(JSON.stringify(d.rubric, null, 2));
        if (isTerminal(s)) { es.close(); rubricSseRef.current = null; }
      } catch {}
    };
    es.onerror = () => { es.close(); rubricSseRef.current = null; };
  }, [paperId]);

  const createRubric = React.useCallback(async () => {
    setRubricCreating(true);
    setRubricMsg(null);
    try {
      // Step 1: Finalize paper (required precondition before rubric creation)
      if (!paperFinalized) {
        const fRes = await fetch('/api/qh/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paper_id: paperId }),
        });
        if (!fRes.ok) {
          const fData = await fRes.json().catch(() => null);
          throw new Error((fData?.error ?? fData?.message ?? 'Paper finalization failed') as string);
        }
        setPaperFinalized(true);
      }

      // Step 2: Create rubric
      const res = await fetch('/api/rh/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: paperId }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 412) {
        setRubricMsg({
          ok: false,
          warn: true,
          text: 'Paper is still being ingested by the backend. Please wait 1–2 minutes and try again.',
        });
        return;
      }
      if (!res.ok) throw new Error((data?.error ?? data?.message ?? 'Create failed') as string);
      setRubricStatus('PENDING');
      startRubricSSE();
    } catch (err) {
      setRubricMsg({ ok: false, text: err instanceof Error ? err.message : 'Create failed' });
    } finally {
      setRubricCreating(false);
    }
  }, [paperId, paperFinalized, startRubricSSE]);

  const saveRubric = React.useCallback(async () => {
    setRubricSaving(true);
    setRubricMsg(null);
    try {
      const parsed = JSON.parse(rubricJson);
      const res = await fetch('/api/rh/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: paperId, ...parsed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      setRubricMsg({ ok: true, text: 'Rubric saved.' });
    } catch (err) {
      setRubricMsg({ ok: false, text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setRubricSaving(false);
    }
  }, [paperId, rubricJson]);

  const finalizeRubric = React.useCallback(async () => {
    setRubricFinalizing(true);
    setRubricMsg(null);
    try {
      const res = await fetch('/api/rh/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: paperId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Finalize failed');
      setRubricStatus('FINALIZED');
      setRubricMsg({ ok: true, text: 'Rubric finalized.' });
    } catch (err) {
      setRubricMsg({ ok: false, text: err instanceof Error ? err.message : 'Finalize failed' });
    } finally {
      setRubricFinalizing(false);
    }
  }, [paperId]);

  // ── Sample Answer handlers ────────────────────────────────────────────────

  const uploadSampleAnswer = React.useCallback(async (file: File) => {
    setShUploading(true);
    setShMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('exam_id', '1');
      const res = await fetch('/api/sh/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      const id: number = data?.paper_id ?? data?.sh_id ?? data?.id;
      if (id) {
        setShPaperId(id);
        setShStatus('PENDING');
        // Poll sh status
        const poll = async () => {
          const r = await fetch(`/api/sh/status?paper_id=${id}`, { cache: 'no-store' });
          const d = await r.json().catch(() => null);
          const s = normalizeStatus(d?.status ?? d?.validation_status ?? '');
          setShStatus(s);
          if (!isTerminal(s)) setTimeout(poll, 5000);
        };
        setTimeout(poll, 3000);
      }
      setShMsg({ ok: true, text: 'Sample answer uploaded.' });
    } catch (err) {
      setShMsg({ ok: false, text: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      setShUploading(false);
    }
  }, []);

  const finalizeSampleAnswer = React.useCallback(async () => {
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
      if (!res.ok) throw new Error(data?.error || 'Finalize failed');
      setShStatus('FINALIZED');
      setShMsg({ ok: true, text: 'Sample answer finalized.' });
    } catch (err) {
      setShMsg({ ok: false, text: err instanceof Error ? err.message : 'Finalize failed' });
    } finally {
      setShFinalizing(false);
    }
  }, [shPaperId]);

  // Upload student answer files
  const handleUpload = React.useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const picked = Array.from(fileList).slice(0, 20);
      const newFiles: GradeFile[] = picked.map((file, i) => ({
        id: Date.now() + i,
        file,
        progress: 0,
        done: false,
      }));
      setGradeFiles((prev) => [...newFiles, ...prev]);

      for (const gf of newFiles) {
        let p = 0;
        const interval = setInterval(() => {
          p += Math.floor(Math.random() * 15) + 5;
          setGradeFiles((prev) =>
            prev.map((f) => (f.id === gf.id ? { ...f, progress: Math.min(p, 85) } : f))
          );
        }, 200);

        try {
          const fd = new FormData();
          fd.append('file', gf.file);
          fd.append('paper_id', String(paperId));
          fd.append('exam_id', '1');

          const res = await fetch('/api/ag/upload-grade', { method: 'POST', body: fd });
          const data = await res.json().catch(() => null);
          clearInterval(interval);

          if (!res.ok) throw new Error(data?.error || data?.message || 'Upload failed');

          const submissionId: number = data?.submission_id ?? data?.Assignment_id;
          setGradeFiles((prev) =>
            prev.map((f) => (f.id === gf.id ? { ...f, progress: 100, done: true } : f))
          );

          if (submissionId) {
            const initStatus = normalizeStatus(data.validation_status ?? 'PENDING');
            setSubmissions((prev) => {
              if (prev.find((s) => s.submission_id === submissionId)) return prev;
              return [
                {
                  submission_id: submissionId,
                  student_id: gf.file.name.replace(/\.[^.]+$/, ''),
                  validation_status: initStatus,
                  total_score: null,
                  max_score: null,
                  is_finalized: false,
                },
                ...prev,
              ];
            });
            if (isActive(initStatus)) startSSE(submissionId);
          }
        } catch (err) {
          clearInterval(interval);
          setGradeFiles((prev) =>
            prev.map((f) =>
              f.id === gf.id
                ? { ...f, progress: 0, error: err instanceof Error ? err.message : 'Upload failed' }
                : f
            )
          );
        }
      }
    },
    [paperId, startSSE]
  );

  // Open review panel
  const openReview = React.useCallback(async (sub: Submission) => {
    setReviewSub(sub);
    setGradingData(null);
    setOverrides({});
    setSaveMsg(null);
    setView('review');
    setLoadingReview(true);
    try {
      const res = await fetch(
        `/api/ag/grading-json?submission_id=${sub.submission_id}`,
        { cache: 'no-store' }
      );
      const raw = await res.json().catch(() => null);
      console.log('[grading-json] raw response:', raw);

      if (!res.ok || !raw) {
        setSaveMsg({ ok: false, text: `Failed to load grading data (${res.status})` });
        setGradingData(null);
        return;
      }

      // question_results may be an object (key = qid) or an array
      const rawQR = raw.question_results ?? raw.data?.question_results ?? raw.results ?? raw.questions;
      const questionsArray: QuestionResult[] = rawQR
        ? (Array.isArray(rawQR) ? rawQR : Object.values(rawQR))
        : [];

      // Calculate total max from the questions themselves
      const totalMax = questionsArray.reduce((a, q) => a + (q.max_marks ?? 0), 0);

      const payload: GradingData = {
        question_results: questionsArray,
        totals: raw.totals ?? (raw.total_score != null ? { total_score: raw.total_score } : undefined),
        total_max: totalMax,
      };

      setGradingData(payload);
      const init: Record<string, Override> = {};
      questionsArray.forEach((q) => {
        init[q.canonical_question_id] = { score: String(q.final_score), reason: '' };
      });
      setOverrides(init);
    } catch (err) {
      console.error('[grading-json] error:', err);
      setGradingData(null);
    } finally {
      setLoadingReview(false);
    }
  }, []);

  // Save manual overrides
  const saveOverrides = React.useCallback(async () => {
    if (!reviewSub) return;
    setSaving(true);
    setSaveMsg(null);

    const changed = Object.entries(overrides)
      .filter(([qid, { score, reason }]) => {
        const orig = gradingData?.question_results?.find(
          (q) => q.canonical_question_id === qid
        );
        return reason.trim() !== '' && orig !== undefined && Number(score) !== orig.final_score;
      })
      .map(([qid, { score, reason }]) => ({
        canonical_question_id: qid,
        override_score: Number(score),
        reason,
      }));

    if (changed.length === 0) {
      setSaveMsg({ ok: false, text: 'No changes to save (add a reason for each changed score).' });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/ag/apply-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_id: paperId,
          submission_id: reviewSub.submission_id,
          overrides: changed,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || data?.message || 'Save failed');
      setSaveMsg({ ok: true, text: `Saved ${changed.length} override(s).` });
      // Refresh grading data to reflect new scores
      const fresh = await fetch(
        `/api/ag/grading-json?submission_id=${reviewSub.submission_id}`,
        { cache: 'no-store' }
      );
      const freshRaw = await fresh.json().catch(() => ({}));
      const freshQR = freshRaw.question_results ?? freshRaw.data?.question_results ?? [];
      const freshQuestions: QuestionResult[] = Array.isArray(freshQR) ? freshQR : Object.values(freshQR);
      const freshData: GradingData = {
        question_results: freshQuestions,
        totals: freshRaw.totals,
        total_max: freshQuestions.reduce((a, q) => a + (q.max_marks ?? 0), 0),
      };
      setGradingData(freshData);
      const reinit: Record<string, Override> = {};
      freshQuestions.forEach((q) => {
        reinit[q.canonical_question_id] = { score: String(q.final_score), reason: '' };
      });
      setOverrides(reinit);
    } catch (err) {
      setSaveMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setSaving(false);
    }
  }, [reviewSub, overrides, gradingData, paperId]);

  // Finalize a submission
  const finalizeSubmission = React.useCallback(
    async (submissionId: number) => {
      setFinalizing(submissionId);
      try {
        const res = await fetch('/api/ag/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submission_id: submissionId }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Finalize failed');
        setSubmissions((prev) =>
          prev.map((s) =>
            s.submission_id === submissionId
              ? { ...s, validation_status: 'FINALIZED', is_finalized: true }
              : s
          )
        );
        if (reviewSub?.submission_id === submissionId) {
          setReviewSub((prev) =>
            prev ? { ...prev, validation_status: 'FINALIZED', is_finalized: true } : prev
          );
        }
      } catch (err) {
        console.error('Finalize failed:', err);
      } finally {
        setFinalizing(null);
      }
    },
    [reviewSub]
  );

  const goBackToList = () => {
    setView('list');
    setReviewSub(null);
    setGradingData(null);
    setSaveMsg(null);
  };

  const finalizedCount = submissions.filter((s) => s.validation_status === 'FINALIZED').length;
  const successCount = submissions.filter((s) => s.validation_status === 'SUCCESS').length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl">
        {/* Header */}
        <div className="shrink-0 bg-black text-white">
          <div className="flex items-center gap-3 px-6 pt-4 pb-3">
            {view === 'review' && (
              <button
                type="button"
                onClick={goBackToList}
                className="rounded-full p-1.5 transition-colors hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/50">Paper #{paperId}</p>
              <h2 className="truncate text-[18px] font-semibold leading-tight">
                {view === 'review' && reviewSub
                  ? `Review: ${reviewSub.student_id ?? `Submission #${reviewSub.submission_id}`}`
                  : paperName}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 transition-colors hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Tabs — only when not in review */}
          {view !== 'review' && (
            <div className="flex gap-1 px-6 pb-0">
              <button
                type="button"
                onClick={() => setView('setup')}
                className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  view === 'setup'
                    ? 'bg-white text-slate-900'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                Setup
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-white text-slate-900'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                Grade
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {view === 'setup' ? (
            <SetupSection
              paperId={paperId}
              paperStatus={paperStatus}
              rubricStatus={rubricStatus}
              rubricJson={rubricJson}
              rubricCreating={rubricCreating}
              rubricSaving={rubricSaving}
              rubricFinalizing={rubricFinalizing}
              rubricMsg={rubricMsg}
              shStatus={shStatus}
              shUploading={shUploading}
              shFinalizing={shFinalizing}
              shMsg={shMsg}
              shFileRef={shFileRef}
              onCreateRubric={createRubric}
              onRubricJsonChange={setRubricJson}
              onSaveRubric={saveRubric}
              onFinalizeRubric={finalizeRubric}
              onUploadSampleAnswer={uploadSampleAnswer}
              onFinalizeSampleAnswer={finalizeSampleAnswer}
              onGoGrade={() => setView('list')}
            />
          ) : view === 'list' ? (
            <ListSection
              paperId={paperId}
              submissions={submissions}
              loadingSubs={loadingSubs}
              finalizedCount={finalizedCount}
              successCount={successCount}
              gradeFiles={gradeFiles}
              isDragging={isDragging}
              fileInputRef={fileInputRef}
              finalizing={finalizing}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); }}
              onBrowse={() => fileInputRef.current?.click()}
              onFileChange={(e) => handleUpload(e.target.files)}
              onRemoveFile={(id) => setGradeFiles((prev) => prev.filter((f) => f.id !== id))}
              onReview={openReview}
              onFinalize={finalizeSubmission}
              onRefresh={loadSubmissions}
            />
          ) : (
            <ReviewSection
              sub={reviewSub!}
              gradingData={gradingData}
              loadingReview={loadingReview}
              overrides={overrides}
              saving={saving}
              saveMsg={saveMsg}
              finalizing={finalizing}
              onOverrideChange={(qid, field, val) =>
                setOverrides((prev) => ({ ...prev, [qid]: { ...prev[qid], [field]: val } }))
              }
              onSave={saveOverrides}
              onFinalize={() => finalizeSubmission(reviewSub!.submission_id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ListSection ──────────────────────────────────────────────────────────────

type ListSectionProps = {
  paperId: number;
  submissions: Submission[];
  loadingSubs: boolean;
  finalizedCount: number;
  successCount: number;
  gradeFiles: GradeFile[];
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  finalizing: number | null;
  onDragOver: React.DragEventHandler<HTMLLabelElement>;
  onDragLeave: React.DragEventHandler<HTMLLabelElement>;
  onDrop: React.DragEventHandler<HTMLLabelElement>;
  onBrowse: () => void;
  onFileChange: React.ChangeEventHandler<HTMLInputElement>;
  onRemoveFile: (id: number) => void;
  onReview: (sub: Submission) => void;
  onFinalize: (id: number) => void;
  onRefresh: () => void;
};

function ListSection({
  paperId,
  submissions,
  loadingSubs,
  finalizedCount,
  successCount,
  gradeFiles,
  isDragging,
  fileInputRef,
  finalizing,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowse,
  onFileChange,
  onRemoveFile,
  onReview,
  onFinalize,
  onRefresh,
}: ListSectionProps) {
  return (
    <div className="space-y-6 p-6">
      {/* Upload zone */}
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-700">Upload Student Answer Sheets</p>
        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`block cursor-pointer rounded-[18px] border-2 border-dashed px-6 py-10 text-center transition-colors duration-200 ${
            isDragging
              ? 'border-slate-400 bg-slate-50'
              : 'border-slate-200 bg-[#f6f7f9] hover:bg-[#f1f3f6]'
          }`}
        >
          <div className="flex flex-col items-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-800">Drop answer sheets here</p>
            <p className="mt-1 text-xs text-slate-500">
              PDF / DOCX · max 20 files · 5 MB each
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onBrowse();
              }}
              className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
            >
              Browse files
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            multiple
            className="hidden"
            onChange={onFileChange}
          />
        </label>

        {/* Upload progress items */}
        {gradeFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {gradeFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5"
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                  <CircleProgress progress={f.progress} />
                  <Upload className="absolute h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{f.file.name}</p>
                  <p className="text-xs text-slate-500">
                    {f.error ? (
                      <span className="text-rose-500">{f.error}</span>
                    ) : f.done ? (
                      <span className="text-emerald-600">Uploaded</span>
                    ) : (
                      `Uploading ${f.progress}%`
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveFile(f.id)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submissions table */}
      <div className="overflow-hidden rounded-[18px] border border-slate-200">
        <div className="flex items-center justify-between bg-black px-5 py-3 text-white">
          <div>
            <h3 className="text-[15px] font-semibold">Submissions</h3>
            <p className="text-xs text-white/60">
              {submissions.length} total · {finalizedCount} finalized · {successCount} ready
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#f1f4f8] text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingSubs ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading submissions…
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                    <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p className="text-sm">No submissions yet.</p>
                    <p className="mt-1 text-xs">Upload student answer sheets above to start grading.</p>
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => {
                  const norm = sub.validation_status;
                  const canReview = norm === 'SUCCESS' || norm === 'FINALIZED';
                  const canFinalize = norm === 'SUCCESS' && !sub.is_finalized;
                  const isFinalizing = finalizing === sub.submission_id;
                  const scoreStr =
                    sub.total_score !== null && sub.max_score !== null
                      ? `${sub.total_score}/${sub.max_score}`
                      : sub.total_score !== null
                      ? String(sub.total_score)
                      : '—';

                  return (
                    <tr
                      key={sub.submission_id}
                      className="border-t border-slate-100 text-slate-700 transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">
                          {sub.student_id ?? `Submission #${sub.submission_id}`}
                        </p>
                        <p className="text-xs text-slate-400">#{sub.submission_id}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={norm} />
                      </td>
                      <td className="px-5 py-3.5 tabular-nums">{scoreStr}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {canReview && (
                            <button
                              type="button"
                              onClick={() => onReview(sub)}
                              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                            >
                              Review
                            </button>
                          )}
                          {canFinalize && (
                            <button
                              type="button"
                              disabled={isFinalizing}
                              onClick={() => onFinalize(sub.submission_id)}
                              className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
                            >
                              {isFinalizing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                'Finalize'
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── ReviewSection ────────────────────────────────────────────────────────────

type ReviewSectionProps = {
  sub: Submission;
  gradingData: GradingData | null;
  loadingReview: boolean;
  overrides: Record<string, Override>;
  saving: boolean;
  saveMsg: { ok: boolean; text: string } | null;
  finalizing: number | null;
  onOverrideChange: (qid: string, field: 'score' | 'reason', val: string) => void;
  onSave: () => void;
  onFinalize: () => void;
};

function ReviewSection({
  sub,
  gradingData,
  loadingReview,
  overrides,
  saving,
  saveMsg,
  finalizing,
  onOverrideChange,
  onSave,
  onFinalize,
}: ReviewSectionProps) {
  const isFinalized = sub.validation_status === 'FINALIZED' || sub.is_finalized;
  const questions = gradingData?.question_results ?? [];
  // Always recompute from overrides so total updates in real-time as user types.
  const hasOverrides = Object.keys(overrides).length > 0;
  const totalScore = hasOverrides
    ? questions.reduce((a, q) => a + Number(overrides[q.canonical_question_id]?.score ?? q.final_score), 0)
    : (gradingData?.totals?.total_score ?? 0);
  const totalMax = gradingData?.total_max
    ?? questions.reduce((a, q) => a + (q.max_marks ?? 0), 0);

  return (
    <div className="p-6">
      {/* Summary bar */}
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-[#f6f7f9] px-5 py-4">
        <div>
          <p className="text-xs text-slate-500">Total Score</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {questions.length > 0 ? `${totalScore} / ${totalMax}` : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={sub.validation_status} />
          {!isFinalized && (
            <button
              type="button"
              disabled={finalizing === sub.submission_id}
              onClick={onFinalize}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
            >
              {finalizing === sub.submission_id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Finalize
            </button>
          )}
        </div>
      </div>

      {/* Questions */}
      {loadingReview ? (
        <div className="flex flex-col items-center py-16 text-slate-400">
          <Loader2 className="mb-3 h-6 w-6 animate-spin" />
          <p className="text-sm">Loading grading details…</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 py-12 text-center text-slate-400">
          <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">No question data available.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => {
            const ov = overrides[q.canonical_question_id];
            const scoreChanged = ov && Number(ov.score) !== q.final_score;
            const feedback = q.evaluations?.[0]?.rationale;
            return (
              <div
                key={q.canonical_question_id}
                className={`rounded-2xl border bg-white px-5 py-4 ${
                  scoreChanged ? 'border-amber-300' : 'border-slate-200'
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-slate-900">
                    {q.display_label ?? `Question ${q.canonical_question_id}`}
                  </p>
                  <span className="text-sm text-slate-500">
                    AI score:{' '}
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {q.final_score} / {q.max_marks}
                    </span>
                  </span>
                </div>

                {feedback && (
                  <p className="mb-3 text-xs text-slate-500 italic">{feedback}</p>
                )}

                {!isFinalized ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="sm:w-32">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Override score
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={q.max_marks}
                          step={0.5}
                          value={ov?.score ?? q.final_score}
                          onChange={(e) =>
                            onOverrideChange(q.canonical_question_id, 'score', e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm tabular-nums text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        />
                        <span className="shrink-0 text-xs text-slate-400">/ {q.max_marks}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Reason{' '}
                        {scoreChanged && (
                          <span className="text-amber-600">(required to save)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. partial credit for correct method"
                        value={ov?.reason ?? ''}
                        onChange={(e) =>
                          onOverrideChange(q.canonical_question_id, 'reason', e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-700 tabular-nums">
                    Final score:{' '}
                    <span className="text-slate-900">
                      {q.final_score} / {q.max_marks}
                    </span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save button */}
      {!isFinalized && questions.length > 0 && (
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
          {saveMsg && (
            <p
              className={`text-sm ${
                saveMsg.ok ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {saveMsg.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SetupSection ─────────────────────────────────────────────────────────────

type SetupSectionProps = {
  paperId: number;
  paperStatus: string;
  rubricStatus: string | null;
  rubricJson: string;
  rubricCreating: boolean;
  rubricSaving: boolean;
  rubricFinalizing: boolean;
  rubricMsg: { ok: boolean; warn?: boolean; text: string } | null;
  shStatus: string | null;
  shUploading: boolean;
  shFinalizing: boolean;
  shMsg: { ok: boolean; text: string } | null;
  shFileRef: React.RefObject<HTMLInputElement | null>;
  onCreateRubric: () => void;
  onRubricJsonChange: (v: string) => void;
  onSaveRubric: () => void;
  onFinalizeRubric: () => void;
  onUploadSampleAnswer: (file: File) => void;
  onFinalizeSampleAnswer: () => void;
  onGoGrade: () => void;
};

function SetupSection({
  paperStatus,
  rubricStatus,
  rubricJson,
  rubricCreating,
  rubricSaving,
  rubricFinalizing,
  rubricMsg,
  shStatus,
  shUploading,
  shFinalizing,
  shMsg,
  shFileRef,
  onCreateRubric,
  onRubricJsonChange,
  onSaveRubric,
  onFinalizeRubric,
  onUploadSampleAnswer,
  onFinalizeSampleAnswer,
  onGoGrade,
}: SetupSectionProps) {
  const rubricFinalized = rubricStatus === 'FINALIZED';
  const rubricReady = rubricStatus === 'SUCCESS' || rubricFinalized;
  const rubricActive = rubricStatus === 'PENDING' || rubricStatus === 'RUNNING';

  return (
    <div className="space-y-5 p-6">

      {/* ── Step 1: Rubric ── */}
      <div className="rounded-[18px] border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-bold">1</div>
            <div>
              <p className="font-semibold text-slate-900">Rubric</p>
              <p className="text-xs text-slate-500">Auto-generated from your paper, then editable</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {rubricStatus && <StatusBadge status={rubricStatus} />}
            {!rubricStatus && (
              paperStatus !== 'SUCCESS' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Paper processing…
                </span>
              ) : (
                <button
                  type="button"
                  disabled={rubricCreating}
                  onClick={onCreateRubric}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
                >
                  {rubricCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                  Create Rubric
                </button>
              )
            )}
          </div>
        </div>

        {rubricActive && (
          <div className="flex items-center gap-2 px-5 py-4 text-sm text-sky-700 bg-sky-50">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Generating rubric from paper… this may take a moment.
          </div>
        )}

        {rubricReady && (
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Rubric JSON</p>
              <p className="text-xs text-slate-400">Edit below, then save before finalizing</p>
            </div>
            <textarea
              disabled={rubricFinalized}
              value={rubricJson}
              onChange={(e) => onRubricJsonChange(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3 font-mono text-xs text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:opacity-60 resize-y"
              spellCheck={false}
            />
            {!rubricFinalized && (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  disabled={rubricSaving}
                  onClick={onSaveRubric}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                  {rubricSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </button>
                <button
                  type="button"
                  disabled={rubricFinalizing}
                  onClick={onFinalizeRubric}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
                >
                  {rubricFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Finalize Rubric
                </button>
              </div>
            )}
            {rubricMsg && (
              <p className={`text-sm ${rubricMsg.ok ? 'text-emerald-600' : rubricMsg.warn ? 'text-amber-600' : 'text-rose-600'}`}>
                {rubricMsg.text}
              </p>
            )}
          </div>
        )}

        {rubricStatus === 'FAILED' && (
          <div className="flex items-center justify-between px-5 py-4 bg-rose-50">
            <p className="text-sm text-rose-700">Rubric generation failed.</p>
            <button
              type="button"
              onClick={onCreateRubric}
              className="text-sm font-medium text-rose-700 underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ── Step 2: Sample Answer (optional) ── */}
      <div className="rounded-[18px] border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-sm font-bold">2</div>
            <div>
              <p className="font-semibold text-slate-900">Sample Answer <span className="text-xs font-normal text-slate-400 ml-1">optional</span></p>
              <p className="text-xs text-slate-500">Upload a model answer to improve grading accuracy</p>
            </div>
          </div>
          {shStatus && <StatusBadge status={shStatus} />}
        </div>

        <div className="px-5 py-4 space-y-3">
          {shStatus !== 'FINALIZED' && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-[#f6f7f9] px-4 py-3 transition-colors hover:bg-[#f1f3f6]">
              <Upload className="h-5 w-5 shrink-0 text-slate-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {shUploading ? 'Uploading…' : 'Click to upload sample answer'}
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
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadSampleAnswer(f);
                  e.target.value = '';
                }}
              />
            </label>
          )}

          {shStatus && shStatus !== 'FINALIZED' && (
            <div className="flex items-center gap-3">
              {(shStatus === 'SUCCESS') && (
                <button
                  type="button"
                  disabled={shFinalizing}
                  onClick={onFinalizeSampleAnswer}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
                >
                  {shFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Finalize Sample Answer
                </button>
              )}
            </div>
          )}

          {shMsg && (
            <p className={`text-sm ${shMsg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
              {shMsg.text}
            </p>
          )}
        </div>
      </div>

      {/* ── Go to Grading ── */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onGoGrade}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          Start Grading
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
