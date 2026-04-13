import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchRetry } from '@/lib/fetchRetry';

const BASE = 'https://edgenai-api.azure-api.net/api/v2';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const paperId = request.nextUrl.searchParams.get('paper_id');
  if (!paperId) return NextResponse.json({ error: 'Missing paper_id' }, { status: 400 });

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const candidates = [
    `rh_api_get_rubric_json`,
    `rh_api_get_rubric`,
    `rh_api_rubric_json`,
    `rh_api_view_rubric`,
  ];

  let res: Response | null = null;
  let usedEndpoint = '';
  for (const fn of candidates) {
    const r = await fetchRetry(
      `${BASE}/rh/${paperId}/${fn}?token=${encodeURIComponent(token)}`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY ?? '',
          Accept: 'application/json',
        },
      },
      1,
      false,
    );
    if (r.status !== 404) { res = r; usedEndpoint = fn; break; }
  }

  if (!res) {
    console.log('[rh/get] all endpoints returned 404 for paper_id:', paperId);
    return NextResponse.json({ error: 'Rubric content endpoint not found' }, { status: 404 });
  }

  const data = await res.json().catch(() => null);
  console.log(`[rh/get] endpoint=${usedEndpoint} status=${res.status} response:`, JSON.stringify(data));
  return NextResponse.json(data ?? {}, { status: res.ok ? 200 : res.status });
}
