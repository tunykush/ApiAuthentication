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

  // retryOn412 = false: fail fast on PREC412 so the client can show
  // a clear "still processing, try again in a moment" message instead
  // of hanging for 75+ seconds before failing.
  const res = await fetchRetry(
    `${BASE}/rh/${body.paper_id}/rh_api_create_rubric?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY ?? '',
        Accept: 'application/json',
      },
    },
    8,     // up to 8 attempts for 429 rate-limit
    false, // do NOT retry 412 — return it immediately
  );

  const data = await res.json().catch(() => null);

  if (res.status === 412) {
    return NextResponse.json(
      { error: 'PREC412', message: 'Paper is still being processed by the backend. Please wait a minute and try again.' },
      { status: 412 }
    );
  }

  return NextResponse.json(data ?? {}, { status: res.ok ? 200 : res.status });
}
