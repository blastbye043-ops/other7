/**
 * HomeBelowFold — all below-the-fold content sections of the home page.
 *
 * Lazy-loaded via React.lazy in home.tsx so that the hero, input, and video-card
 * blocks are in the initial JS bundle while these heavier informational sections
 * are deferred until the browser is idle after first paint.
 *
 * This component is intentionally pure (no props, no state, no side-effects) so
 * React can skip reconciliation whenever the parent re-renders — it will never
 * update once mounted.
 */

import { memo } from "react";
import {
  Zap, Globe, Smartphone, Layers, LayoutDashboard, Gift,
  Monitor, Chrome, CheckCircle, ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AdPlaceholder } from "@/components/ui/ad-placeholder";
import { Link } from "wouter";

// ─── Static data ────────────────────────────────────────────────────────────

const features = [
  { icon: Zap,             title: "Lightning Fast",          desc: "Our optimized processing retrieves video information and prepares your download in just seconds." },
  { icon: Globe,           title: "Browser Based",           desc: "No software downloads or browser extensions required. Everything runs directly in your web browser." },
  { icon: Smartphone,      title: "Mobile Friendly",         desc: "Works perfectly on Android phones, iPhones, tablets, laptops, and desktop computers." },
  { icon: Layers,          title: "Multiple Quality Options", desc: "Choose from all available video qualities based on the original upload — up to 4K where available." },
  { icon: LayoutDashboard, title: "Clean Interface",         desc: "Simple navigation makes downloading quick and hassle-free, with no clutter or confusing steps." },
  { icon: Gift,            title: "Free to Use",             desc: "No account creation or subscription needed. YTOUDown is completely free for everyone." },
] as const;

const steps = [
  { n: "1", title: "Copy the URL",        desc: "Copy the YouTube video URL from your browser address bar or the YouTube app." },
  { n: "2", title: "Paste into YTOUDown", desc: "Paste the copied link into the search box on YTOUDown's home page." },
  { n: "3", title: "Choose & Download",   desc: "Select your preferred quality from the available options and save the video to your device." },
] as const;

const devices = ["Windows PC", "macOS", "Linux", "Android", "iPhone", "iPad", "Chromebook"] as const;
const browsers = ["Google Chrome", "Mozilla Firefox", "Microsoft Edge", "Safari", "Opera", "Brave"] as const;

const benefits = [
  "Fast video information retrieval",
  "Clean and responsive interface",
  "Browser-based — no installation",
  "No software or extension required",
  "Mobile-friendly design",
  "Easy navigation",
  "Multiple quality options",
  "Secure browsing experience",
  "No account or registration",
  "Regular platform improvements",
] as const;

const homeFaqs = [
  {
    q: "What is YTOUDown?",
    a: "YTOUDown is a fast, browser-based YouTube video downloader. Paste a YouTube link, choose an available format, and download — no software or account needed.",
  },
  {
    q: "Is YTOUDown free to use?",
    a: "Yes, completely free. No subscriptions, no premium tiers, and no account required. Download videos without signing up or providing any personal information.",
  },
  {
    q: "Do I need to install any software?",
    a: "No. Everything runs in your web browser. There is no desktop app, no browser extension, and nothing to download to your device before you start.",
  },
  {
    q: "Which devices and browsers are supported?",
    a: "YTOUDown works on Windows, macOS, Linux, Android, iPhone, and tablets. Compatible browsers include Chrome, Firefox, Edge, Safari, Opera, and Brave.",
  },
  {
    q: "How is YTOUDown different from other downloaders?",
    a: "YTOUDown is built for speed and simplicity — no ads, no confusing redirect steps, and no installation required. A clean alternative to services like SaveFrom.net, SnapScooper, or 4K Downloader.",
  },
  {
    q: "What video formats and qualities are available?",
    a: "YTOUDown fetches all formats available for a given video: up to 4K video (MP4/WebM) and audio-only options (M4A, Opus, MP3). The exact list depends on the original upload.",
  },
] as const;

const alternativeCards = [
  { label: "No ads or redirects", desc: "Clean interface from start to finish." },
  { label: "No install needed",   desc: "100% browser-based — visit and download." },
  { label: "No account required", desc: "Paste a URL and go. Nothing else." },
] as const;

const whyCards = [
  { label: "Speed",         text: "Optimized server-side processing via yt-dlp and FFmpeg." },
  { label: "Simplicity",   text: "Three steps: paste, choose, download. Nothing more." },
  { label: "Compatibility", text: "Works on any device, any browser, anywhere." },
] as const;

