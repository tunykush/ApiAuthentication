'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  X,
  FileText,
  Eye,
  Trash2,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import GradingModal from '@/components/grading/GradingModal';

type UploadFile = {
  id: number;
  file: File;
  progress: number;
  uploaded: boolean;
  error?: string;
};

type Paper = {
  paper_id: number;
  validation_status: string;
  is_finalized?: boolean;
  total_marks?: number;
  message?: string;
  created_at?: string;
};

function CircleProgress({ progress }: { progress: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="4"
      />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="#0f172a"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-300"
      />
    </svg>
  );
}

export default function AutoGradeUploadPage() {
  const router = useRouter();
  const [papers, setPapers] = React.useState<Paper[]>([]);
  const [files, setFiles] = React.useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [loadingPapers, setLoadingPapers] = React.useState(true);
  const [fileNames, setFileNames] = React.useState<Record<string, string>>({});
  const [selectedPaper, setSelectedPaper] = React.useState<Paper | null>(null);

  React.useEffect(() => {
    setFileNames(JSON.parse(localStorage.getItem('paperFileNames') ?? '{}'));
  }, []);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const pollingRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingRef = React.useRef(false);

  const stopPolling = React.useCallback(() => {
    isPollingRef.current = false;
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const scheduleNextPoll = React.useCallback((delay: number) => {
    if (!isPollingRef.current) return;
    pollingRef.current = setTimeout(async () => {
      if (!isPollingRef.current) return;
      try {
        const res = await fetch('/api/list-paper', { method: 'GET', cache: 'no-store' });
        if (res.status === 429) {
          scheduleNextPoll(Math.min(delay * 2, 60_000));
          return;
        }
        if (!res.ok) {
          scheduleNextPoll(delay);
          return;
        }
        const data = await res.json();
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) => new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime())
          : [];
        setPapers(sorted);
        const hasPending = sorted.some(
          (p) => p.validation_status !== 'SUCCESS' && p.validation_status !== 'FAILED'
        );
        if (hasPending) scheduleNextPoll(delay);
        else stopPolling();
      } catch {
        scheduleNextPoll(delay);
      }
    }, delay);
  }, [stopPolling]);

  const startPolling = React.useCallback(() => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    scheduleNextPoll(10_000);
  }, [scheduleNextPoll]);

  React.useEffect(() => stopPolling, [stopPolling]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalPapers = papers.length;

  const successCount = React.useMemo(
    () => papers.filter((paper) => paper.validation_status === 'SUCCESS').length,
    [papers]
  );

  const fetchPapers = React.useCallback(async () => {
    try {
      setLoadingPapers(true);

      let res!: Response;
      let data: unknown = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        res = await fetch('/api/list-paper', { method: 'GET', cache: 'no-store' });
        data = await res.json().catch(() => null);

        if (res.status === 401) {
          router.replace('/signin');
          return;
        }

        if (res.status !== 429) break;

        const retryMatch = (data as { message?: string })?.message?.match(/(\d+)\s*second/);
        const retryAfter = retryMatch ? parseInt(retryMatch[1]) * 1000 : 5000;
        await new Promise((r) => setTimeout(r, retryAfter));
      }

      if (!res.ok) {
        const d = data as Record<string, unknown> | null;
        const msg = d?.error || d?.detail || d?.message || `HTTP ${res.status}`;
        console.error('fetchPapers failed:', res.status, data);
        throw new Error(String(msg));
      }

      const list: Paper[] = Array.isArray(data)
        ? data
        : ((data as Record<string, unknown>)?.papers as Paper[] | undefined) ??
          ((data as Record<string, unknown>)?.results as Paper[] | undefined) ??
          ((data as Record<string, unknown>)?.data as Paper[] | undefined) ??
          [];

      console.log('fetchPapers raw data:', data, '→ list:', list);

      const sorted = [...list].sort((a, b) => {
        const aTime = new Date(a.created_at ?? '').getTime();
        const bTime = new Date(b.created_at ?? '').getTime();
        return bTime - aTime;
      });

      setPapers(sorted);
    } catch (error) {
      console.error('fetch papers failed:', error);
      setPapers([]);
    } finally {
      setLoadingPapers(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const simulateUpload = React.useCallback(
    async (newFiles: File[]) => {
      const mappedFiles: UploadFile[] = newFiles.map((file, index) => ({
        id: Date.now() + index,
        file,
        progress: 0,
        uploaded: false,
      }));

      setFiles((prev) => [...mappedFiles, ...prev]);

      for (const uploadFile of mappedFiles) {
        let progress = 0;

        const fakeInterval = setInterval(() => {
          progress += Math.floor(Math.random() * 15) + 5;

          setFiles((prev) =>
            prev.map((item) =>
              item.id === uploadFile.id
                ? { ...item, progress: Math.min(progress, 90) }
                : item
            )
          );
        }, 200);

        try {
          const fd = new FormData();
          fd.append('file', uploadFile.file);
          fd.append('exam_id', '1');
          fd.append('notes', 'upload from web');

          let res: Response;
          let data: Record<string, unknown> | null = null;

          for (let attempt = 0; attempt < 5; attempt++) {
            res = await fetch('/api/upload-paper', { method: 'POST', body: fd });
            data = await res.json().catch(() => null);

            if (res.status !== 429) break;

            const retryMatch = (data?.message as string | undefined)?.match(/(\d+)\s*second/);
            const retryAfter = retryMatch ? parseInt(retryMatch[1]) * 1000 : 5000;
            await new Promise((r) => setTimeout(r, retryAfter));
          }

          clearInterval(fakeInterval);

          console.log('upload response:', data);

          if (!res!.ok) {
            throw new Error((data?.error as { message?: string } | null)?.message || data?.message as string || 'Upload failed');
          }

          setFiles((prev) =>
            prev.map((item) =>
              item.id === uploadFile.id
                ? { ...item, progress: 100, uploaded: true }
                : item
            )
          );

          if (data?.paper_id) {
            localStorage.setItem('currentPaperId', String(data.paper_id));
            const stored = JSON.parse(localStorage.getItem('paperFileNames') ?? '{}');
            stored[String(data.paper_id)] = uploadFile.file.name;
            localStorage.setItem('paperFileNames', JSON.stringify(stored));
            setFileNames({ ...stored });
          }

          await fetchPapers();
          startPolling();
        } catch (err) {
          clearInterval(fakeInterval);

          const message = err instanceof Error ? err.message : 'Upload failed';
          setFiles((prev) =>
            prev.map((item) =>
              item.id === uploadFile.id
                ? { ...item, progress: 0, uploaded: false, error: message }
                : item
            )
          );

          console.error('Upload failed:', err);
        }
      }
    },
    [fetchPapers, startPolling]
  );

  const handleFiles = React.useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const accepted = Array.from(fileList).slice(0, 10);
      simulateUpload(accepted);
    },
    [simulateUpload]
  );

  const removeUploadFile = (id: number) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDeletePaper = async (paperId: number) => {
    try {
      const res = await fetch(`/api/delete-paper?paper_id=${paperId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error("Delete failed:", data);
        return;
      }

      setPapers((prev) => prev.filter((paper) => paper.paper_id !== paperId));

      const stored = JSON.parse(localStorage.getItem("paperFileNames") ?? "{}");
      delete stored[paperId];
      localStorage.setItem("paperFileNames", JSON.stringify(stored));
      setFileNames({ ...stored });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-8 text-slate-900 md:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[24px] bg-transparent p-4 md:p-6">
          <label
            htmlFor="paper-upload"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`block cursor-pointer rounded-[22px] border px-6 py-14 text-center transition-colors duration-200 md:px-10 ${
              isDragging
                ? 'border-slate-400 bg-[#f6f7f9]'
                : 'border-slate-300 bg-[#f6f7f9] hover:bg-[#f1f3f6]'
            }`}
            style={{
              borderStyle: 'dashed',
              borderWidth: '2px',
              borderColor: isDragging ? '#64748b' : '#cbd5e1',
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.4))',
            }}
          >
            <div className="mx-auto flex max-w-2xl flex-col items-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600">
                <Upload className="h-7 w-7" />
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Drag &amp; drop files here
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 md:text-base">
                Or click to browse (max 10 files, up to 5MB each)
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  inputRef.current?.click();
                }}
                className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-50 active:bg-slate-100"
              >
                Browse files
              </button>

              <input
                id="paper-upload"
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </label>

          {files.length > 0 && (
            <div className="mt-5 border-t border-slate-200 pt-5">
              <div className="space-y-3">
                {files.map((item) => (
                  <div
                    key={item.id}
                    className="relative flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                      <div className="relative flex items-center justify-center">
                        <CircleProgress progress={item.progress} />
                        <Upload className="absolute h-4 w-4 text-slate-500" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.file.name}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="text-slate-500">{formatFileSize(item.file.size)}</span>
                        <span className="text-slate-500">•</span>
                        {item.error ? (
                          <span className="text-rose-500">{item.error}</span>
                        ) : (
                          <span className="text-slate-500">
                            {item.progress < 100
                              ? `Uploading ${item.progress}%`
                              : 'Upload complete'}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeUploadFile(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-7 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          <div className="flex items-center justify-between bg-black px-5 py-4 text-white md:px-6">
            <div>
              <h3 className="text-[22px] font-semibold tracking-tight text-white">
                Your Papers
              </h3>
              <p className="mt-1 text-sm text-white">
                {totalPapers} files uploaded · {successCount} processed
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#f1f4f8] text-left text-[12px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-5 py-4 font-medium md:px-6">Code</th>
                  <th className="px-5 py-4 font-medium">Name</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Marks</th>
                  <th className="px-5 py-4 font-medium">Uploaded</th>
                  <th className="px-5 py-4 text-right font-medium md:px-6">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loadingPapers ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      Loading papers...
                    </td>
                  </tr>
                ) : papers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No papers found.
                    </td>
                  </tr>
                ) : (
                  papers.map((paper, index) => (
                    <tr
                      key={paper.paper_id}
                      className="animate-[fadeIn_0.28s_ease] border-t border-slate-100 text-slate-700 transition-colors duration-200 hover:bg-slate-50/70"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <td className="px-5 py-4 md:px-6">
                        <div className="flex items-center gap-2 text-slate-500">
                          <FileText className="h-4 w-4" />
                          <span>#{paper.paper_id}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-900">
                        {fileNames[paper.paper_id] ?? `Paper ${paper.paper_id}`}
                      </td>

                      <td className="px-5 py-4">
                        {paper.validation_status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            <Clock3 className="h-3.5 w-3.5" />
                            {paper.validation_status || 'Processing'}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">{paper.total_marks ?? '-'}</td>

                      <td className="px-5 py-4 text-slate-500">
                        {paper.created_at
                          ? new Date(paper.created_at).toLocaleDateString()
                          : '-'}
                      </td>

                      <td className="px-5 py-4 md:px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPaper(paper)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 active:bg-slate-200"
                          >
                            <Eye className="h-4 w-4" />
                            Open
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePaper(paper.paper_id)}
                            className="inline-flex items-center justify-center rounded-full p-2 text-slate-400 transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selectedPaper && (
        <GradingModal
          paper={selectedPaper}
          paperName={fileNames[selectedPaper.paper_id] ?? `Paper ${selectedPaper.paper_id}`}
          onClose={() => setSelectedPaper(null)}
        />
      )}
    </main>
  );
}