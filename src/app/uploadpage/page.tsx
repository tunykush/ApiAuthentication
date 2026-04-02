'use client';

import * as React from 'react';
import {
  Upload,
  X,
  FileText,
  Eye,
  Trash2,
  Lightbulb,
  CheckCircle2,
  Clock3,
} from 'lucide-react';

type UploadFile = {
  id: number;
  file: File;
  progress: number;
  uploaded: boolean;
};

type Paper = {
  id: number;
  code: string;
  name: string;
  status: 'success' | 'processing';
  marks: number | string;
  uploaded: string;
};

const initialPapers: Paper[] = [
  {
    id: 1,
    code: 'UNKNOWN',
    name: 'Untitled Paper',
    status: 'success',
    marks: 0,
    uploaded: '2026-04-02',
  },
  {
    id: 2,
    code: '--',
    name: 'draft',
    status: 'success',
    marks: 0,
    uploaded: '2026-04-02',
  },
];

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
  const [papers, setPapers] = React.useState<Paper[]>(initialPapers);
  const [files, setFiles] = React.useState<UploadFile[]>([]);
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const totalPapers = papers.length;
  const successCount = React.useMemo(
    () => papers.filter((paper) => paper.status === 'success').length,
    [papers]
  );

  const today = () => new Date().toISOString().split('T')[0];

  const simulateUpload = React.useCallback((newFiles: File[]) => {
    const mappedFiles: UploadFile[] = newFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      progress: 0,
      uploaded: false,
    }));

    setFiles((prev) => [...mappedFiles, ...prev]);

    mappedFiles.forEach((uploadFile) => {
      let progress = 0;

      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 18) + 10;

        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          setFiles((prev) =>
            prev.map((item) =>
              item.id === uploadFile.id
                ? { ...item, progress: 100, uploaded: true }
                : item
            )
          );

          const extension = uploadFile.file.name.split('.').pop()?.toUpperCase() || 'FILE';

          setPapers((prev) => [
            {
              id: uploadFile.id,
              code: extension,
              name: uploadFile.file.name,
              status: 'success',
              marks: 0,
              uploaded: today(),
            },
            ...prev,
          ]);

          return;
        }

        setFiles((prev) =>
          prev.map((item) =>
            item.id === uploadFile.id ? { ...item, progress } : item
          )
        );
      }, 180);
    });
  }, []);

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

  const handleDeletePaper = (id: number) => {
    setPapers((prev) => prev.filter((paper) => paper.id !== id));
  };

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-8 text-slate-900 md:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111111] text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-[28px] font-semibold leading-none tracking-tight text-slate-900">
                AutoGrade
              </h1>
              <p className="mt-1 text-sm text-slate-500">Question Handler</p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-50 active:bg-slate-100"
          >
            <Lightbulb className="h-4 w-4" />
            Helpful Tips
          </button>
        </header>

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
                multiple
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
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span>{formatFileSize(item.file.size)}</span>
                        <span>•</span>
                        <span>{item.progress < 100 ? `Uploading ${item.progress}%` : 'Upload complete'}</span>
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
          <div className="flex items-center justify-between px-5 py-4 md:px-6">
            <div>
              <h3 className="text-[22px] font-semibold tracking-tight text-slate-900">
                Your Papers
              </h3>
              <p className="mt-1 text-sm text-slate-500">
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
                  <th className="px-5 py-4 text-right font-medium md:px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {papers.map((paper, index) => (
                  <tr
                    key={paper.id}
                    className="animate-[fadeIn_0.28s_ease] border-t border-slate-100 text-slate-700 transition-colors duration-200 hover:bg-slate-50/70"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <td className="px-5 py-4 md:px-6">
                      <div className="flex items-center gap-2 text-slate-500">
                        <FileText className="h-4 w-4" />
                        <span>{paper.code}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">{paper.name}</td>
                    <td className="px-5 py-4">
                      {paper.status === 'success' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          <Clock3 className="h-3.5 w-3.5" />
                          Processing
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">{paper.marks}</td>
                    <td className="px-5 py-4 text-slate-500">{paper.uploaded}</td>
                    <td className="px-5 py-4 md:px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 active:bg-slate-200"
                        >
                          <Eye className="h-4 w-4" />
                          Open
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePaper(paper.id)}
                          className="inline-flex items-center justify-center rounded-full p-2 text-slate-400 transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
