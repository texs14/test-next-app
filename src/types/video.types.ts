export type VideoMeta = {
  videoId: string;
  name: string;
  size: number;
  updated: string | null;
  /** URL to the video preview (signed URL stored in Firestore) */
  videoUrl: string;
};