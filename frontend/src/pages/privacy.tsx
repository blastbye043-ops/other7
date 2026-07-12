import { SEO } from "@/components/layout/seo";
import { Link } from "wouter";

const LAST_UPDATED = "July 1, 2026";
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com";
const CONTACT_EMAIL = `privacy@${new URL(SITE_URL).hostname}`;

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <SEO
        title="Privacy Policy"
        description="YTOUDown Privacy Policy — how we collect, use, and protect your information when you use our YouTube video downloader."
        path="/privacy"
        type="WebPage"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${(import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com"}/privacy#webpage`,
          about: {
            "@type": "PrivacyPolicy",
            "@id": `${(import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com"}/privacy#privacy-policy`,
            name: "YTOUDown Privacy Policy",
            url: `${(import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com"}/privacy`,
            dateModified: "2026-07-01",
            publisher: { "@id": `${(import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com"}/#organization` },
          },
        }}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2">
          Last updated: <time dateTime="2026-07-01">{LAST_UPDATED}</time>
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">

        <section aria-labelledby="overview">
          <h2 id="overview" className="text-xl font-semibold mb-3">1. Overview</h2>
          <p>
            YTOUDown ("we", "us", or "our") operates the website located at{" "}
            <a href={SITE_URL} className="text-primary hover:underline">{SITE_URL}</a> (the "Service").
            This Privacy Policy explains what information we collect, how we use it, and your rights regarding
            that information. By using the Service, you agree to the collection and use of information in
            accordance with this policy.
          </p>
        </section>

        <section aria-labelledby="information-collected">
          <h2 id="information-collected" className="text-xl font-semibold mb-3">2. Information We Collect</h2>

          <h3 className="text-base font-semibold mt-4 mb-2">2.1 Information You Provide</h3>
          <p>
            We do not require account creation to use YTOUDown. The only data you provide is the YouTube
            video URL you submit for processing. This URL is used solely to retrieve video metadata and
            initiate the download process.
          </p>

          <h3 className="text-base font-semibold mt-4 mb-2">2.2 Automatically Collected Information</h3>
          <p>When you use the Service, we may automatically collect:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2 text-muted-foreground">
            <li>Server-side logs including request timestamps, HTTP status codes, and anonymized IP addresses</li>
            <li>Browser type and operating system (via User-Agent header)</li>
            <li>Pages visited and navigation patterns within the Service</li>
            <li>Download history stored in our database, including video title, format, and file size</li>
          </ul>

          <h3 className="text-base font-semibold mt-4 mb-2">2.3 Cookies &amp; Consent</h3>
          <p>
            YTOUDown uses a cookie consent system compliant with Google Consent Mode v2 and GDPR/ePrivacy
            requirements. All analytics and advertising cookies are <strong>denied by default</strong> until
            you explicitly grant consent through our cookie banner.
          </p>
          <p className="mt-2">
            Cookie categories we may use, subject to your consent:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2 text-muted-foreground">
            <li><strong>Required cookies</strong> — always active; essential for security and functionality.</li>
            <li><strong>Analytics cookies</strong> — Google Analytics 4, only if you accept analytics.</li>
            <li>
              <strong>Advertising cookies</strong> — Google AdSense may use cookies and similar technologies
              to display and measure ads, subject to your consent. Google and its partners may use data as
              described in their own{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                privacy policies
              </a>. We do not claim Google always collects data regardless of consent — AdSense operates
              in non-personalised mode when advertising consent is withheld.
            </li>
            <li><strong>Functional cookies</strong> — remember preferences such as theme, only if you accept.</li>
          </ul>
          <p className="mt-2">
            You can review and change your consent at any time via our{" "}
            <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link> page.
            Users can withdraw consent at any time; withdrawal takes effect immediately and stops
            further data collection for the relevant category.
          </p>
        </section>

        <section aria-labelledby="how-we-use">
          <h2 id="how-we-use" className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
          <p>We use the information collected to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2 text-muted-foreground">
            <li>Process video download requests you initiate</li>
            <li>Display your download history within the application</li>
            <li>Monitor server health and diagnose technical issues</li>
            <li>Improve the reliability and performance of the Service</li>
            <li>Prevent abuse, fraud, and unauthorized use</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p className="mt-3">
            We do not sell, rent, or share your personal information with third parties for marketing purposes.
          </p>
        </section>

        <section aria-labelledby="data-retention">
          <h2 id="data-retention" className="text-xl font-semibold mb-3">4. Data Retention</h2>
          <p>
            Download history records are retained for operational purposes and to provide the history
            feature. You may delete individual history entries at any time via the{" "}
            <Link href="/history" className="text-primary hover:underline">History page</Link>.
            Server logs are retained for up to 30 days, after which they are automatically purged.
          </p>
          <p className="mt-3">
            Downloaded media files are temporarily stored on our servers during processing and are not
            retained beyond the immediate download session. Files are removed automatically once
            downloaded or after a short expiration period.
          </p>
        </section>

        <section aria-labelledby="third-parties">
          <h2 id="third-parties" className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
          <p>
            YTOUDown uses the following third-party services to operate:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2 text-muted-foreground">
            <li>
              <strong>YouTube / Google:</strong> When you submit a YouTube URL, our server communicates
              with YouTube to retrieve video metadata and media streams. Your use of YouTube content is
              subject to{" "}
              <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                YouTube's Terms of Service
              </a>{" "}
              and{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google's Privacy Policy
              </a>.
            </li>
            <li>
              <strong>Google Fonts:</strong> We load fonts from Google Fonts, which may log your IP address
              when fetching font files.
            </li>
            <li>
              <strong>Hosting Provider:</strong> The Service is hosted on third-party infrastructure. The hosting provider may collect
              server-level telemetry (e.g. request logs, uptime monitoring). Please consult your hosting provider's privacy policy for details.
            </li>
          </ul>
        </section>

        <section aria-labelledby="security">
          <h2 id="security" className="text-xl font-semibold mb-3">6. Security</h2>
          <p>
            We implement reasonable technical measures to protect your information, including CORS
            restrictions, input validation, and structured logging with sensitive field redaction.
            However, no method of transmission over the Internet or electronic storage is 100% secure.
            We cannot guarantee absolute security of your data.
          </p>
        </section>

        <section aria-labelledby="childrens-privacy">
          <h2 id="childrens-privacy" className="text-xl font-semibold mb-3">7. Children's Privacy</h2>
          <p>
            YTOUDown is not directed at children under the age of 13. We do not knowingly collect
            personal information from children. If you believe a child has provided us with personal
            information, please contact us and we will take steps to delete such information.
          </p>
        </section>

        <section aria-labelledby="your-rights">
          <h2 id="your-rights" className="text-xl font-semibold mb-3">8. Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have rights to access, correct, or delete your
            personal information. Since YTOUDown does not require account creation, most data associated
            with your usage can be managed directly through the application (e.g., deleting download
            history). For any other requests, please contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </section>

        <section aria-labelledby="changes">
          <h2 id="changes" className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The "Last updated" date at the top
            of this page will reflect the most recent revision. Continued use of the Service after
            changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>

        <section aria-labelledby="contact">
          <h2 id="contact" className="text-xl font-semibold mb-3">10. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy, please contact us at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>
          </p>
        </section>

      </div>

      <div className="border-t border-border pt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
        <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
        <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
      </div>
    </div>
  );
}
