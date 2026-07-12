import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SUPPORTED_FORMATS = [
  {
    id: "bestvideo+bestaudio",
    label: "Best Quality (Auto)",
    ext: "mp4",
    type: "video" as const,
    description: "Highest available quality with audio merged automatically",
  },
  {
    id: "137+140",
    label: "1080p MP4",
    ext: "mp4",
    type: "video" as const,
    description: "Full HD 1080p video with AAC audio",
  },
  {
    id: "136+140",
    label: "720p MP4",
    ext: "mp4",
    type: "video" as const,
    description: "HD 720p video with AAC audio",
  },
  {
    id: "135+140",
    label: "480p MP4",
    ext: "mp4",
    type: "video" as const,
    description: "SD 480p video with AAC audio",
  },
  {
    id: "134+140",
    label: "360p MP4",
    ext: "mp4",
    type: "video" as const,
    description: "Low quality 360p video",
  },
  {
    id: "18",
    label: "360p MP4 (Legacy)",
    ext: "mp4",
    type: "video" as const,
    description: "Combined 360p video and audio in single file",
  },
  {
    id: "22",
    label: "720p MP4 (Legacy)",
    ext: "mp4",
    type: "video" as const,
    description: "Combined 720p video and audio in single file",
  },
  {
    id: "140",
    label: "Audio AAC 128kbps",
    ext: "m4a",
    type: "audio" as const,
    description: "Audio-only AAC at 128kbps",
  },
  {
    id: "251",
    label: "Audio Opus 160kbps",
    ext: "webm",
    type: "audio" as const,
    description: "High-quality audio-only Opus format",
  },
  {
    id: "bestaudio",
    label: "Best Audio (Auto)",
    ext: "m4a",
    type: "audio" as const,
    description: "Highest quality audio available",
  },
];

router.get("/formats", (_req, res) => {
  res.json(SUPPORTED_FORMATS);
});

export default router;
