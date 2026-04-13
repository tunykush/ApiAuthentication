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

  const res = await fetchRetry(
    `${BASE}/sh/${paperId}/status?token=${encodeURIComponent(token)}`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY ?? '',
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  );

  const data = await res.json().catch(() => null);
  return NextResponse.json(data ?? {}, { status: res.ok ? 200 : res.status });
}
