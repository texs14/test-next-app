import { NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

const projectId = process.env.GOOGLE_PROJECT_ID as string;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL as string;
const rawKey = process.env.GOOGLE_PRIVATE_KEY as string;

const privateKey = rawKey?.replace(/\\n/g, '\n');

const storage = new Storage({
  projectId,
  credentials: { client_email: clientEmail, private_key: privateKey },
});
const bucket = storage.bucket('my-test-app-bucket')

export async function GET() {
  try {
    console.log('GET', bucket)
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
