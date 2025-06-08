import { NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { v4 as uuid } from 'uuid'

const projectId = process.env.GOOGLE_PROJECT_ID as string
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL as string
const rawKey = process.env.GOOGLE_PRIVATE_KEY as string
const privateKey = rawKey?.replace(/\\n/g, '\n')

const storage = new Storage({
  projectId,
  credentials: { client_email: clientEmail, private_key: privateKey },
})
const bucket = storage.bucket('my-test-app-bucket')

export async function POST(req: Request) {
  try {
    const data = await req.formData()
    const file = data.get('video')
    if (!file || !(file instanceof File)) {
      return new NextResponse('no file', { status: 400 })
    }
    const bytes = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()
    const fileId = uuid()
    const gcsFile = bucket.file(`videos/${fileId}.${ext}`)
    await gcsFile.save(bytes, { resumable: false })
    const [publicUrl] = await gcsFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
    })
    return NextResponse.json({ videoId: fileId, videoUrl: publicUrl })
  } catch (e: unknown) {
    console.error(e)
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    return new NextResponse(message, { status: 500 })
  }
}
