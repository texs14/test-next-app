import { NextResponse } from 'next/server'
import { TranslationServiceClient } from '@google-cloud/translate'
import { LanguageServiceClient } from '@google-cloud/language'
import romanize from '@dehoist/romanize-thai'
import fs from 'fs'
import path from 'path'
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

let thai2eng: any[] | null = null
let eng2thai: any[] | null = null
async function ensureDict() {
  if (!thai2eng || !eng2thai) {
    const pkgDir = path.dirname(require.resolve('thaidict/package.json'))
    const [t2eData, e2tData] = await Promise.all([
      fs.promises.readFile(path.join(pkgDir, 'data', 'thai2eng.json'), 'utf8'),
      fs.promises.readFile(path.join(pkgDir, 'data', 'eng2thai.json'), 'utf8'),
    ])
    thai2eng = JSON.parse(t2eData)
    eng2thai = JSON.parse(e2tData)
  }
}

function searchDict(term: string) {
  if (!thai2eng || !eng2thai) return []
  const isThai = /[ก-๙]/.test(term)
  const regex = new RegExp(
    '^' + term.replace(/\*/g, '.*').replace(/#/g, '(.)') + '$',
    isThai ? '' : 'i',
  )
  const list = isThai ? thai2eng : eng2thai
  const results = [] as any[]
  for (const entry of list) {
    if (regex.test(entry.search)) {
      results.push(entry)
      if (results.length >= 3) break
    }
  }
  return results
}

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

    await ensureDict()

    const romanized = romanize(text)

    const words = tokenizeThaiSentence(text)
    const wordTones = words.map(w => ({ word: w, tone: detectTone(w) }))

    const [syntax] = await languageClient.analyzeSyntax({
      document: { content: text, type: 'PLAIN_TEXT', language: 'th' },
    })
    const pos = (syntax.tokens || []).map(t => ({
      text: t.text?.content || '',
      tag: t.partOfSpeech?.tag || '',
    }))

    const parent = `projects/${projectId}/locations/global`
    const targetLangs = ['en', 'ru', 'zh']
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

    const dictEntries = searchDict(text)
    const examples: any[] = []
    for (const entry of dictEntries) {
      if (entry.sample) {
        const sampleTranslations: Record<string, string> = {}
        await Promise.all(
          targetLangs.map(async lang => {
            const [tr] = await translateClient.translateText({
              parent,
              contents: [entry.sample],
              mimeType: 'text/plain',
              sourceLanguageCode: 'th',
              targetLanguageCode: lang,
            })
            sampleTranslations[lang] = tr.translations?.[0]?.translatedText || ''
          })
        )
        examples.push({ text: entry.sample, translations: sampleTranslations })
      }
    }

    return NextResponse.json({
      romanized,
      wordTones,
      pos,
      translations,
      examples,
    })
  } catch (e: unknown) {
    console.error(e)
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    return new NextResponse(message, { status: 500 })
  }
}
