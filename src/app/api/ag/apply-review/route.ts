import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchRetry } from '@/lib/fetchRetry';

const BASE = 'https://edgenai-api.azure-api.net/api/v2';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (
    !body?.paper_id ||
    !body?.submission_id ||
    !Array.isArray(body?.overrides) ||
    body.overrides.length === 0
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const res = await fetchRetry(
    `${BASE}/ag/paper/${body.paper_id}/submission/${body.submission_id}/ag_api_apply_review?token=${encodeURIComponent(token)}`,
    {
      method: 'PATCH',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY ?? '',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ overrides: body.overrides }),
    }
  );

  const data = await res.json().catch(() => null);
  return NextResponse.json(data ?? {}, { status: res.ok ? 200 : res.status });
}
