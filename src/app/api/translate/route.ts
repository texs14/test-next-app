import { NextResponse } from 'next/server'
import { TranslationServiceClient } from '@google-cloud/translate'

const projectId = process.env.GOOGLE_PROJECT_ID as string
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL as string
const rawKey = process.env.GOOGLE_PRIVATE_KEY as string
const privateKey = rawKey?.replace(/\\n/g, '\n')

const client = new TranslationServiceClient({
  projectId,
  credentials: { client_email: clientEmail, private_key: privateKey },
})

export async function POST(req: Request) {
  try {
    const { segments, targetLangs, sourceLang } = await req.json()
    if (!Array.isArray(segments) || !targetLangs?.length) {
      return new NextResponse('segments and targetLangs required', { status: 400 })
    }
    const parent = `projects/${projectId}/locations/global`
    const texts = segments.map((s: any) => s.text)
    const translationsByLang: Record<string, string[]> = {}
    await Promise.all(
      targetLangs.map(async (lang: string) => {
        const [response] = await client.translateText({
          parent,
          contents: texts,
          mimeType: 'text/plain',
          sourceLanguageCode: sourceLang,
          targetLanguageCode: lang,
        })
        translationsByLang[lang] = response.translations!.map((t) => t.translatedText || '')
      })
    )
    const result = segments.map((s: any, idx: number) => ({
      id: s.id,
      translations: targetLangs.reduce((acc: any, lang: string) => {
        acc[lang] = translationsByLang[lang][idx] || ''
        return acc
      }, {}),
    }))
    return NextResponse.json({ segments: result })
  } catch (e: unknown) {
    console.error(e)
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    return new NextResponse(message, { status: 500 })
  }
}
