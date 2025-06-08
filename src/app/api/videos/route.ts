import { NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

const storage = new Storage()
const bucket = storage.bucket('my-test-app-bucket')

export async function GET() {
  try {
    const [files] = await bucket.getFiles({ prefix: 'videos/' })
    const data = files.map((f) => ({
      videoId: f.name.split('/')[1]?.split('.')[0] ?? '',
      name: f.metadata.name as string,
      size: Number(f.metadata.size),
      updated: f.metadata.updated as string,
      videoUrl: `https://storage.googleapis.com/${bucket.name}/${f.name}`,
    }))
    return NextResponse.json(data)
  } catch (e: unknown) {
    console.error(e)
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    return new NextResponse(message, { status: 500 })
  }
}
