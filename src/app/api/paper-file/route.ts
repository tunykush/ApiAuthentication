import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BASE = 'https://edgenai-api.azure-api.net/api/v2';

export const runtime = 'nodejs';

// Try multiple Azure endpoint naming patterns — use the first one that returns a file.
const CANDIDATES = [
  'qh_api_download_paper',
  'qh_api_get_paper_file',
  'qh_api_get_paper',
  'qh_api_paper_file',
  'qh_api_download',
  'download',
];

export async function GET(request: NextRequest) {
  const paperId = request.nextUrl.searchParams.get('paper_id');
  if (!paperId) return new NextResponse('Missing paper_id', { status: 400 });

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  for (const fn of CANDIDATES) {
    let res: Response;
    try {
      res = await fetch(
        `${BASE}/qh/${paperId}/${fn}?token=${encodeURIComponent(token)}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY ?? '',
          },
          cache: 'no-store',
        }
      );
    } catch {
      continue;
    }

    if (res.status === 404) continue;

    if (res.ok) {
      const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
      const buffer = await res.arrayBuffer();
      console.log(`[paper-file] paper_id=${paperId} endpoint=${fn} content-type=${contentType} size=${buffer.byteLength}`);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': 'inline',
          'Cache-Control': 'private, max-age=300',
        },
      });
    }
  }

  return new NextResponse('Paper file not available from backend', { status: 404 });
}
