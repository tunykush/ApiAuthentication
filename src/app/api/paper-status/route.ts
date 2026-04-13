import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchRetry } from "@/lib/fetchRetry";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const paperId = req.nextUrl.searchParams.get("paper_id");
  if (!paperId) return NextResponse.json({ error: "Missing paper_id" }, { status: 400 });

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

  const res = await fetchRetry(
    `https://edgenai-api.azure-api.net/api/v2/qh/${paperId}/status?token=${encodeURIComponent(token)}`,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.EDAI_API_KEY ?? "",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    return NextResponse.json(errData ?? { error: "Failed to fetch status" }, { status: res.status });
  }
  const data = await res.json().catch(() => null);
  return NextResponse.json(data ?? {}, { status: 200 });
}
