import type { ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEO } from "@/components/layout/seo";
import { Link } from "wouter";

// Rendered as plain text in `answer`; JSX-linked versions are rendered separately
// below for the questions where inline links add real navigational/trust value.
const faqs = [
  // ── Brand & Comparison ───────────────────────────────────────────────────
  {
    question: "What is YTOUDown?",
    answer: "YTOUDown is a fast, browser-based YouTube video downloader designed to make downloading publicly available videos simple and convenient. There's no software to install — just paste your video link, choose an available format, and download directly in your browser.",
  },
  {
    question: "How is YTOUDown different from other YouTube downloaders?",
    answer: "YTOUDown focuses on speed, simplicity, and a clean user experience. Users looking for alternatives to services such as SaveFrom.net, SnapScooper, or 4K Downloader may find YTOUDown to be an easy-to-use web-based option that works directly in the browser without unnecessary complexity, ads, or redirect flows. See our Alternatives page for a full feature comparison.",
  },

  // ── Core Usage ──────────────────────────────────────────────────────────
  {
    question: "How do I download a YouTube video?",
    answer: "Copy the YouTube video URL from your browser, paste it into the input box on the YTOUDown home page, and click 'Get Info'. Once the video information loads, select your preferred quality or format from the list and click 'Download'. A progress indicator will appear, and when the download is ready a link will let you save the file to your device.",
  },
  {
    question: "Is YTOUDown free to use?",
    answer: "Yes. YTOUDown is completely free. There are no subscriptions, no premium tiers, and no account required. You can download videos without signing up or providing any personal information.",
  },
  {
    question: "Do I need to create an account?",
    answer: "No. YTOUDown works without any registration or login. Simply paste a YouTube URL and start downloading immediately.",
  },
  {
    question: "What video qualities are available?",
    answer: "YTOUDown fetches all formats available for a given video directly from YouTube. This typically includes 4K (2160p), 1440p, 1080p, 720p, 480p, 360p, and 240p. The exact options depend on what the video uploader made available. Higher resolutions like 4K are only shown when the source video was uploaded in that quality.",
  },
  {
    question: "Can I download audio only (MP3)?",
    answer: "Yes. When viewing a video's formats, audio-only options appear in the format list. Available audio formats include M4A (AAC) and WebM (Opus). Select any audio format to download just the sound track without video.",
  },
  {
    question: "How do I convert a YouTube video to MP3?",
    answer: "Paste the YouTube URL into YTOUDown, click 'Get Info', then select an audio-only format such as M4A or Opus from the format list and click 'Download'. For true MP3 output, enable the 'Audio only (MP3)' toggle before downloading — this instructs the server to extract and re-encode the audio as MP3 via FFmpeg.",
  },
  {
    question: "Does YTOUDown support YouTube Shorts?",
    answer: "Yes. YouTube Shorts use standard YouTube URLs (youtube.com/shorts/VIDEO_ID) and are fully supported. Paste the URL the same way as any other YouTube video.",
  },
  {
    question: "Can I download YouTube playlists?",
    answer: "Currently, YTOUDown supports downloading individual videos only. Paste a single video URL rather than a playlist URL. Playlist support may be added in a future update.",
  },

  // ── Formats & Quality ────────────────────────────────────────────────────
  {
    question: "What file formats can I download?",
    answer: "Depending on the video, available formats include MP4 (H.264 or VP9), WebM (VP9 or AV1), M4A (AAC audio), and Opus (WebM audio). The MP3 toggle re-encodes audio to MP3. MP4 is the most universally compatible format for video playback.",
  },
  {
    question: "What is the difference between 1080p and 4K?",
    answer: "1080p (Full HD) has a resolution of 1920×1080 pixels. 4K (Ultra HD) has a resolution of 3840×2160 pixels — four times the pixel count. 4K files are significantly larger but look sharper on large displays. For most screens and uses, 1080p is the best balance of quality and file size.",
  },
  {
    question: "Why are some formats missing for my video?",
    answer: "Available formats depend entirely on what the video uploader provided. Not every video is available in 4K or 1080p. Some videos were uploaded in lower resolutions, and some formats may have been removed or restricted by the uploader or YouTube.",
  },
  {
    question: "What is the best format for downloading YouTube videos?",
    answer: "For video, MP4 at the highest available resolution (1080p or higher) is the most compatible choice — it plays on every device and platform without needing additional software. For audio only, M4A (AAC) provides the best quality-to-file-size ratio; MP3 is the most universally compatible if you need broad device support.",
  },

  // ── Performance & Limits ─────────────────────────────────────────────────
  {
    question: "How long does a download take?",
    answer: "Most videos complete within 30–90 seconds. Processing time depends on the video length, selected quality, and server load at the time of the request. A real-time progress indicator shows the current status. Very long videos (over 1 hour) in high quality may take several minutes.",
  },
  {
    question: "Is there a file size or video length limit?",
    answer: "There is no hard file size limit. However, very long videos (over 2 hours) take more time to process. Downloaded files are temporarily stored on the server for up to 1 hour, so be sure to save your file after it's ready.",
  },
  {
    question: "Why can't I download some videos?",
    answer: "Some videos cannot be downloaded because they are private, age-restricted, region-locked, or marked as premium-only content by the uploader. Live streams that are still in progress cannot be downloaded either. If you receive an error, check that the URL is correct, the video is publicly accessible, and try again.",
  },

  // ── Technology ───────────────────────────────────────────────────────────
  {
    question: "What technology powers YTOUDown?",
    answer: "YTOUDown uses yt-dlp (an open-source video downloader maintained by the yt-dlp community) to fetch video information and process downloads. FFmpeg handles media processing tasks such as merging separate video and audio streams. The backend is Node.js with Express, the frontend is React with Vite and Tailwind CSS, and download history is stored in PostgreSQL.",
  },
  {
    question: "What is yt-dlp?",
    answer: "yt-dlp is an open-source command-line tool that can download videos from YouTube and many other websites. It is a fork of youtube-dl with additional features, active maintenance, and broader site support. YTOUDown uses yt-dlp under the hood to fetch video metadata and download media streams. Source: https://github.com/yt-dlp/yt-dlp",
  },
  {
    question: "What is FFmpeg?",
    answer: "FFmpeg is a free, open-source multimedia framework that can record, convert, and stream audio and video. YTOUDown uses FFmpeg to merge separate video and audio streams (which YouTube often provides separately for high-quality formats) into a single playable file. Source: https://ffmpeg.org",
  },

  // ── Privacy & Data ───────────────────────────────────────────────────────
  {
    question: "Where is my download history stored?",
    answer: "Your download history is stored in a server-side PostgreSQL database. It records the video title, format, file size, download date, and status. No user identity or personal information is attached to history records. You can view your history on the History page.",
  },
  {
    question: "Is downloading YouTube videos legal?",
    answer: "Downloading YouTube videos may violate YouTube's Terms of Service, which restrict downloading except where a download button or link is explicitly provided by YouTube. The legality also depends on copyright law in your country. YTOUDown is intended for personal, educational, and archival use with content you have the legal right to download — such as content you own, Creative Commons-licensed material, or content where the copyright holder has granted permission.",
  },

  // ── Browser & Device ─────────────────────────────────────────────────────
  {
    question: "Do I need to install any software or browser extension?",
    answer: "No. YTOUDown is entirely browser-based. Everything works directly inside your web browser — no software installation, no browser extensions, and no desktop app required. Simply visit the website and start downloading.",
  },
  {
    question: "Which browsers does YTOUDown support?",
    answer: "YTOUDown supports all modern browsers including Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, Opera, and Brave. Any browser with JavaScript enabled and a stable internet connection will work.",
  },
  {
    question: "Does YTOUDown work on mobile devices?",
    answer: "Yes. YTOUDown is fully responsive and works on Android phones, iPhones, iPads, and tablets. The interface adapts automatically to your screen size, so the experience is just as smooth on mobile as on desktop.",
  },
  {
    question: "Where are downloaded videos saved on my device?",
    answer: "Downloaded videos are saved to your browser's default Downloads folder unless you've selected a different save location in your browser settings. Most browsers will prompt you to choose a location when the download begins.",
  },
  {
    question: "Is YTOUDown secure to use?",
    answer: "Yes. YTOUDown is designed to provide a clean, safe web experience. The site uses HTTPS, applies security headers (CSP, HSTS, X-Frame-Options), and does not require any software installation. No malware, no adware, and no third-party tracking cookies are used.",
  },
];

