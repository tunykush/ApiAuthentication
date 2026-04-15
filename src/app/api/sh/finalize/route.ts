import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchRetry } from '@/lib/fetchRetry';

const BASE = 'https://edgenai-api.azure-api.net/api/v2';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.paper_id) return NextResponse.json({ error: 'Missing paper_id' }, { status: 400 });

  // Backend (FastAPI/Pydantic) requires a JSON body
  const res = await fetchRetry(
    `${BASE}/sh/${body.paper_id}/sh_api_finalize?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY ?? '',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ paper_id: Number(body.paper_id) }),
    }
  );

  const data = await res.json().catch(() => null);
  console.log(`[sh/finalize] paper_id=${body.paper_id} status=${res.status}`, JSON.stringify(data));
  return NextResponse.json(data ?? {}, { status: res.ok ? 200 : res.status });
}
