import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchRetry } from "@/lib/fetchRetry";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const incomingForm = await req.formData();

    const file = incomingForm.get("file");
    const exam_id = incomingForm.get("exam_id");
    const notes = incomingForm.get("notes");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const formData = new FormData();
    formData.append("file", file);

    if (typeof exam_id === "string") {
      formData.append("exam_id", exam_id);
    }

    if (typeof notes === "string") {
      formData.append("notes", notes);
    }

    const res = await fetchRetry(
      `https://edgenai-api.azure-api.net/api/v2/qh/qh_api_upload_paper?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.EDAI_API_KEY ?? "",
        },
        body: formData,
      },
    );

    const data = await res.json().catch(() => null);

    return NextResponse.json(data ?? { error: "Upload failed" }, {
      status: res.ok ? 200 : res.status,
    });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
