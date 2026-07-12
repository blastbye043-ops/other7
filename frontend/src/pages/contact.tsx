import { SEO } from "@/components/layout/seo";
import { Link } from "wouter";
import { Mail, FileText, ShieldAlert, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const topics = [
  {
    icon: ShieldAlert,
    title: "DMCA / Copyright",
    desc: "To report a copyright infringement, please review our DMCA Policy first, then email with subject line \"DMCA Notice\" including all required details.",
    link: { href: "/dmca", label: "DMCA Policy" },
  },
  {
    icon: FileText,
    title: "Legal Inquiries",
    desc: "For legal questions, Terms of Service queries, or privacy-related requests, please email with a clear description of your concern.",
    link: { href: "/privacy", label: "Privacy Policy" },
  },
  {
    icon: HelpCircle,
    title: "General Support",
    desc: "For questions about how the downloader works, supported formats, or troubleshooting, the FAQ page covers most common topics.",
    link: { href: "/faq", label: "Visit FAQ" },
  },
];

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <SEO
        title="Contact"
        description="Contact YTOUDown for DMCA notices, legal inquiries, copyright concerns, or general support questions."
        path="/contact"
        type="WebPage"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "@id": `${(import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com"}/contact#webpage`,
          url: `${(import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com"}/contact`,
          name: "Contact YTOUDown",
          description: "Contact page for DMCA notices, legal inquiries, and general support.",
          publisher: { "@id": `${(import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ?? "https://ytoudown.com"}/#organization` },
        }}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Use the appropriate channel below depending on the nature of your inquiry.
        </p>
      </div>

      <div className="space-y-4">
        {topics.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.title}>
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h2 className="font-semibold">{t.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                    <Link href={t.link.href} className="text-xs text-primary hover:underline">
                      {t.link.label} →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 flex items-start gap-4">
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0 mt-0.5">
          <Mail className="w-4 h-4 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="font-semibold">Email</h2>
          <p className="text-sm text-muted-foreground">
            For all inquiries — including DMCA notices, legal matters, and general questions — please
            use the subject line that matches your request (e.g., "DMCA Notice", "Privacy Request", "General Question")
            so we can route your message correctly.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            We aim to respond to all valid inquiries within <strong>5 business days</strong>.
            DMCA and legal notices are prioritized and reviewed as quickly as possible.
          </p>
        </div>
      </div>

      <div className="border-t border-border pt-6 text-sm text-muted-foreground space-y-1">
        <p>Related pages:</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/dmca" title="Read YTOUDown's DMCA Policy" className="text-primary hover:underline">DMCA Policy</Link>
          <Link href="/privacy" title="Read YTOUDown's Privacy Policy" className="text-primary hover:underline">Privacy Policy</Link>
          <Link href="/terms" title="Read YTOUDown's Terms of Service" className="text-primary hover:underline">Terms of Service</Link>
          <Link href="/copyright" title="Read YTOUDown's Copyright Policy" className="text-primary hover:underline">Copyright Policy</Link>
          <Link href="/disclaimer" title="Read YTOUDown's Disclaimer" className="text-primary hover:underline">Disclaimer</Link>
          <Link href="/cookies" title="Read YTOUDown's Cookie Policy" className="text-primary hover:underline">Cookie Policy</Link>
        </div>
      </div>
    </div>
  );
}
