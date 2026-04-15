import * as React from 'react';
import { CheckCircle2, Clock3, Loader2, Lock, AlertCircle } from 'lucide-react';

export function normalizeStatus(s: string): string {
  const u = (s ?? '').toUpperCase();
  if (['READY', 'COMPLETED', 'COMPLETE', 'DONE', 'INGESTED', 'VALIDATED', 'INDEXED', 'PROCESSED', 'TERMINATE', 'TERMINATED'].includes(u)) return 'SUCCESS';
  if (['ERROR', 'FAILURE', 'INVALID'].includes(u)) return 'FAILED';
  if (['IN_PROGRESS', 'PROCESSING', 'QUEUED', 'STARTED', 'UPLOADING', 'INGESTING'].includes(u)) return 'RUNNING';
  return u;
}

export function isTerminal(s: string) {
  return ['SUCCESS', 'FINALIZED', 'FAILED', 'TIMEOUT'].includes(normalizeStatus(s));
}

export function isActive(s: string) {
  return ['PENDING', 'RUNNING'].includes(normalizeStatus(s));
}

export function StatusBadge({ status }: { status: string }) {
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
      label: 'Processing',
    },
    SUCCESS: {
      cls: 'bg-emerald-50 text-emerald-700',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: 'Ready',
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
    label: norm || 'Processing',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.cls}`}>
      {c.icon}
      {c.label}
    </span>
  );
}
