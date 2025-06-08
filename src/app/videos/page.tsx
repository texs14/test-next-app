import VideoCard from '@/components/VideoCard'
import { headers } from 'next/headers'

import {VideoMeta} from '@/types/video.types'

async function getVideos() {
    const host = (await headers()).get('host')
    const protocol = host?.startsWith('localhost') ? 'http' : 'https'
    const res = await fetch(`${protocol}://${host}/api/videos`, { cache: 'no-store' })
    console.log('res', res)
  if (!res.ok) {
    throw new Error('Failed to load videos')
  }
  return (await res.json()) as VideoMeta[]
}

export default async function VideosPage() {
  let videos: VideoMeta[] = []
  let error: string | null = null
  try {
    videos = await getVideos()
    console.log('videos', videos)
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : 'Unknown error'
  }

  if (error) {
    return <p className="text-red-600">Ошибка: {error}</p>
  }

  return (
    <div className="flex flex-col items-center w-full gap-6 px-4">
      <h1 className="text-2xl font-bold">Все видео</h1>

      <div className="grid w-full max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <VideoCard key={v.videoId} video={v} />
        ))}
      </div>

      {!videos.length && <p>Нет загруженных видео…</p>}
    </div>
  )
}