const safetyCards = [
  {
    title: "HTTPS on every request",
    desc: "All traffic between your browser and YTOUDown is encrypted via TLS/SSL.",
  },
  {
    title: "No personal data collected",
    desc: "We do not collect your name, email, IP address, or any account information.",
  },
  {
    title: "No tracking cookies",
    desc: "YTOUDown does not use third-party tracking cookies or fingerprinting scripts.",
  },
  {
    title: "Open-source engine",
    desc: "Powered by yt-dlp — audited open-source software with an active security community.",
  },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

function HomeBelowFoldInner() {
  return (
    <>
      {/* ── How It Works ── */}
      <section aria-labelledby="how-it-works" className="space-y-8">
        <div className="text-center space-y-2">
          <h2 id="how-it-works" className="text-2xl md:text-3xl font-bold tracking-tight">
            How to Download YouTube Videos in 3 Simple Steps
          </h2>
          <p className="text-muted-foreground">Fast and straightforward — no experience needed.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-extrabold text-xl">
                {s.n}
              </div>
              <h3 className="font-semibold text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section aria-labelledby="features" className="space-y-8">
        <div className="text-center space-y-2">
          <h2 id="features" className="text-2xl md:text-3xl font-bold tracking-tight">
            YouTube to MP4 and MP3 Converter — All in One Place
          </h2>
          <p className="text-muted-foreground">YTOUDown is built for speed, simplicity, and compatibility.</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="border-border">
                <CardContent className="pt-6 pb-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon aria-hidden="true" className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* UI preview — multi-modal signal for generative AI engines */}
        <figure className="rounded-2xl overflow-hidden border border-border shadow-md">
          <img
            src="/ui-preview.jpg"
            alt="YTOUDown interface showing the URL input field, the Get Video button, and a grid of download format cards (MP4 1080p, MP4 720p, MP3 Audio). Paste a YouTube link and choose a quality — no software or account needed."
            className="w-full object-cover"
            width="1024"
            height="1024"
            loading="lazy"
            decoding="async"
          />
          <figcaption className="px-4 py-2.5 text-xs text-muted-foreground text-center bg-card border-t border-border">
            YTOUDown — powered by <strong className="text-foreground/70">yt-dlp</strong> and <strong className="text-foreground/70">FFmpeg</strong>. Paste, choose, download.
          </figcaption>
        </figure>
      </section>

      {/* ── Why Users Love YTOUDown ── */}
      <section aria-labelledby="why-users" className="rounded-2xl border border-border bg-card p-5 sm:p-8 md:p-12 space-y-4">
        <h2 id="why-users" className="text-2xl md:text-3xl font-bold tracking-tight">Why Users Love YTOUDown</h2>
        <p className="text-muted-foreground leading-relaxed">
          Thousands of users prefer simple tools that work efficiently without unnecessary distractions.
          YTOUDown is built with a modern interface, responsive design, and fast performance to provide
          an enjoyable experience across all devices. Under the hood, it's powered by{" "}
          <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            yt-dlp
          </a>{" "}
          and{" "}
          <a href="https://ffmpeg.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            FFmpeg
          </a>
          , two widely trusted open-source media tools.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Whether you're using Chrome, Firefox, Edge, Safari, Opera, or Brave, our platform is
          optimized to deliver consistent performance. Unlike many websites cluttered with unnecessary
          steps, YTOUDown focuses on a streamlined experience — from pasting your YouTube URL to
          selecting quality and downloading in seconds. Browse all{" "}
          <Link href="/formats" title="Browse all supported video and audio formats" className="text-primary hover:underline">
            supported formats
          </Link>{" "}
          or check the{" "}
          <Link href="/faq" title="Frequently asked questions about YTOUDown" className="text-primary hover:underline">
            FAQ
          </Link>{" "}
          for more details.
        </p>
      </section>

      {/* ── Works Everywhere ── */}
      <section aria-labelledby="compatibility" className="space-y-8">
        <div className="text-center space-y-2">
          <h2 id="compatibility" className="text-2xl md:text-3xl font-bold tracking-tight">
            Compatible with All Major Devices &amp; Browsers
          </h2>
          <p className="text-muted-foreground">Use YTOUDown on any modern device without installing anything.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardContent className="pt-6 pb-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Monitor aria-hidden="true" className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Supported Devices</h3>
              </div>
              <ul className="space-y-2">
                {devices.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle aria-hidden="true" className="w-4 h-4 text-green-500 flex-shrink-0" /> {d}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6 pb-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Chrome aria-hidden="true" className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Supported Browsers</h3>
              </div>
              <ul className="space-y-2">
                {browsers.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle aria-hidden="true" className="w-4 h-4 text-green-500 flex-shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section aria-labelledby="benefits" className="space-y-6">
        <div className="text-center space-y-2">
          <h2 id="benefits" className="text-2xl md:text-3xl font-bold tracking-tight">
            Benefits of Our Free YouTube Video Downloader
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card text-sm">
              <CheckCircle aria-hidden="true" className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-muted-foreground">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Content Banner Ad ── */}
      <AdPlaceholder
        id="content-banner-ad"
        type="banner"
        desktopHeight={90}
        mobileHeight={100}
        showOnDesktop={true}
        showOnMobile={true}
        showPlaceholder={true}
      />

      {/* ── Inline FAQ ── */}
      <section aria-labelledby="home-faq" className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-y-2">
          <div>
            <h2 id="home-faq" className="text-2xl md:text-3xl font-bold tracking-tight">
              YouTube Downloader FAQ
            </h2>
            <p className="text-muted-foreground mt-1">Quick answers about YTOUDown.</p>
          </div>
          <Link href="/faq" title="See all YTOUDown frequently asked questions">
            <span className="text-sm font-medium text-primary hover:underline cursor-pointer whitespace-nowrap flex items-center gap-1">
              See all questions <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {homeFaqs.map((item) => (
            <div key={item.q} className="rounded-xl border border-border bg-card p-5 space-y-2">
              <h3 className="font-semibold text-sm leading-snug">{item.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Alternatives / Competitor comparison ── */}
      <section aria-labelledby="alternatives" className="rounded-2xl border border-border bg-card p-5 sm:p-8 md:p-10 space-y-5">
        <h2 id="alternatives" className="text-2xl md:text-3xl font-bold tracking-tight">
          Looking for a YouTube Downloader Alternative?
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          If you've used services like <strong className="text-foreground">SaveFrom.net</strong>,{" "}
          <strong className="text-foreground">SaveFrom.space</strong>,{" "}
          <strong className="text-foreground">Samvan.ca</strong>,{" "}
          <strong className="text-foreground">SnapScooper</strong>, or{" "}
          <strong className="text-foreground">4K Downloader</strong> and found them cluttered with ads,
          confusing redirect steps, or requiring software installs — YTOUDown is built to be different.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {alternativeCards.map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-background p-4 space-y-1">
              <p className="font-semibold text-sm flex items-center gap-1.5">
                <CheckCircle aria-hidden="true" className="w-4 h-4 text-green-500 flex-shrink-0" /> {item.label}
              </p>
              <p className="text-xs text-muted-foreground pl-5">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="pt-1">
          <Link href="/alternatives" title="Compare YTOUDown to other YouTube downloader alternatives">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer">
              See the full feature comparison <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* ── Why YTOUDown Over Others ── */}
      <section aria-labelledby="why-choose" className="rounded-2xl border border-border bg-card p-5 sm:p-8 md:p-12 space-y-4 mb-8">
        <h2 id="why-choose" className="text-2xl md:text-3xl font-bold tracking-tight">
          Why Choose YTOUDown Over Other Downloaders?
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Unlike many websites that are cluttered with unnecessary steps, YTOUDown focuses on providing
          a streamlined experience. From the moment you paste your YouTube URL to selecting your
          preferred quality, every part of the process is designed to be fast, intuitive, and accessible.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Our platform is built for speed, simplicity, and compatibility. We continuously improve
          YTOUDown to enhance performance, usability, and compatibility with modern browsers and devices —
          so you always get a reliable, up-to-date experience.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 pt-2">
          {whyCards.map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-background p-4 space-y-1">
              <p className="font-semibold text-sm text-primary">{item.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Safety & Trust ── */}
      <section
        id="safety"
        aria-labelledby="safety-heading"
        className="rounded-2xl border border-border bg-card p-5 sm:p-8 md:p-12 space-y-5"
      >
        <h2 id="safety-heading" className="text-2xl md:text-3xl font-bold tracking-tight speakable">
          Is YTOUDown Safe to Use?
        </h2>
        <p className="text-muted-foreground leading-relaxed speakable">
          Yes. YTOUDown is designed with privacy and security as defaults — not afterthoughts.
          All connections use <strong className="text-foreground">HTTPS encryption</strong>. No
          user accounts are created, no personal data is collected, and no tracking cookies are
          placed. The tool is powered by{" "}
          <strong className="text-foreground">yt-dlp</strong>, a widely trusted open-source
          downloader maintained by the community, and{" "}
          <strong className="text-foreground">FFmpeg</strong> for media processing.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {safetyCards.map((item) => (
            <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-background">
              <CheckCircle aria-hidden="true" className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground pt-1 speakable">
          Temporary download files are held on the server for up to one hour, then automatically
          deleted. No copy of your downloaded content is retained.
        </p>
      </section>
    </>
  );
}

// memo: this component has no props and no state — it will never re-render once
// mounted, so wrapping with memo eliminates any reconciliation cost entirely.
export const HomeBelowFold = memo(HomeBelowFoldInner);
export default HomeBelowFold;
