'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import type { VideoDoc } from '@/types/index.types'

export default function VideoViewPage() {
  const { videoId } = useParams<{ videoId: string }>()
  const router = useRouter()
  const [videoDoc, setVideoDoc] = useState<VideoDoc | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!videoId) return
    ;(async () => {
      try {
        const docRef = doc(db, 'videos', videoId)
        const snap = await getDoc(docRef)
        if (!snap.exists()) {
          throw new Error('Видео не найдено')
        }
        const data = snap.data() as VideoDoc
        setVideoDoc({ ...data, updated: data.updated ?? null })
      } catch (e: unknown) {
        console.error(e)
        setError(e instanceof Error ? e.message : 'Unknown error')
      }
    })()
  }, [videoId])

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/videos')
    }
  }

  if (error) {
    return <p className="text-red-600">Ошибка: {error}</p>
  }
  if (!videoDoc) {
    return <p className="text-gray-500">Загрузка видео…</p>
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <button
        onClick={handleBack}
        className="self-start px-4 py-2 text-gray-700 bg-gray-300 rounded"
      >
        Назад
      </button>
      <VideoPlayer
        src={videoDoc.src}
        subtitles={videoDoc.subtitle}
        originalLang={videoDoc.originalLang}
      />
    </div>
  )
}
