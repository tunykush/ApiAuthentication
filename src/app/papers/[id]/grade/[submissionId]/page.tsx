'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Lock, FileText } from 'lucide-react';
import { QuestionResult, GradingData, Override } from '@/components/papers/types';
import { StatusBadge } from '@/components/papers/StatusBadge';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = Number(params.id);
  const submissionId = Number(params.submissionId);

  const [paperName, setPaperName] = React.useState(`Paper #${paperId}`);
  React.useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('paperFileNames') ?? '{}');
    if (stored[paperId]) setPaperName(stored[paperId]);
  }, [paperId]);

  // ── Grading data ──────────────────────────────────────────────────────────
  const [gradingData, setGradingData] = React.useState<GradingData | null>(null);
  const [loadingReview, setLoadingReview] = React.useState(true);
  const [submissionStatus, setSubmissionStatus] = React.useState('SUCCESS');
  const [isFinalized, setIsFinalized] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const loadGradingData = React.useCallback(async () => {
    setLoadingReview(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/ag/grading-json?submission_id=${submissionId}`, { cache: 'no-store' });
      const raw = await res.json().catch(() => null);
      if (!res.ok || !raw) {
        setFetchError(`Failed to load grading data (${res.status})`);
        return;
      }
      const rawQR = raw.question_results ?? raw.data?.question_results ?? raw.results ?? raw.questions;
      const questionsArray: QuestionResult[] = rawQR
        ? (Array.isArray(rawQR) ? rawQR : Object.values(rawQR))
        : [];
      const totalMax = questionsArray.reduce((a, q) => a + (q.max_marks ?? 0), 0);
      setGradingData({
        question_results: questionsArray,
        totals: raw.totals ?? (raw.total_score != null ? { total_score: raw.total_score } : undefined),
        total_max: totalMax,
      });
      if (raw.validation_status) setSubmissionStatus(raw.validation_status);
      if (raw.is_finalized) setIsFinalized(true);

      const init: Record<string, Override> = {};
      questionsArray.forEach((q) => {
        init[q.canonical_question_id] = { score: String(q.final_score), reason: '' };
      });
      setOverrides(init);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoadingReview(false);
    }
  }, [submissionId]);

  React.useEffect(() => { loadGradingData(); }, [loadGradingData]);

  // ── Overrides ─────────────────────────────────────────────────────────────
  const [overrides, setOverrides] = React.useState<Record<string, Override>>({});
  const [saving, setSaving] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  const handleOverrideChange = (qid: string, field: 'score' | 'reason', val: string) => {
    setOverrides((prev) => ({ ...prev, [qid]: { ...prev[qid], [field]: val } }));
  };

  const saveOverrides = async () => {
    setSaving(true);
    setSaveMsg(null);
    const changed = Object.entries(overrides)
      .filter(([qid, { score, reason }]) => {
        const orig = gradingData?.question_results?.find((q) => q.canonical_question_id === qid);
        return reason.trim() !== '' && orig !== undefined && Number(score) !== orig.final_score;
      })
      .map(([qid, { score, reason }]) => ({
        canonical_question_id: qid,
        override_score: Number(score),
        reason,
      }));

    if (changed.length === 0) {
      setSaveMsg({ ok: false, text: 'No changes to save. Add a reason for each changed score.' });
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/ag/apply-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: paperId, submission_id: submissionId, overrides: changed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || data?.message || 'Save failed');
      setSaveMsg({ ok: true, text: `Saved ${changed.length} override(s). Refreshing…` });
      await loadGradingData();
    } catch (err) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  // ── Finalize ──────────────────────────────────────────────────────────────
  const [finalizing, setFinalizing] = React.useState(false);

  const finalizeSubmission = async () => {
    setFinalizing(true);
    try {
      const res = await fetch('/api/ag/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId }),
      });
      if (!res.ok) return;
      setSubmissionStatus('FINALIZED');
      setIsFinalized(true);
    } catch { /* ignore */ }
    finally { setFinalizing(false); }
  };

  const questions = gradingData?.question_results ?? [];
  const hasOverrides = Object.keys(overrides).length > 0;
  const totalScore = hasOverrides
    ? questions.reduce((a, q) => a + Number(overrides[q.canonical_question_id]?.score ?? q.final_score), 0)
    : (gradingData?.totals?.total_score ?? 0);
  const totalMax = gradingData?.total_max ?? questions.reduce((a, q) => a + (q.max_marks ?? 0), 0);

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push('/papers')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
          >
            Papers
          </button>
          <span className="text-slate-300">/</span>
          <button
            onClick={() => router.push(`/papers/${paperId}/grade`)}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
          >
            {paperName}
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-900">Submission #{submissionId}</span>
        </div>

        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/papers/${paperId}/grade`)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Review Grading</h1>
            <p className="text-sm text-slate-500">Submission #{submissionId}</p>
          </div>
          <StatusBadge status={submissionStatus} />
        </div>

        {/* Score summary */}
        {!loadingReview && questions.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Score</p>
              <p className="text-3xl font-bold tabular-nums text-slate-900">
                {totalScore} <span className="text-lg text-slate-400">/ {totalMax}</span>
              </p>
            </div>
            {!isFinalized && (
              <button
                type="button"
                disabled={finalizing}
                onClick={finalizeSubmission}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Finalize
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {loadingReview ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <Loader2 className="mb-3 h-6 w-6 animate-spin" />
            <p className="text-sm">Loading grading details…</p>
          </div>
        ) : fetchError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-center">
            <p className="font-medium text-rose-700">{fetchError}</p>
            <button onClick={loadGradingData} className="mt-2 text-sm text-rose-600 underline">Retry</button>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white py-14 text-slate-400">
            <FileText className="mb-3 h-10 w-10 text-slate-200" />
            <p className="font-medium text-slate-500">No grading data available</p>
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
                  className={`rounded-2xl border bg-white px-5 py-4 transition-colors ${
                    scoreChanged ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <p className="font-semibold text-slate-900">
                      {q.display_label ?? `Question ${q.canonical_question_id}`}
                    </p>
                    <span className="shrink-0 text-sm text-slate-500">
                      AI: <span className="font-semibold text-slate-800 tabular-nums">{q.final_score}/{q.max_marks}</span>
                    </span>
                  </div>

                  {feedback && (
                    <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs italic text-slate-600">{feedback}</p>
                  )}

                  {!isFinalized ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="sm:w-36">
                        <label className="mb-1 block text-xs font-medium text-slate-600">Override score</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={q.max_marks}
                            step={0.5}
                            value={ov?.score ?? q.final_score}
                            onChange={(e) => handleOverrideChange(q.canonical_question_id, 'score', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          />
                          <span className="shrink-0 text-xs text-slate-400">/ {q.max_marks}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Reason {scoreChanged && <span className="text-amber-600">(required to save)</span>}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. partial credit for correct method"
                          value={ov?.reason ?? ''}
                          onChange={(e) => handleOverrideChange(q.canonical_question_id, 'reason', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Final score: <span className="font-semibold tabular-nums text-slate-900">{q.final_score} / {q.max_marks}</span>
                    </p>
                  )}
                </div>
              );
            })}

            {/* Save */}
            {!isFinalized && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveOverrides}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
                {saveMsg && (
                  <p className={`text-sm ${saveMsg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{saveMsg.text}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
