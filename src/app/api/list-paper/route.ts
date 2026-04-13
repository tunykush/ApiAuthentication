import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchRetry } from "@/lib/fetchRetry";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

  const res = await fetchRetry(
    `https://edgenai-api.azure-api.net/api/v2/qh/list_papers?token=${encodeURIComponent(token)}`,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.EDAI_API_KEY ?? "",
      },
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => null);
  return NextResponse.json(data ?? [], { status: res.ok ? 200 : res.status });
}
