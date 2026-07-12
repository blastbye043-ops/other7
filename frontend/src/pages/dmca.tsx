import { SEO } from "@/components/layout/seo";
import { Link } from "wouter";

const LAST_UPDATED = "July 1, 2026";

export default function DMCAPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <SEO
        title="DMCA Policy"
        description="YTOUDown DMCA Policy — how to submit a copyright infringement notice and how we handle valid DMCA takedown requests."
        path="/dmca"
        type="WebPage"
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">DMCA Policy</h1>
        <p className="text-muted-foreground mt-2">
          Last updated: <time dateTime="2026-07-01">{LAST_UPDATED}</time>
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold mb-3">1. Overview</h2>
          <p>
            YTOUDown respects the intellectual property rights of others and expects users of the Service to
            do the same. In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), YTOUDown
            will respond promptly to claims of copyright infringement that are reported to our designated
            copyright agent.
          </p>
          <p className="mt-3">
            YTOUDown does not host, store, or distribute copyrighted media on its own servers. The Service
            processes publicly accessible content from third-party platforms at the direction of the user.
            Nonetheless, we take copyright concerns seriously and will review valid notices promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Filing a DMCA Notice</h2>
          <p>
            If you believe that content associated with or facilitated by YTOUDown infringes your copyright,
            you may submit a written DMCA takedown notice. To be valid, your notice must include all of the following:
          </p>
          <ol className="list-decimal pl-5 space-y-2 mt-3">
            <li>A physical or electronic signature of the person authorized to act on behalf of the copyright owner.</li>
            <li>Identification of the copyrighted work you claim has been infringed.</li>
            <li>Identification of the material that you claim is infringing, with sufficient detail for us to locate it.</li>
            <li>Your contact information — including name, mailing address, telephone number, and email address.</li>
            <li>A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
            <li>A statement, under penalty of perjury, that the information in the notice is accurate and that you are authorized to act on behalf of the copyright owner.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. How to Submit</h2>
          <p>
            Send your completed DMCA notice through our{" "}
            <Link href="/contact" className="text-primary hover:underline">Contact page</Link>.
            Please include "DMCA Notice" in the subject line. We review valid copyright complaints promptly
            and take appropriate action where required.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Counter-Notice</h2>
          <p>
            If you believe that content was removed or disabled as a result of a mistake or misidentification,
            you may submit a counter-notice. A valid counter-notice must include:
          </p>
          <ol className="list-decimal pl-5 space-y-2 mt-3">
            <li>Your physical or electronic signature.</li>
            <li>Identification of the material that was removed and the location where it appeared before removal.</li>
            <li>A statement under penalty of perjury that you have a good-faith belief that the material was removed as a result of mistake or misidentification.</li>
            <li>Your name, address, telephone number, and email address.</li>
            <li>A statement consenting to the jurisdiction of the appropriate federal district court.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Repeat Infringers</h2>
          <p>
            YTOUDown reserves the right to terminate access for users who are determined to be repeat
            infringers of intellectual property rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Disclaimer</h2>
          <p>
            This DMCA Policy is provided for informational purposes and to comply with applicable law.
            Nothing in this policy constitutes legal advice. If you have legal concerns regarding copyright
            infringement, please consult a qualified attorney.
          </p>
        </section>

      </div>
    </div>
  );
}
