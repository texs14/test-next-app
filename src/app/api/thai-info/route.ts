import { NextResponse } from 'next/server'
import { TranslationServiceClient } from '@google-cloud/translate'
import { LanguageServiceClient } from '@google-cloud/language'
import { tokenizeThaiSentence } from '@/utils/thaiTokenizer'

const projectId = process.env.GOOGLE_PROJECT_ID as string
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL as string
const rawKey = process.env.GOOGLE_PRIVATE_KEY as string
const privateKey = rawKey?.replace(/\\n/g, '\n')

const translateClient = new TranslationServiceClient({
  projectId,
  credentials: { client_email: clientEmail, private_key: privateKey },
})

const languageClient = new LanguageServiceClient({
  projectId,
  credentials: { client_email: clientEmail, private_key: privateKey },
})

function detectTone(word: string): string {
  if (word.includes('่')) return 'low'
  if (word.includes('้')) return 'falling'
  if (word.includes('๊')) return 'high'
  if (word.includes('๋')) return 'rising'
  return 'mid'
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json()
    if (!text) {
      return new NextResponse('text is required', { status: 400 })
    }

    const parent = `projects/${projectId}/locations/global`
    const [romanRes] = await translateClient.romanizeText({
      parent,
      contents: [text],
      sourceLanguageCode: 'th',
    })
    const romanized = romanRes.romanizations?.[0]?.romanizedText || ''

    const words = tokenizeThaiSentence(text)
    const wordTones = words.map(w => ({ word: w, tone: detectTone(w) }))

    const [syntax] = await languageClient.analyzeSyntax({
      document: { content: text, type: 'PLAIN_TEXT', language: 'th' },
    })
    const pos = (syntax.tokens || []).map(t => ({
      text: t.text?.content || '',
      tag: t.partOfSpeech?.tag || '',
    }))

    // Google Cloud Translation API requires full BCP-47 codes for some
    // languages. Using plain `zh` causes a 3 INVALID_ARGUMENT error, so we
    // explicitly request Simplified Chinese with `zh-CN`.
    const targetLangs = ['en', 'ru', 'zh-CN']
    const translations: Record<string, string> = {}
    await Promise.all(
      targetLangs.map(async lang => {
        const [resp] = await translateClient.translateText({
          parent,
          contents: [text],
          mimeType: 'text/plain',
          sourceLanguageCode: 'th',
          targetLanguageCode: lang,
        })
        translations[lang] = resp.translations?.[0]?.translatedText || ''
      })
    )

    return NextResponse.json({
      romanized,
      wordTones,
      pos,
      translations,
      examples: [],
    })
  } catch (e: unknown) {
    console.error(e)
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    return new NextResponse(message, { status: 500 })
  }
}
