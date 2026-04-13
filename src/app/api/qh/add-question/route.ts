import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchRetry } from '@/lib/fetchRetry';

const BASE = 'https://edgenai-api.azure-api.net/api/v2';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { paper_id, ...rest } = body;
  if (!paper_id) return NextResponse.json({ error: 'Missing paper_id' }, { status: 400 });

  const res = await fetchRetry(
    `${BASE}/qh/${paper_id}/qh_api_add_question?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY ?? '',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(rest),
    }
  );

  const data = await res.json().catch(() => null);
  return NextResponse.json(data ?? {}, { status: res.ok ? 200 : res.status });
}
