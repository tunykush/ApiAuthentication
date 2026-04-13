import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paperId = searchParams.get("paper_id");

    if (!paperId) {
      return NextResponse.json({ error: "Missing paper_id" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const res = await fetch(
      `https://edgenai-api.azure-api.net/api/v2/qh/${paperId}/qh_api_delete?token=${encodeURIComponent(token)}`,
      {
        method: "DELETE",
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.EDAI_API_KEY ?? "",
        },
      }
    );

    const data = await res.json().catch(() => null);

    return NextResponse.json(data ?? {}, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
