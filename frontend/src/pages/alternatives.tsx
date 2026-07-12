import { SEO } from "@/components/layout/seo";
import { Link } from "wouter";
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";

const competitors = [
  {
    name: "YTOUDown",
    url: null,
    browserBased: true,
    accountRequired: false,
    installRequired: false,
    ads: false,
    mobileSupport: true,
    formats: ["MP4", "WebM", "M4A", "MP3", "Opus"],
    maxResolution: "Up to 4K",
    highlight: true,
    note: "This site",
  },
  {
    name: "SaveFrom.net",
    url: "https://en.savefrom.net",
    browserBased: true,
    accountRequired: false,
    installRequired: false,
    ads: true,
    mobileSupport: true,
    formats: ["MP4", "MP3"],
    maxResolution: "Up to 1080p",
    highlight: false,
    note: null,
  },
  {
    name: "SnapScooper",
    url: "https://snapscooper.com",
    browserBased: true,
    accountRequired: false,
    installRequired: false,
    ads: true,
    mobileSupport: true,
    formats: ["MP4", "MP3"],
    maxResolution: "Up to 1080p",
    highlight: false,
    note: null,
  },
  {
    name: "4K Downloader",
    url: "https://www.4kdownload.com",
    browserBased: false,
    accountRequired: false,
    installRequired: true,
    ads: false,
    mobileSupport: false,
    formats: ["MP4", "MKV", "MP3", "M4A"],
    maxResolution: "Up to 8K",
    highlight: false,
    note: "Desktop app",
  },
  {
    name: "Samvan.ca",
    url: "https://samvan.ca",
    browserBased: true,
    accountRequired: false,
    installRequired: false,
    ads: true,
    mobileSupport: true,
    formats: ["MP4", "MP3"],
    maxResolution: "Up to 1080p",
    highlight: false,
    note: null,
  },
];

const features = [
  { key: "browserBased" as const, label: "Browser-based" },
  { key: "accountRequired" as const, label: "Account required", invert: true },
  { key: "installRequired" as const, label: "Install required", invert: true },
  { key: "ads" as const, label: "Contains ads", invert: true },
  { key: "mobileSupport" as const, label: "Mobile support" },
];

function Cell({ value, invert = false }: { value: boolean; invert?: boolean }) {
  const positive = invert ? !value : value;
  if (positive) return <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />;
  return <XCircle className="w-5 h-5 text-destructive mx-auto" />;
}

export default function AlternativesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <SEO
        title="YTOUDown vs SaveFrom.net vs SnapScooper vs 4K Downloader — Comparison"
        description="Honest comparison of YTOUDown with popular YouTube downloader alternatives like SaveFrom.net, SnapScooper, and 4K Downloader. See features, formats, and browser support side-by-side."
        path="/alternatives"
        type="WebPage"
        jsonLd={{
          mainEntity: {
            "@type": "ItemList",
            name: "YouTube Downloader Comparison",
            itemListElement: competitors.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: c.name,
              ...(c.url ? { url: c.url } : {}),
            })),
          },
        }}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight speakable">
          YTOUDown vs Other YouTube Downloaders
        </h1>
        <p className="text-muted-foreground mt-2 leading-relaxed speakable">
          A fair, factual comparison of YTOUDown with popular YouTube downloader alternatives —
          so you can choose the tool that best fits your needs.
        </p>
      </div>

      {/* Intro */}
      <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed space-y-3">
        <p>
          There are many YouTube downloaders available. Some are desktop applications, some are
          browser-based, and they all differ in terms of format support, ads, and ease of use.
          The table below compares <strong>YTOUDown</strong> with several commonly searched
          alternatives including <strong>SaveFrom.net</strong>, <strong>SnapScooper</strong>,{" "}
          <strong>4K Downloader</strong>, and <strong>Samvan.ca</strong>.
        </p>
        <p>
          All information below reflects general publicly known characteristics of each service
          and is provided for informational purposes only.
        </p>
      </div>

      {/* Comparison table — desktop */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold w-44">Feature</th>
              {competitors.map((c) => (
                <th
                  key={c.name}
                  className={`text-center px-3 py-3 font-semibold ${c.highlight ? "text-primary bg-primary/5" : ""}`}
                >
                  {c.name}
                  {c.note && (
                    <span className="block text-xs font-normal text-muted-foreground">{c.note}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((f, fi) => (
              <tr key={f.key} className={`border-b border-border/50 ${fi % 2 === 0 ? "" : "bg-muted/10"}`}>
                <td className="px-4 py-3 font-medium text-muted-foreground">{f.label}</td>
                {competitors.map((c) => (
                  <td key={c.name} className={`text-center px-3 py-3 ${c.highlight ? "bg-primary/5" : ""}`}>
                    <Cell value={c[f.key]} invert={f.invert} />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-b border-border/50 bg-muted/10">
              <td className="px-4 py-3 font-medium text-muted-foreground">Max resolution</td>
              {competitors.map((c) => (
                <td key={c.name} className={`text-center px-3 py-3 text-xs ${c.highlight ? "bg-primary/5 font-semibold text-primary" : "text-muted-foreground"}`}>
                  {c.maxResolution}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-muted-foreground">Formats</td>
              {competitors.map((c) => (
                <td key={c.name} className={`text-center px-3 py-3 text-xs ${c.highlight ? "bg-primary/5" : "text-muted-foreground"}`}>
                  {c.formats.join(", ")}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes about each tool */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">About Each Tool</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {competitors.map((c) => (
            <div
              key={c.name}
              className={`rounded-xl border p-5 space-y-2 ${c.highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className={`font-semibold ${c.highlight ? "text-primary" : ""}`}>{c.name}</h3>
                {c.highlight && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">You are here</span>}
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-1.5">
                  {c.browserBased ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
                  {c.browserBased ? "Browser-based — no install needed" : "Requires desktop app installation"}
                </li>
                <li className="flex items-center gap-1.5">
                  {!c.ads ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <MinusCircle className="w-3.5 h-3.5 text-yellow-500" />}
                  {!c.ads ? "No ads" : "Contains advertising"}
                </li>
                <li className="flex items-center gap-1.5">
                  {c.mobileSupport ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
                  {c.mobileSupport ? "Works on mobile" : "Desktop only"}
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  Formats: {c.formats.join(", ")}
                </li>
              </ul>
              {c.url && (
                <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                  Visit {c.name} ↗
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">Try YTOUDown Now</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          No account. No installation. No ads. Just paste a YouTube URL and download in seconds.
        </p>
        <Link href="/">
          <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors cursor-pointer">
            Go to Downloader →
          </span>
        </Link>
      </div>

      <div className="border-t border-border pt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <Link href="/faq" title="Frequently asked questions about YTOUDown" className="text-primary hover:underline">FAQ</Link>
        <Link href="/formats" title="Supported video and audio formats" className="hover:text-foreground transition-colors">Supported Formats</Link>
        <Link href="/about" title="About YTOUDown" className="hover:text-foreground transition-colors">About</Link>
      </div>
    </div>
  );
}
