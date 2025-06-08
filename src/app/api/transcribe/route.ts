import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { Storage } from '@google-cloud/storage'
import { SpeechClient } from '@google-cloud/speech'
import { TranslationServiceClient } from '@google-cloud/translate'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { existsSync } from 'fs'

const localFfmpeg = join(
  process.cwd(),
  'node_modules/ffmpeg-static',
  process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
)
const resolvedFfmpeg =
  process.env.FFMPEG_PATH || (existsSync(localFfmpeg) ? localFfmpeg : ffmpegStatic || '')
ffmpeg.setFfmpegPath(resolvedFfmpeg)

const projectId = process.env.GOOGLE_PROJECT_ID as string
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL as string
const rawKey = process.env.GOOGLE_PRIVATE_KEY as string
const privateKey = rawKey?.replace(/\\n/g, '\n')

const storage = new Storage({
  projectId,
  credentials: { client_email: clientEmail, private_key: privateKey },
})
const bucket = storage.bucket('my-test-app-bucket')

const speech = new SpeechClient({
  projectId,
  credentials: { client_email: clientEmail, private_key: privateKey },
})

const translate = new TranslationServiceClient({
  projectId,
  credentials: { client_email: clientEmail, private_key: privateKey },
})

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const originalLang = (form.get('originalLang') || 'auto').toString()
    const targetLangs = form.get('targetLangs')
      ? JSON.parse(form.get('targetLangs')!.toString())
      : []

    let videoBuffer: Buffer | null = null
    const file = form.get('video')
    if (file && file instanceof File && file.size > 0) {
      videoBuffer = Buffer.from(await file.arrayBuffer())
    } else if (form.get('videoUrl')) {
      const url = form.get('videoUrl')!.toString()
      const res = await fetch(url)
      videoBuffer = Buffer.from(await res.arrayBuffer())
    } else {
      return new NextResponse('No file uploaded or videoUrl provided', { status: 400 })
    }

    const inPath = join(tmpdir(), `${randomUUID()}.mp4`)
    const outPath = join(tmpdir(), `${randomUUID()}.wav`)
    await fs.writeFile(inPath, videoBuffer)

    await new Promise((resolve, reject) => {
      ffmpeg(inPath)
        .audioChannels(1)
        .audioFrequency(16000)
        .audioCodec('pcm_s16le')
        .format('wav')
        .on('error', reject)
        .on('end', resolve)
        .save(outPath)
    })

    const wavKey = `audio/${randomUUID()}.wav`
    await bucket.upload(outPath, {
      destination: wavKey,
      metadata: { contentType: 'audio/wav' },
      resumable: false,
    })
    const gcsUri = `gs://${bucket.name}/${wavKey}`
    await Promise.all([fs.unlink(inPath), fs.unlink(outPath)])

    const speechConfig: any = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode:
        originalLang === 'auto'
          ? 'en-US'
          : `${originalLang}-${originalLang.toUpperCase()}`,
      alternativeLanguageCodes: originalLang === 'auto' ? ['ru-RU', 'th-TH'] : [],
      enableWordTimeOffsets: true,
      enableAutomaticPunctuation: true,
    }
    const [operation] = await (speech.longRunningRecognize({
      config: speechConfig,
      audio: { uri: gcsUri },
    }) as any)
    const [speechResp] = await operation.promise()

    const segments = (speechResp.results || []).map((r, idx) => {
      const alt = r.alternatives?.[0] || {}
      const words = (alt.words || []).map((w) => ({
        word: w.word,
        start: Number(w.startTime?.seconds) + (w.startTime?.nanos || 0) / 1e9,
        end: Number(w.endTime?.seconds) + (w.endTime?.nanos || 0) / 1e9,
      }))
      const start = words[0]?.start ?? 0
      const end = words[words.length - 1]?.end ?? 0
      return {
        id: idx,
        start,
        end,
        text: (alt.transcript || '').trim(),
        words,
        translations: {} as Record<string, string>,
      }
    })

    if (targetLangs.length) {
      const parent = `projects/${projectId}/locations/global`
      const texts = segments.map((s) => s.text)
      await Promise.all(
        targetLangs.map(async (lang: string) => {
          const [trRes] = await translate.translateText({
            parent,
            contents: texts,
            targetLanguageCode: lang,
            mimeType: 'text/plain',
          })
          trRes.translations?.forEach((t, i) => {
            segments[i].translations[lang] = t.translatedText || ''
          })
        })
      )
    }

    return NextResponse.json({ originalLang, targetLangs, segments })
  } catch (e: unknown) {
    console.error(e)
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    return new NextResponse(message, { status: 500 })
  }
}
