import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchRetry } from '@/lib/fetchRetry';

const BASE = 'https://edgenai-api.azure-api.net/api/v2';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const outForm = new FormData();
  outForm.append('file', file);
  const examId = form.get('exam_id');
  if (typeof examId === 'string') outForm.append('exam_id', examId);
  const notes = form.get('notes');
  if (typeof notes === 'string') outForm.append('notes', notes);

  const res = await fetchRetry(
    `${BASE}/sh/sh_api_upload_sample_answer?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY ?? '',
      },
      body: outForm,
    }
  );

  const data = await res.json().catch(() => null);
  return NextResponse.json(data ?? { error: 'Upload failed' }, { status: res.ok ? 200 : res.status });
}
