import { NextResponse } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/app/firebase'

export async function GET() {
  try {
    const snap = await getDocs(collection(db, 'videos'))
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
