export type VideoMeta = {
  videoId: string
  name: string
  size: number
  updated: string | null
  videoUrl: string
}

export default function VideoCard({ video }: { video: VideoMeta }) {
  return (
    <div className="border rounded p-4 flex flex-col items-center gap-2">
      <video
        src={video.videoUrl}
        controls
        className="w-full h-auto"
      />
      <p className="font-semibold text-center">{video.name}</p>
    </div>
  )
}