// Enhanced answers for the accordion UI only (adds contextual internal/external
// links). The plain-text `answer` above is what's used for the FAQPage JSON-LD.
const enhancedAnswers: Record<string, ReactNode> = {
  "How is YTOUDown different from other YouTube downloaders?": (
    <>
      YTOUDown focuses on speed, simplicity, and a clean user experience. Users looking for
      alternatives to services such as SaveFrom.net, SnapScooper, or 4K Downloader may find YTOUDown
      to be an easy-to-use web-based option that works directly in the browser without unnecessary
      complexity, ads, or redirect flows. See our{" "}
      <Link href="/alternatives" title="Compare YTOUDown to other YouTube downloaders" className="text-primary hover:underline">
        Alternatives page
      </Link>{" "}
      for a full feature comparison.
    </>
  ),
  "What file formats can I download?": (
    <>
      Depending on the video, available formats include MP4 (H.264 or VP9), WebM (VP9 or AV1), M4A
      (AAC audio), and Opus (WebM audio). The MP3 toggle re-encodes audio to MP3. MP4 is the most
      universally compatible format for video playback. Browse the full list on the{" "}
      <Link href="/formats" title="Browse all supported video and audio formats" className="text-primary hover:underline">
        Formats page
      </Link>
      .
    </>
  ),
  "What is yt-dlp?": (
    <>
      <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        yt-dlp
      </a>{" "}
      is an open-source command-line tool that can download videos from YouTube and many other
      websites. It is a fork of youtube-dl with additional features, active maintenance, and broader
      site support. YTOUDown uses yt-dlp under the hood to fetch video metadata and download media
      streams.
    </>
  ),
  "What is FFmpeg?": (
    <>
      <a href="https://ffmpeg.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        FFmpeg
      </a>{" "}
      is a free, open-source multimedia framework that can record, convert, and stream audio and
      video. YTOUDown uses FFmpeg to merge separate video and audio streams (which YouTube often
      provides separately for high-quality formats) into a single playable file.
    </>
  ),
  "Where is my download history stored?": (
    <>
      Your download history is stored in a server-side PostgreSQL database. It records the video
      title, format, file size, download date, and status. No user identity or personal information
      is attached to history records. You can view your history on the{" "}
      <Link href="/history" title="View your YTOUDown download history" className="text-primary hover:underline">
        History page
      </Link>
      .
    </>
  ),
};

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <SEO
        title="Frequently Asked Questions"
        description="Answers to 25 common questions about YTOUDown — how to download YouTube videos, supported formats, MP3 conversion, browser compatibility, security, and legality."
        path="/faq"
        type="FAQPage"
        jsonLd={{
          mainEntity: faqs.map(f => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mt-1">
          25 common questions about YTOUDown — how it works, formats, browser support, security, and more.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {enhancedAnswers[faq.question] ?? faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
