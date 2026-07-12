import { SEO } from "@/components/layout/seo";
import { Link } from "wouter";

const LAST_UPDATED = "July 1, 2026";

export default function DisclaimerPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <SEO
        title="Disclaimer"
        description="YTOUDown Disclaimer — limitations of liability, intended use, and user responsibility when using the YTOUDown YouTube video downloader."
        path="/disclaimer"
        type="WebPage"
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Disclaimer</h1>
        <p className="text-muted-foreground mt-2">
          Last updated: <time dateTime="2026-07-01">{LAST_UPDATED}</time>
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold mb-3">1. General Disclaimer</h2>
          <p>
            The information and functionality provided by YTOUDown are offered "as is" and for educational
            and lawful personal use only. YTOUDown makes no representations or warranties of any kind,
            express or implied, regarding the operation of the Service, the accuracy of information, or
            the suitability of the Service for any particular purpose.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Intended Use</h2>
          <p>
            YTOUDown is intended to be used only for lawful purposes and only with content that the user
            has the legal right to download. Users are solely responsible for ensuring that their use of
            the Service complies with applicable copyright laws, platform terms of service, and local
            regulations in their jurisdiction.
          </p>
          <p className="mt-3">
            YTOUDown does not encourage or facilitate copyright infringement. Downloading content from
            platforms such as YouTube may be subject to restrictions under those platforms' Terms of Service.
            Users should review the applicable terms before downloading any content.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. No Affiliation</h2>
          <p>
            YTOUDown is an independent platform and is not affiliated with, endorsed by, or sponsored by
            YouTube, Google, Meta, TikTok, X (formerly Twitter), Instagram, Facebook, Vimeo, or any other
            social media or video platform. All third-party trademarks and brand names referenced on this
            website are the property of their respective owners.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, YTOUDown, its operators, contributors, and
            affiliates shall not be liable for any direct, indirect, incidental, consequential, or punitive
            damages arising from:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li>Your use of or inability to use the Service.</li>
            <li>Any content downloaded through the Service.</li>
            <li>Any unauthorized or unlawful use of downloaded content by users.</li>
            <li>Any technical errors, service interruptions, or data loss.</li>
            <li>Actions taken by third-party platforms that affect the availability of content.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Service Availability</h2>
          <p>
            YTOUDown does not guarantee uninterrupted or error-free availability of the Service. Third-party
            platforms may change their systems at any time, which may affect the functionality of YTOUDown
            without notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. External Links</h2>
          <p>
            YTOUDown may contain links to third-party websites. These links are provided for convenience only.
            We have no control over the content of those sites and accept no responsibility for them or for
            any loss or damage that may arise from your use of them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Changes</h2>
          <p>
            This Disclaimer may be updated from time to time without notice. Continued use of the Service
            after changes constitutes acceptance of the updated Disclaimer.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
          <p>
            For questions about this Disclaimer, please visit our{" "}
            <Link href="/contact" className="text-primary hover:underline">Contact page</Link>.
          </p>
        </section>

      </div>
    </div>
  );
}
