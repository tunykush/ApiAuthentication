'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  X,
  FileText,
  Settings,
  GraduationCap,
  Trash2,
  CheckCircle2,
  Clock3,
  ArrowRight,
  BookOpen,
  Eye,
} from 'lucide-react';
import { Paper } from '@/components/papers/types';
import { normalizeStatus } from '@/components/papers/StatusBadge';

function CircleProgress({ progress }: { progress: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
      <circle
        cx="22" cy="22" r={r} fill="none" stroke="#0f172a" strokeWidth="4"
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ - (progress / 100) * circ}
        className="transition-all duration-300"
      />
    </svg>
  );
}

type UploadFile = { id: number; file: File; progress: number; uploaded: boolean; error?: string };

export default function PapersPage() {
  const router = useRouter();
  const [papers, setPapers] = React.useState<Paper[]>([]);
  const [files, setFiles] = React.useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [loadingPapers, setLoadingPapers] = React.useState(true);
  const [fileNames, setFileNames] = React.useState<Record<string, string>>({});
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const pollingRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingRef = React.useRef(false);
  // Map paper_id → blob URL (session-only, cleared on unmount)
  const paperBlobUrls = React.useRef<Map<number, string>>(new Map());

  React.useEffect(() => {
    const map = paperBlobUrls.current;
    return () => { map.forEach((url) => URL.revokeObjectURL(url)); };
  }, []);

  // Detail drawer state
  const [detailPaper, setDetailPaper] = React.useState<Paper | null>(null);

  const openDetail = React.useCallback((paper: Paper) => {
    setDetailPaper(paper);
  }, []);

  React.useEffect(() => {
    setFileNames(JSON.parse(localStorage.getItem('paperFileNames') ?? '{}'));
  }, []);

  const stopPolling = React.useCallback(() => {
    isPollingRef.current = false;
    if (pollingRef.current) { clearTimeout(pollingRef.current); pollingRef.current = null; }
  }, []);

  const scheduleNextPoll = React.useCallback((delay: number) => {
    if (!isPollingRef.current) return;
    pollingRef.current = setTimeout(async () => {
      if (!isPollingRef.current) return;
      try {
        const res = await fetch('/api/list-paper', { cache: 'no-store' });
        if (res.status === 429) { scheduleNextPoll(Math.min(delay * 2, 60_000)); return; }
        if (!res.ok) { scheduleNextPoll(delay); return; }
        const data = await res.json();
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) => new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime())
          : [];
        setPapers(sorted);
        const hasPending = sorted.some(
          (p) => p.validation_status !== 'SUCCESS' && p.validation_status !== 'FAILED'
        );
        if (hasPending) scheduleNextPoll(delay); else stopPolling();
      } catch { scheduleNextPoll(delay); }
    }, delay);
  }, [stopPolling]);

  const startPolling = React.useCallback(() => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    scheduleNextPoll(10_000);
  }, [scheduleNextPoll]);

  React.useEffect(() => stopPolling, [stopPolling]);

  const fetchPapers = React.useCallback(async () => {
    try {
      setLoadingPapers(true);
      let res!: Response;
      let data: unknown = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        res = await fetch('/api/list-paper', { cache: 'no-store' });
        data = await res.json().catch(() => null);
        if (res.status === 401) { router.replace('/signin'); return; }
        if (res.status !== 429) break;
        const m = (data as { message?: string })?.message?.match(/(\d+)\s*second/);
        await new Promise((r) => setTimeout(r, m ? parseInt(m[1]) * 1000 : 5000));
      }
      if (!res.ok) { setPapers([]); return; }
      const list: Paper[] = Array.isArray(data) ? data
        : ((data as Record<string, unknown>)?.papers as Paper[]) ?? [];
      const sorted = [...list].sort(
        (a, b) => new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime()
      );
      setPapers(sorted);
    } catch { setPapers([]); }
    finally { setLoadingPapers(false); }
  }, [router]);

  React.useEffect(() => { fetchPapers(); }, [fetchPapers]);

  const simulateUpload = React.useCallback(async (newFiles: File[]) => {
    const mapped: UploadFile[] = newFiles.map((file, i) => ({ id: Date.now() + i, file, progress: 0, uploaded: false }));
    setFiles((prev) => [...mapped, ...prev]);

    for (const uf of mapped) {
      let progress = 0;
      const ticker = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, progress: Math.min(progress, 90) } : f));
      }, 200);

      try {
        const fd = new FormData();
        fd.append('file', uf.file);
        fd.append('exam_id', '1');
        fd.append('notes', 'upload from web');

        let res!: Response;
        let data: Record<string, unknown> | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          res = await fetch('/api/upload-paper', { method: 'POST', body: fd });
          data = await res.json().catch(() => null);
          if (res.status !== 429) break;
          const m = (data?.message as string)?.match(/(\d+)\s*second/);
          await new Promise((r) => setTimeout(r, m ? parseInt(m[1]) * 1000 : 5000));
        }
        clearInterval(ticker);
        if (!res.ok) throw new Error((data?.message as string) ?? 'Upload failed');

        setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, progress: 100, uploaded: true } : f));

        if (data?.paper_id) {
          const pid = Number(data.paper_id);
          // Keep blob URL so the drawer can show a PDF preview this session
          const old = paperBlobUrls.current.get(pid);
          if (old) URL.revokeObjectURL(old);
          paperBlobUrls.current.set(pid, URL.createObjectURL(uf.file));

          const stored = JSON.parse(localStorage.getItem('paperFileNames') ?? '{}');
          stored[String(data.paper_id)] = uf.file.name;
          localStorage.setItem('paperFileNames', JSON.stringify(stored));
          setFileNames({ ...stored });
        }
        await fetchPapers();
        startPolling();
      } catch (err) {
        clearInterval(ticker);
        setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, progress: 0, error: err instanceof Error ? err.message : 'Upload failed' } : f));
      }
    }
  }, [fetchPapers, startPolling]);

  const handleFiles = React.useCallback((list: FileList | null) => {
    if (!list || list.length === 0) return;
    simulateUpload(Array.from(list).slice(0, 10));
  }, [simulateUpload]);

  const deletePaper = async (paperId: number) => {
    try {
      const res = await fetch(`/api/delete-paper?paper_id=${paperId}`, { method: 'DELETE' });
      if (!res.ok) return;
      setPapers((prev) => prev.filter((p) => p.paper_id !== paperId));
      const stored = JSON.parse(localStorage.getItem('paperFileNames') ?? '{}');
      delete stored[paperId];
      localStorage.setItem('paperFileNames', JSON.stringify(stored));
      setFileNames({ ...stored });
    } catch { /* ignore */ }
  };

  const successCount = papers.filter((p) => normalizeStatus(p.validation_status) === 'SUCCESS').length;

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-10 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Papers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload exam papers, set up rubrics, and grade student submissions.
          </p>
        </div>

        {/* Upload zone */}
        <div>
          <label
            htmlFor="paper-upload"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
            className={`block cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-200 ${
              isDragging ? 'border-slate-400 bg-white' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Upload className="h-6 w-6 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Drop your exam paper here</p>
                <p className="mt-0.5 text-xs text-slate-500">PDF, DOC or DOCX · up to 5 MB each · max 10 files</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); inputRef.current?.click(); }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Browse files
              </button>
            </div>
            <input id="paper-upload" ref={inputRef} type="file" accept=".pdf,.doc,.docx" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </label>

          {/* Upload progress */}
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                    <CircleProgress progress={item.progress} />
                    <Upload className="absolute h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{item.file.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.error ? (
                        <span className="text-rose-500">{item.error}</span>
                      ) : item.progress < 100 ? `Uploading ${item.progress}%` : 'Upload complete'}
                    </p>
                  </div>
                  <button type="button" onClick={() => setFiles((p) => p.filter((f) => f.id !== item.id))} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Papers list */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Uploaded Papers</h2>
              <p className="text-xs text-slate-400">{papers.length} total · {successCount} ready</p>
            </div>
            <button onClick={fetchPapers} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
              Refresh
            </button>
          </div>

          {loadingPapers ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
              <p className="text-sm">Loading papers…</p>
            </div>
          ) : papers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <BookOpen className="mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">No papers yet</p>
              <p className="text-xs text-slate-400">Upload your first exam paper above</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {papers.map((paper) => {
                const norm = normalizeStatus(paper.validation_status);
                const isReady = norm === 'SUCCESS';
                const name = fileNames[paper.paper_id] ?? `Paper #${paper.paper_id}`;
                return (
                  <div key={paper.paper_id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                      <FileText className="h-5 w-5 text-slate-500" />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                        <span className="text-xs text-slate-400">#{paper.paper_id}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
                        {paper.created_at && (
                          <span>{new Date(paper.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        )}
                        {paper.total_marks != null && <span>{paper.total_marks} marks</span>}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="shrink-0">
                      {isReady ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <Clock3 className="h-3.5 w-3.5" /> Processing
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openDetail(paper)}
                        title="View detail"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/papers/${paper.paper_id}/setup`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Setup
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/papers/${paper.paper_id}/grade`)}
                        disabled={!isReady}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm transition ${
                          isReady
                            ? 'bg-slate-900 text-white hover:bg-slate-700'
                            : 'cursor-not-allowed bg-slate-100 text-slate-400'
                        }`}
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        Grade
                        {isReady && <ArrowRight className="h-3 w-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePaper(paper.paper_id)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PDF preview modal */}
      {detailPaper && (() => {
        const blobUrl = paperBlobUrls.current.get(detailPaper.paper_id) ?? null;
        const pdfSrc = blobUrl ?? `/api/paper-file?paper_id=${detailPaper.paper_id}`;
        const isReady = normalizeStatus(detailPaper.validation_status) === 'SUCCESS';

        return (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setDetailPaper(null)}
            />

            {/* Centered modal — 90vw × 92vh */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="pointer-events-auto flex w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl"
                style={{ height: 'min(92vh, 900px)' }}>

                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <FileText className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {fileNames[detailPaper.paper_id] ?? `Paper #${detailPaper.paper_id}`}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>#{detailPaper.paper_id}</span>
                        {detailPaper.created_at && (
                          <><span>·</span><span>{new Date(detailPaper.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></>
                        )}
                        {detailPaper.total_marks != null && (
                          <><span>·</span><span>{detailPaper.total_marks} marks</span></>
                        )}
                        <span>·</span>
                        {isReady
                          ? <span className="font-medium text-emerald-600">Ready</span>
                          : <span className="font-medium text-amber-500">Processing</span>
                        }
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailPaper(null)}
                    className="ml-4 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* PDF — fills remaining space */}
                <iframe
                  src={pdfSrc}
                  className="min-h-0 flex-1 w-full rounded-none border-0"
                  title="Paper PDF preview"
                />

                {/* Footer */}
                <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => { setDetailPaper(null); router.push(`/papers/${detailPaper.paper_id}/setup`); }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Settings className="h-3.5 w-3.5" /> Setup
                </button>
                <button
                  type="button"
                  disabled={!isReady}
                  onClick={() => { setDetailPaper(null); router.push(`/papers/${detailPaper.paper_id}/grade`); }}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium shadow-sm transition ${
                    isReady ? 'bg-slate-900 text-white hover:bg-slate-700' : 'cursor-not-allowed bg-slate-100 text-slate-400'
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5" /> Grade
                </button>
              </div>
            </div>{/* modal box */}
            </div>{/* centering container */}
          </>
        );
      })()}
    </main>
  );
}
