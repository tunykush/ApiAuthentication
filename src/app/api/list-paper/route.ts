import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const res = await fetch(
      "https://edgenai-api.azure-api.net/api/v2/qh/list_papers",
      {
        method: "GET",
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.EDAI_API_KEY ?? "",
          "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => null);

    return NextResponse.json(data ?? [], {
      status: res.status,
    });
  } catch (error) {
    console.error("list paper error:", error);
    return NextResponse.json({ error: "Failed to fetch papers" }, { status: 500 });
  }
}