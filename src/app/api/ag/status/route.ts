import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchRetry } from '@/lib/fetchRetry';

const BASE = 'https://edgenai-api.azure-api.net/api/v2';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const submissionId = request.nextUrl.searchParams.get('submission_id');
  if (!submissionId) return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const stream = request.nextUrl.searchParams.get('stream') !== 'false';

  const url = stream
    ? `${BASE}/ag/paper/${submissionId}/ag_api_status?stream=true&token=${encodeURIComponent(token)}`
    : `${BASE}/ag/paper/${submissionId}/ag_api_status?token=${encodeURIComponent(token)}`;

  const externalRes = await fetchRetry(url, {
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY ?? '',
      Accept: stream ? 'text/event-stream' : 'application/json',
    },
  }).catch(() => null as unknown as Response);

  if (!externalRes?.ok) {
    return NextResponse.json({ error: 'Status unavailable' }, { status: 502 });
  }

  if (stream) {
    if (!externalRes.body) return NextResponse.json({ error: 'No stream' }, { status: 502 });
    return new Response(externalRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  const data = await externalRes.json().catch(() => null);
  return NextResponse.json(data ?? {}, { status: 200 });
}
