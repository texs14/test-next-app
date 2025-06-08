import React from 'react'
import Link from 'next/link'
import type { VideoMeta } from '@/types/video.types'

interface Props {
  video: VideoMeta;
}

export default function VideoCard({ video }: Props) {

  return (
    <div className="relative group">
      {/* Обёртка с кликом по превью */}
      <Link
        href={`/videos/${video.videoId}`}
        className="space-y-2 transition cursor-pointer hover:opacity-90"
      >
        <video
          src={video.videoUrl + '#t=0.1'}
          controls
          muted
          className="w-full rounded shadow aspect-video"
        />
        <div className="text-sm">
          <p className="font-medium truncate">{video.name}</p>
          <p className="text-gray-500">
            {(video.size / 1024 / 1024).toFixed(1)} MB ·{' '}
            {video.updated ? new Date(video.updated).toLocaleString() : '—'}
          </p>
        </div>
      </Link>

      {/* Кнопка "Редактировать" */}
      <Link
        href={`/upload/${video.videoId}`}
        className="absolute px-2 py-1 text-xs text-white transition bg-blue-600 rounded opacity-0 top-2 right-2 group-hover:opacity-100"
      >
        Редактировать
      </Link>
    </div>
  );
}
