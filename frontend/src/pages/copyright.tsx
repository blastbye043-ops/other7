import { SEO } from "@/components/layout/seo";
import { Link } from "wouter";

const LAST_UPDATED = "July 1, 2026";

export default function CopyrightPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <SEO
        title="Copyright Policy"
        description="YTOUDown Copyright Policy — our position on intellectual property, third-party trademarks, and user responsibilities when downloading content."
        path="/copyright"
        type="WebPage"
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Copyright Policy</h1>
        <p className="text-muted-foreground mt-2">
          Last updated: <time dateTime="2026-07-01">{LAST_UPDATED}</time>
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold mb-3">1. Our Position on Copyright</h2>
          <p>
            YTOUDown respects intellectual property rights and is committed to operating in compliance with
            applicable copyright law. We do not condone, encourage, or facilitate copyright infringement.
          </p>
          <p className="mt-3">
            YTOUDown is a technical tool that allows users to access download options for publicly accessible
            video content. The responsibility for ensuring that any downloaded content is used lawfully rests
            entirely with the user.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Content We Do Not Host</h2>
          <p>
            YTOUDown does not host, store, upload, or distribute any copyrighted video or audio content on
            its own servers. All media content remains hosted on third-party platforms (such as YouTube).
            YTOUDown merely facilitates access to information about that content and assists users in
            retrieving it for personal, lawful purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. User Responsibilities</h2>
          <p>By using YTOUDown, you agree that:</p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li>You will only download content that you have the legal right to download.</li>
            <li>You will comply with the Terms of Service and copyright policies of the platforms from which content is retrieved.</li>
            <li>You will not use downloaded content for commercial purposes without appropriate licenses or permissions.</li>
            <li>You will not redistribute, re-upload, or publicly broadcast downloaded content without authorization from the copyright holder.</li>
            <li>You understand that downloading content from platforms like YouTube may be subject to restrictions under those platforms' Terms of Service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Third-Party Trademarks</h2>
          <p>
            All trademarks, logos, and brand names referenced on YTOUDown — including but not limited to
            YouTube, Google, Instagram, Facebook, TikTok, X (formerly Twitter), Vimeo, and others — are the
            property of their respective owners. Their appearance on YTOUDown is for identification and
            compatibility purposes only and does not imply endorsement, affiliation, or sponsorship.
          </p>
          <p className="mt-3">
            YTOUDown is an independent platform and is not affiliated with, endorsed by, or sponsored by
            YouTube, Google, Meta, TikTok, X, Instagram, Facebook, Vimeo, or any other social media platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Permitted Uses</h2>
          <p>Downloading content may be permissible when:</p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li>You own the content or are the rights holder.</li>
            <li>The content is published under a Creative Commons or other open license that permits downloading.</li>
            <li>The platform provides an official download option and the content's license allows it.</li>
            <li>You have obtained explicit written permission from the copyright holder.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Reporting Copyright Infringement</h2>
          <p>
            If you believe that YTOUDown has facilitated infringement of your copyright, please submit a
            notice through our <Link href="/dmca" className="text-primary hover:underline">DMCA Policy page</Link>{" "}
            or reach out via our <Link href="/contact" className="text-primary hover:underline">Contact page</Link>.
            We review valid complaints and take appropriate action.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Changes to This Policy</h2>
          <p>
            This Copyright Policy may be updated from time to time. Continued use of the Service after
            changes constitutes acceptance of the updated policy.
          </p>
        </section>

      </div>
    </div>
  );
}
