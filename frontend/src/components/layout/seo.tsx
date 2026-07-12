import { useEffect } from "react";

// Set VITE_SITE_URL in your deployment environment (e.g. https://ytoudown.com).
// Falls back to ytoudown.com for local dev and unset environments.
const BASE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com";

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface SEOProps {
  title: string;
  description?: string;
  path?: string;
  breadcrumbs?: BreadcrumbItem[];
  type?: "WebPage" | "FAQPage" | "AboutPage" | "CollectionPage";
  jsonLd?: Record<string, unknown>;
  speakableSelectors?: string[];
}

function setMeta(selector: string, attr: string, value: string) {
  let el = document.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el) {
    const tag = selector.startsWith("link") ? "link" : "meta";
    el = document.createElement(tag) as HTMLMetaElement;
    if (selector.includes("property=")) {
      el.setAttribute("property", selector.match(/property="([^"]+)"/)?.[1] ?? "");
    } else if (selector.includes("name=")) {
      el.setAttribute("name", selector.match(/name="([^"]+)"/)?.[1] ?? "");
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setJsonLd(id: string, data: Record<string, unknown>) {
  const el = document.getElementById(id);
  if (el) el.textContent = JSON.stringify(data);
}

// Default speakable CSS selectors — points AI/voice assistants at the
// most informative content block on any page.
const DEFAULT_SPEAKABLE_SELECTORS = ["h1", "h2", ".speakable"];

export function SEO({
  title,
  description = "YouTube Downloader YTOUDown: paste a link, choose MP4 or MP3, and download YouTube videos and Shorts fast — free, browser-based, no account needed.",
  path = "/",
  breadcrumbs,
  type = "WebPage",
  jsonLd,
  speakableSelectors = DEFAULT_SPEAKABLE_SELECTORS,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = `${title} | YTOUDown`;
    const canonicalUrl = `${BASE_URL}${path}`;

    // Title
    document.title = fullTitle;

    // Basic meta
    setMeta('meta[name="description"]', "content", description);

    // Canonical
    const canonical = document.getElementById("canonical-link") as HTMLLinkElement | null;
    if (canonical) canonical.href = canonicalUrl;

    // Open Graph
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", canonicalUrl);

    // Twitter
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", description);

    // JSON-LD: WebPage (with Speakable and DateModified for freshness signals)
    const webPageSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": type,
      "@id": `${canonicalUrl}#webpage`,
      name: fullTitle,
      description,
      url: canonicalUrl,
      inLanguage: "en-US",
      isPartOf: { "@id": `${BASE_URL}/#website` },
      about: { "@id": `${BASE_URL}/#app` },
      dateModified: new Date().toISOString().split("T")[0],
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: speakableSelectors,
      },
      ...(jsonLd ?? {}),
    };
    setJsonLd("jsonld-webpage", webPageSchema);

    // JSON-LD: Breadcrumb
    const crumbs: BreadcrumbItem[] = [
      { name: "Home", path: "/" },
      ...(breadcrumbs ?? (path !== "/" ? [{ name: title, path }] : [])),
    ];
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: `${BASE_URL}${c.path}`,
      })),
    };
    setJsonLd("jsonld-breadcrumb", breadcrumbSchema);
  }, [title, description, path, breadcrumbs, type, jsonLd, speakableSelectors]);

  return null;
}
