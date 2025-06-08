import { NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebaseAdmin'

export async function GET() {
  try {
    const db = getAdminFirestore()
    const snap = await db.collection('videos').get()
    const data = snap.docs.map(doc => {
      const d = doc.data() as any
      return {
        videoId: doc.id,
        name: d.name as string,
        size: d.size as number,
        updated: d.updated ? d.updated.toDate().toISOString() : null,
        videoUrl: (d.previewSrc as string) || (d.src as string),
      }
    })
    return NextResponse.json(data)
  } catch (e: unknown) {
    console.error(e)
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    return new NextResponse(message, { status: 500 })
  }
}
