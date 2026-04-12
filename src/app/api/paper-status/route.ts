import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const paperId = req.nextUrl.searchParams.get("paper_id");

    if (!paperId) {
      return NextResponse.json(
        { error: "Missing paper_id" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 401 }
      );
    }

    const res = await fetch(
      `https://edgenai-api.azure-api.net/api/v2/qh/${paperId}/status?token=${encodeURIComponent(token)}`,
      {
        method: "GET",
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.EDAI_API_KEY ?? "",
        },
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => null);

    return NextResponse.json(
      data ?? { error: "Failed to fetch paper status" },
      { status: res.status }
    );
  } catch (error) {
    console.error("paper-status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}