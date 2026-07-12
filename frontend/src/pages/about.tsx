import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/layout/seo";
import { Link } from "wouter";
import { DownloadCloud, Zap, Shield, Code2, Clock, HardDrive } from "lucide-react";

const features = [
  {
    icon: DownloadCloud,
    title: "Real Downloads",
    description: "Powered by yt-dlp — one of the most reliable open-source YouTube downloaders. No fake links, no redirect mazes. The file goes directly from YouTube's servers to you.",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Server-side processing with FFmpeg merges separate video and audio streams at the quality you select. Most downloads complete in under 90 seconds.",
  },
  {
    icon: Shield,
    title: "No Tracking",
    description: "No advertising cookies, no third-party tracking pixels. Download history is stored server-side only for your reference and is not shared with anyone.",
  },
  {
    icon: Code2,
    title: "Open Technology",
    description: "Built on open-source tools: yt-dlp, FFmpeg, Node.js, Express, React, and PostgreSQL. No proprietary black boxes or closed SDKs.",
  },
  {
    icon: Clock,
    title: "No Account Required",
    description: "YTOUDown works without registration or login. Paste a URL and download — nothing more required.",
  },
  {
    icon: HardDrive,
    title: "Automatic Cleanup",
    description: "Downloaded files are automatically removed from the server after 1 hour, keeping storage clean and ensuring your files aren't stored indefinitely.",
  },
];

const techStack = [
  { name: "yt-dlp", role: "Video extraction and format fetching", url: "https://github.com/yt-dlp/yt-dlp" },
  { name: "FFmpeg", role: "Media processing and stream merging", url: "https://ffmpeg.org" },
  { name: "Node.js + Express", role: "API server and download orchestration", url: "https://nodejs.org" },
  { name: "React + Vite", role: "Frontend user interface", url: "https://react.dev" },
  { name: "PostgreSQL", role: "Download history storage", url: "https://postgresql.org" },
  { name: "Drizzle ORM", role: "Type-safe database access", url: "https://orm.drizzle.team" },
];

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <SEO
        title="About"
        description="YTOUDown is a free, modern web-based YouTube video downloader. Download videos in 4K, 1080p, 720p, or MP3 audio — no account, no software installation required."
        path="/about"
        type="AboutPage"
        jsonLd={{
          about: {
            "@type": "SoftwareApplication",
            name: "YTOUDown",
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Any",
            isAccessibleForFree: true,
          },
          mentions: [
            { "@type": "SoftwareApplication", name: "yt-dlp", url: "https://github.com/yt-dlp/yt-dlp" },
            { "@type": "SoftwareApplication", name: "FFmpeg", url: "https://ffmpeg.org" },
          ],
        }}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight speakable">About YTOUDown</h1>
        <p className="text-muted-foreground mt-2 text-lg leading-relaxed speakable">
          A free, fast YouTube video downloader — no account, no ads, no dark patterns.
        </p>
      </div>

      {/* What is YTOUDown */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">What Is YTOUDown, the Free YouTube Video Downloader?</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed space-y-3">
          <p>
            <strong>YTOUDown</strong> is a modern web-based YouTube video downloader designed to provide
            a smooth, fast, and user-friendly experience. Whether you're using a computer, tablet, or
            smartphone, our platform lets you retrieve downloadable video information with just a few clicks.
          </p>
          <p>
            Our mission is to provide a clean, reliable, and efficient tool that helps users save publicly
            available content for offline viewing where permitted. With an intuitive interface and
            responsive design, YTOUDown works seamlessly across modern browsers without requiring
            additional software.
          </p>
          <p>
            Under the hood, YTOUDown uses{" "}
            <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              <strong>yt-dlp</strong>
            </a>{" "}
            to fetch video metadata and retrieve media streams from YouTube.{" "}
            <a href="https://ffmpeg.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              <strong>FFmpeg</strong>
            </a>{" "}
            handles post-processing: merging separate video and audio tracks (which YouTube provides
            independently for high-quality formats) into a single playable file. See our{" "}
            <Link href="/formats" title="Browse all supported video and audio formats" className="text-primary hover:underline">
              Formats page
            </Link>{" "}
            for the full list of supported outputs.
          </p>
        </div>
      </div>

      {/* Why Choose */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Why Choose YTOUDown for YouTube to MP4 &amp; MP3 Downloads?</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed space-y-3">
          <p>
            Finding a downloader that is both fast and easy to use shouldn't be difficult. That's why
            YTOUDown focuses on delivering an efficient experience with minimal effort. Curious how we
            compare to other tools? Check the{" "}
            <Link href="/alternatives" title="Compare YTOUDown to other YouTube downloaders" className="text-primary hover:underline">
              Alternatives page
            </Link>
            .
          </p>
          <p>
            Whether you're downloading educational tutorials, lectures, travel videos, documentaries,
            or other publicly available content, YTOUDown helps you access download options quickly.
            Our platform is built for speed, simplicity, and compatibility.
          </p>
          <p>
            Download history is stored in a <strong>PostgreSQL</strong> database so you can review past
            downloads, see file sizes, and track which formats you use most on your{" "}
            <Link href="/history" title="View your YTOUDown download history" className="text-primary hover:underline">
              History page
            </Link>
            . History records contain no user identifiers — nothing is linked to an account or IP
            address beyond what your browser sends with any web request.
          </p>
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-xl font-semibold mb-4">YTOUDown Features: MP4, MP3, 4K &amp; Shorts Support</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon aria-hidden="true" className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Why Over Others */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-xl font-semibold">Why YTOUDown Over Other Downloaders?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Unlike many websites cluttered with unnecessary steps, YTOUDown focuses on providing a
          streamlined experience. From the moment you paste your YouTube URL to selecting your preferred
          quality, every part of the process is designed to be fast, intuitive, and accessible.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We continuously improve our platform to enhance speed, usability, and compatibility with
          modern browsers and devices.
        </p>
      </div>

      {/* Tech Stack */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Technology Stack</h2>
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {techStack.map((tech) => (
            <div key={tech.name} className="flex items-start justify-between px-4 py-3 text-sm">
              <div>
                <a
                  href={tech.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {tech.name}
                </a>
                <p className="text-muted-foreground mt-0.5">{tech.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal */}
      <div className="border-t border-border pt-6 space-y-3 break-words">
        <h2 className="font-semibold">Legal Notice</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          YTOUDown is intended for personal, educational, and archival use only. Downloading YouTube
          content may be subject to copyright restrictions and YouTube's Terms of Service. Always
          ensure you have the right to download any content. This tool does not facilitate copyright
          infringement. By using YTOUDown, you agree to use it responsibly and in accordance with
          applicable laws.
        </p>
        <p className="text-sm text-muted-foreground">
          See our{" "}
          <Link href="/privacy" title="Read YTOUDown's Privacy Policy" className="text-primary hover:underline">Privacy Policy</Link>{" "}
          and{" "}
          <Link href="/terms" title="Read YTOUDown's Terms of Service" className="text-primary hover:underline">Terms of Service</Link>{" "}
          for full details. Have questions?{" "}
          <Link href="/faq" title="Frequently asked questions about YTOUDown" className="text-primary hover:underline">Visit the FAQ</Link>.
        </p>
      </div>
    </div>
  );
}
