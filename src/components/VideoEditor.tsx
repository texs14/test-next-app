'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Language, LanguageMetaForm } from './LanguageMetaForm'
import UploadTranscriber from './UploadTranscriber'
import { SegmentEditor } from './SegmentEditor'
import VideoPlayer from './VideoPlayer/VideoPlayer'
import type { Segment, SubtitleData, VideoDoc } from '@/types/index.types'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/app/firebase'
import { buildSentenceSegments } from './VideoPlayer/halpers'

export default function VideoEditor() {
  const params = useParams()
  const router = useRouter()
  const videoId = (params as { videoId?: string }).videoId

  const [meta, setMeta] = useState({
    originalLang: 'th' as Language,
    targetLangs: [] as Language[],
    difficulty: 'Beginner',
    tags: '',
  })
  const [videoDoc, setVideoDoc] = useState<VideoDoc | null>(null)
  const [editedSubs, setEditedSubs] = useState<SubtitleData | null>(null)
  const [translating, setTranslating] = useState(false)
  const [loadingDoc, setLoadingDoc] = useState(false)

  useEffect(() => {
    if (!videoId) return
    setLoadingDoc(true)
    ;(async () => {
      try {
        const docRef = doc(db, 'videos', videoId)
        const snap = await getDoc(docRef)
        if (!snap.exists()) {
          alert('Видео для редактирования не найдено')
          router.push('/')
          return
        }
        const d = snap.data() as any

        const loadedMeta = {
          originalLang: (d.originalLang || 'auto') as Language,
          targetLangs: d.targetLangs || [],
          difficulty: d.difficulty || 'Beginner',
          tags: Array.isArray(d.tags) ? d.tags.join(', ') : '',
        }
        setMeta(loadedMeta)

        const loadedDoc: VideoDoc = {
          src: d.src as string,
          previewSrc: d.previewSrc as string,
          originalLang: d.originalLang,
          targetLangs: d.targetLangs,
          difficulty: d.difficulty,
          tags: d.tags,
          subtitle: d.subtitle as SubtitleData,
          name: d.name as string,
          size: d.size as number,
          updated: d.updated || null,
        }
        setVideoDoc(loadedDoc)
        setEditedSubs(d.subtitle as SubtitleData)
      } catch (e: any) {
        console.error(e)
        alert('Ошибка при загрузке видео для редактирования: ' + e.message)
        router.push('/')
      } finally {
        setLoadingDoc(false)
      }
    })()
  }, [videoId, router])

  const handleUploadComplete = (url: string, subtitle: SubtitleData) => {
    const docData: VideoDoc = {
      src: url,
      previewSrc: `${url}#t=0.1`,
      originalLang: meta.originalLang,
      targetLangs: meta.targetLangs,
      difficulty: meta.difficulty,
      tags: meta.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t),
      subtitle,
      name: 'uploaded',
      size: 0,
      updated: null,
    }
    setVideoDoc(docData)
    setEditedSubs(buildSentenceSegments(subtitle))
  }

  const handleTranslate = async () => {
    if (!editedSubs || !videoDoc) return
    setTranslating(true)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: editedSubs.segments.map(s => ({ id: s.id, text: s.text })),
          targetLangs: videoDoc.targetLangs,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { segments: trSegments } = await res.json()

      setEditedSubs(prev => {
        if (!prev) return prev
        const merged = prev.segments.map((s: Segment) => {
          const tr = trSegments.find((t: any) => t.id === s.id)
          return tr ? { ...s, translations: tr.translations } : s
        })
        return { ...prev, segments: merged }
      })
    } catch (e: any) {
      alert('Ошибка перевода: ' + e.message)
    } finally {
      setTranslating(false)
    }
  }

  const handleSave = async () => {
    if (!videoDoc || !editedSubs) return
    const idToUse =
      videoId || new URL(videoDoc.src).pathname.split('/').pop()?.split('.')[0] || ''
    const updatedData: any = {
      src: videoDoc.src,
      previewSrc: videoDoc.previewSrc,
      originalLang: meta.originalLang,
      targetLangs: meta.targetLangs,
      difficulty: meta.difficulty,
      tags: meta.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t),
      subtitle: editedSubs,
      name: videoDoc.name,
      size: videoDoc.size,
      updated: new Date(),
      createdBy: auth.currentUser?.uid || null,
    }
    try {
      await setDoc(doc(db, 'videos', idToUse), updatedData)
      localStorage.setItem(`videoDoc_${idToUse}`, JSON.stringify(updatedData))
      alert('Сохранено!')
      router.push(`/video/${idToUse}`)
    } catch (e: any) {
      console.error(e)
      alert('Ошибка при сохранении: ' + e.message)
    }
  }

  return (
    <div className="p-4 space-y-8 ">
      <div className='w-full max-w-4xl flex flex-col items-center justify-center gap-[16px]'>
      <LanguageMetaForm
        {...meta}
        onChange={fields => {
          setMeta(prev => ({ ...prev, ...(fields as any) }))
          if (!videoDoc) return
          setVideoDoc(prev => {
            if (!prev) return prev
            return { ...prev, targetLangs: fields.targetLangs ?? [] }
          })
        }}
        />

      <UploadTranscriber
        originalLang={meta.originalLang}
        targetLangs={meta.targetLangs}
        difficulty={meta.difficulty}
        tags={meta.tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t)}
        onComplete={handleUploadComplete}
        disabled={!!videoId}
      />
        </div>

      {videoDoc && editedSubs && !loadingDoc && (
        <>
          <div className="w-full max-w-4xl mx-auto">
            <VideoPlayer
              src={videoDoc.src}
              subtitles={editedSubs}
              originalLang={videoDoc.originalLang as Language}
            />
          </div>

          <button
            onClick={handleTranslate}
            disabled={translating}
            className="px-6 py-2 text-white bg-blue-600 rounded"
          >
            {translating ? 'Перевод...' : 'Перевести'}
          </button>

          <SegmentEditor
            segments={editedSubs.segments}
            originalLang={videoDoc.originalLang as Language}
            targetLangs={videoDoc.targetLangs as Language[]}
            onChange={newSegments =>
              setEditedSubs(prev => (prev ? { ...prev, segments: newSegments } : null))
            }
          />

          <button onClick={handleSave} className="px-6 py-2 mt-6 text-white bg-green-600 rounded">
            {videoId ? 'Сохранить изменения' : 'Сохранить новое видео'}
          </button>
        </>
      )}

      {loadingDoc && <p className="text-gray-500">Загрузка данных видео для редактирования…</p>}
    </div>
  )
}
