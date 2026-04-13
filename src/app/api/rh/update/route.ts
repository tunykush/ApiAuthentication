import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchRetry } from '@/lib/fetchRetry';

const BASE = 'https://edgenai-api.azure-api.net/api/v2';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.paper_id) return NextResponse.json({ error: 'Missing paper_id' }, { status: 400 });

  const { paper_id, rubric } = body;
  if (!rubric || typeof rubric !== 'object' || Array.isArray(rubric)) {
    return NextResponse.json({ error: 'Missing or invalid rubric payload' }, { status: 400 });
  }

  const res = await fetchRetry(
    `${BASE}/rh/${paper_id}/rh_api_update_rubric?token=${encodeURIComponent(token)}`,
    {
      method: 'PUT',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY ?? '',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(rubric),
    }
  );

  const data = await res.json().catch(() => null);
  return NextResponse.json(data ?? {}, { status: res.ok ? 200 : res.status });
}
