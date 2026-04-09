import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const file = formData.get('file') as File
    const exam_id = formData.get('exam_id') as string | null
    const notes = formData.get('notes') as string | null

    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    if (!file || !token) {
      return NextResponse.json({ error: 'Missing file or token' }, { status: 400 })
    }

    // 👉 convert file → base64
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    
    console.log('👉 base64 length:', base64.length)
    console.log('👉 base64 preview:', base64.slice(0, 100))
    const res = await fetch(
      `https://edgenai-api.azure-api.net/api/v2/qh/qh_api_upload_paper?token=${token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY!,
        },
        body: JSON.stringify({
          exam_id: exam_id ? Number(exam_id) : undefined,
          file: base64,
          notes: notes || '',
        }),
      }
    )

    const data = await res.json()
    console.log('data :>> ', data);
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}