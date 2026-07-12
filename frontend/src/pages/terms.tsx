import { SEO } from "@/components/layout/seo";
import { Link } from "wouter";

const LAST_UPDATED = "July 1, 2026";
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com";
const CONTACT_EMAIL = `legal@${new URL(SITE_URL).hostname}`;

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <SEO
        title="Terms of Service"
        description="YTOUDown Terms of Service — the rules and conditions governing your use of the YouTube video downloader."
        path="/terms"
        type="WebPage"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${(import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com"}/terms#webpage`,
          about: {
            "@type": "TermsOfService",
            "@id": `${(import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com"}/terms#terms-of-service`,
            name: "YTOUDown Terms of Service",
            url: `${(import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com"}/terms`,
            dateModified: "2026-07-01",
            publisher: { "@id": `${(import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com"}/#organization` },
          },
        }}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground mt-2">
          Last updated: <time dateTime="2026-07-01">{LAST_UPDATED}</time>
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">

        <section aria-labelledby="acceptance">
          <h2 id="acceptance" className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using YTOUDown (the "Service") at{" "}
            <a href={SITE_URL} className="text-primary hover:underline">{SITE_URL}</a>, you agree to be
            bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not
            use the Service. We reserve the right to update these Terms at any time. Continued use of the
            Service following updates constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section aria-labelledby="description">
          <h2 id="description" className="text-xl font-semibold mb-3">2. Description of Service</h2>
          <p>
            YTOUDown is a web-based tool that allows users to download video and audio content from
            YouTube by submitting a public video URL. The Service processes download requests on the
            server side using yt-dlp and FFmpeg and provides users with a downloadable media file.
          </p>
          <p className="mt-3">
            The Service is provided "as is" and "as available" without warranties of any kind. We do not
            guarantee that the Service will always be available, uninterrupted, or error-free.
          </p>
        </section>

        <section aria-labelledby="permitted-use">
          <h2 id="permitted-use" className="text-xl font-semibold mb-3">3. Permitted Use</h2>
          <p>You may use YTOUDown solely for lawful purposes. Permitted uses include:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2 text-muted-foreground">
            <li>Downloading content you have the legal right to download</li>
            <li>Archiving publicly available content for personal, educational, or research purposes</li>
            <li>Downloading content you own the copyright to, or content licensed under Creative Commons</li>
            <li>Personal, non-commercial use consistent with applicable copyright law</li>
          </ul>
        </section>

        <section aria-labelledby="prohibited-use">
          <h2 id="prohibited-use" className="text-xl font-semibold mb-3">4. Prohibited Uses</h2>
          <p>You must not use the Service to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2 text-muted-foreground">
            <li>Download, distribute, or reproduce copyrighted content without authorization from the copyright holder</li>
            <li>Violate YouTube's Terms of Service or any other platform's terms</li>
            <li>Infringe upon intellectual property rights of any third party</li>
            <li>Engage in commercial redistribution of downloaded content without appropriate licenses</li>
            <li>Attempt to bypass, disable, or circumvent security features of the Service</li>
            <li>Scrape, crawl, or automate requests to the Service at a rate that imposes undue burden</li>
            <li>Upload, transmit, or distribute malicious code or harmful content</li>
            <li>Use the Service to harass, defame, or harm any individual or entity</li>
            <li>Violate any applicable local, national, or international law</li>
          </ul>
        </section>

        <section aria-labelledby="copyright">
          <h2 id="copyright" className="text-xl font-semibold mb-3">5. Copyright and Intellectual Property</h2>
          <p>
            YTOUDown does not host, store, or distribute copyrighted content. The Service processes
            user-submitted URLs and facilitates access to publicly available media streams. The
            responsibility for ensuring you have the legal right to download any content rests entirely
            with you, the user.
          </p>
          <p className="mt-3">
            All content available through YouTube is subject to YouTube's Terms of Service and the
            intellectual property rights of the respective content owners. Downloading YouTube videos
            may violate YouTube's Terms of Service. Users are solely responsible for their compliance
            with applicable copyright laws.
          </p>
          <p className="mt-3">
            If you are a copyright holder and believe the Service is being used to infringe upon your
            rights, please contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </section>

        <section aria-labelledby="disclaimer">
          <h2 id="disclaimer" className="text-xl font-semibold mb-3">6. Disclaimer of Warranties</h2>
          <p>
            The Service is provided on an "as is" and "as available" basis without any warranties,
            express or implied, including but not limited to warranties of merchantability, fitness for
            a particular purpose, or non-infringement. We do not warrant that:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2 text-muted-foreground">
            <li>The Service will be uninterrupted, timely, secure, or error-free</li>
            <li>Any content downloaded will be accurate, complete, or of a particular quality</li>
            <li>The Service will be available in all geographic regions</li>
            <li>Any particular video or format will be available for download at any given time</li>
          </ul>
        </section>

        <section aria-labelledby="limitation">
          <h2 id="limitation" className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, YTOUDown and its operators shall not be
            liable for any indirect, incidental, special, consequential, or punitive damages, including
            but not limited to loss of profits, data, use, or goodwill, arising out of or in connection
            with your use of the Service, even if advised of the possibility of such damages.
          </p>
          <p className="mt-3">
            In no event shall our total liability to you exceed the amount you paid to use the Service
            in the twelve months prior to the claim. Since YTOUDown is provided free of charge, this
            limit is zero.
          </p>
        </section>

        <section aria-labelledby="indemnification">
          <h2 id="indemnification" className="text-xl font-semibold mb-3">8. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless YTOUDown and its operators from and against
            any claims, liabilities, damages, losses, and expenses, including reasonable legal fees,
            arising out of or in any way connected with your use of the Service, your violation of these
            Terms, or your infringement of any intellectual property or other rights of any third party.
          </p>
        </section>

        <section aria-labelledby="termination">
          <h2 id="termination" className="text-xl font-semibold mb-3">9. Termination</h2>
          <p>
            We reserve the right to suspend or terminate access to the Service at any time, without
            notice, for conduct that we determine in our sole discretion violates these Terms or is
            harmful to other users, us, third parties, or the public interest.
          </p>
        </section>

        <section aria-labelledby="governing-law">
          <h2 id="governing-law" className="text-xl font-semibold mb-3">10. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable law. Any
            disputes arising from these Terms or your use of the Service shall be subject to the
            exclusive jurisdiction of the courts with competent authority over the matter.
          </p>
        </section>

        <section aria-labelledby="changes">
          <h2 id="changes" className="text-xl font-semibold mb-3">11. Changes to These Terms</h2>
          <p>
            We may modify these Terms at any time. The "Last updated" date will reflect the most recent
            revision. Material changes will be indicated by an updated date at the top of this page.
            Your continued use of the Service after any changes indicates your acceptance of the
            updated Terms.
          </p>
        </section>

        <section aria-labelledby="contact">
          <h2 id="contact" className="text-xl font-semibold mb-3">12. Contact</h2>
          <p>
            If you have questions about these Terms, please contact us at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>
          </p>
        </section>

      </div>

      <div className="border-t border-border pt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
        <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
      </div>
    </div>
  );
}
