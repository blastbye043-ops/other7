import { SEO } from "@/components/layout/seo";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCookieConsentActions } from "@/components/cookie-consent";
import { Settings, ShieldCheck, BarChart2, Megaphone, Star } from "lucide-react";

const LAST_UPDATED = "July 8, 2026";

export default function CookiePolicyPage() {
  const { openSettings } = useCookieConsentActions();

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <SEO
        title="Cookie Policy"
        description="YTOUDown Cookie Policy — how we use cookies, what types we use, and how you can manage your preferences."
        path="/cookies"
        type="WebPage"
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cookie Policy</h1>
        <p className="text-muted-foreground mt-2">
          Last updated: <time dateTime="2026-07-08">{LAST_UPDATED}</time>
        </p>
      </div>

      {/* Manage preferences CTA */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Manage Your Cookie Preferences</p>
          <p className="text-xs text-muted-foreground mt-1">
            You can review and update your cookie choices at any time.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={openSettings}
          className="shrink-0 gap-2"
          aria-label="Open cookie settings"
        >
          <Settings aria-hidden="true" className="w-3.5 h-3.5" />
          Cookie Settings
        </Button>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold mb-3">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files placed on your device when you visit a website. They help websites
            remember your preferences, measure how pages are used, and support advertising services. Cookies
            are widely used across the internet and are generally safe and essential for many modern web features.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Google Consent Mode v2</h2>
          <p>
            YTOUDown implements <strong>Google Consent Mode v2</strong> to respect your privacy choices. This means:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li>All analytics and advertising signals are <strong>denied by default</strong> when you first visit.</li>
            <li>Google Tag Manager and AdSense operate in a privacy-safe mode until you explicitly accept the relevant categories.</li>
            <li>Your consent choice is stored locally for 12 months and can be changed at any time.</li>
            <li>We never enable cookies before you have granted consent for the relevant category.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Cookie Categories</h2>
          <div className="space-y-5">

            <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck aria-hidden="true" className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Required Cookies</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">Always Active</span>
              </div>
              <p className="text-xs text-muted-foreground">
                These cookies are essential for the website to function and cannot be disabled. They enable core
                features such as security enforcement, rate-limiting, and basic session management. They do not
                collect personal information for marketing purposes.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Consent signals:</strong> <code>security_storage: granted</code>
              </p>
            </div>

            <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 aria-hidden="true" className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Analytics Cookies</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Help us understand how visitors interact with the site — which pages are visited most,
                how long sessions last, and where users come from. All data is aggregated and anonymous.
                We use <strong>Google Analytics 4</strong> for this purpose.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Consent signals:</strong> <code>analytics_storage</code>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Provider:</strong>{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google LLC</a>
              </p>
            </div>

            <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone aria-hidden="true" className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Advertising Cookies</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Allow <strong>Google AdSense</strong> to serve ads. When you accept this category,
                personalised advertising based on your browsing activity may be shown. If you reject this
                category, only non-personalised ads are eligible to be displayed — your data is not used for
                ad targeting or conversion measurement.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Consent signals:</strong> <code>ad_storage</code>, <code>ad_user_data</code>, <code>ad_personalization</code>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Provider:</strong>{" "}
                <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google LLC — AdSense</a>
                {" · "}
                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Opt out of personalised ads</a>
              </p>
            </div>

            <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star aria-hidden="true" className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Functional Cookies</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Remember your preferences between visits — such as theme, recently used settings, and
                language. These enhance your experience but are not essential to use the site.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Consent signals:</strong> <code>functionality_storage</code>, <code>personalization_storage</code>
              </p>
            </div>

          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. How We Store Your Consent</h2>
          <p>
            Your cookie preferences are stored in your browser's <strong>localStorage</strong> under the
            key <code>ytoudown_consent</code>. This is a first-party, client-side store — it is not sent
            to our servers. Your choice remains valid for <strong>12 months</strong>, after which you will
            be asked again. You can update your choice at any time using the button above.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Third-Party Cookies</h2>
          <p>
            Some cookies are set directly by third-party services (Google Analytics, Google AdSense) on
            pages where those services are active. We do not control those cookies. Please refer to each
            provider's own policy for details:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-3">
            <li>
              <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google Cookie Policy
              </a>
            </li>
            <li>
              <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google Advertising Technologies
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Managing Cookies in Your Browser</h2>
          <p>
            You can also control cookies through your browser settings. Most browsers let you block or
            delete cookies. Note that disabling required cookies may affect site functionality.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-3">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
            <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
            <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Changes to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. Changes will be posted on this page with an
            updated date. Material changes that require fresh consent will trigger the cookie banner again.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
          <p>
            Questions about our cookie use? Visit our{" "}
            <Link href="/contact" className="text-primary hover:underline">Contact page</Link>{" "}
            or read our{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </section>

      </div>
    </div>
  );
}
