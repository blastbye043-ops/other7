import { useState } from "react";
import { Link, useLocation } from "wouter";
import { DownloadCloud, History, LayoutGrid, HelpCircle, Info, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AdPlaceholder } from "@/components/ui/ad-placeholder";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Downloader", icon: DownloadCloud, title: "YTOUDown YouTube video downloader home page" },
    { href: "/history", label: "History", icon: History, title: "View your recent download history" },
    { href: "/formats", label: "Formats", icon: LayoutGrid, title: "Supported video and audio formats" },
    { href: "/faq", label: "FAQ", icon: HelpCircle, title: "Frequently asked questions about YTOUDown" },
    { href: "/about", label: "About", icon: Info, title: "About YTOUDown" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground dark">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center mx-auto px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2 mr-8">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <DownloadCloud aria-hidden="true" className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">YTOUDown</span>
          </Link>
          
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                title={item.title}
                className={`transition-colors hover:text-primary ${location === item.href ? "text-primary" : "text-muted-foreground"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <div className="ml-auto md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                  <Menu aria-hidden="true" className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 pt-12" aria-label="Navigation menu">
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.title}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                          location === item.href
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon aria-hidden="true" className="w-4 h-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/*
        Content area — 3-column flex at ≥1600 px (left sidebar · main · right sidebar).
        Below 1600 px the sidebar columns are hidden and the main fills the full width.
        Sticky sidebars avoid fixed positioning so Google Auto Ads can inject freely
        into the content flow without conflict.
      */}
      <div className="flex-1 flex items-start justify-center">

        {/* Left sidebar — sticky, desktop-only at ≥1200 px.
            No role/aria here — AdPlaceholder's own <aside> carries the landmark. */}
        <div className="hidden min-[1200px]:flex flex-col w-[300px] shrink-0 self-start sticky top-20 py-8 pl-4 pr-2">
          <AdPlaceholder
            id="left-sidebar-ad"
            type="sidebar"
            showOnMobile={false}
            showOnDesktop={true}
            showPlaceholder={true}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 container mx-auto px-4 md:px-8 py-8">
          {children}
        </main>

        {/* Right sidebar — sticky, desktop-only at ≥1200 px */}
        <div className="hidden min-[1200px]:flex flex-col w-[300px] shrink-0 self-start sticky top-20 py-8 pl-2 pr-4">
          <AdPlaceholder
            id="right-sidebar-ad"
            type="sidebar"
            showOnMobile={false}
            showOnDesktop={true}
            showPlaceholder={true}
          />
        </div>

      </div>

      {/* Footer Banner Ad — above the footer, full-width container-constrained */}
      <div className="container mx-auto px-4 md:px-8 pb-4">
        <AdPlaceholder
          id="footer-banner-ad"
          type="banner"
          desktopHeight={90}
          mobileHeight={100}
          showOnDesktop={true}
          showOnMobile={true}
          showPlaceholder={true}
        />
      </div>

      <footer className="border-t border-border bg-muted/20">

        {/* Legal notices block */}
        <div className="container mx-auto px-4 md:px-8 py-8 md:py-10 space-y-6 text-xs text-muted-foreground leading-relaxed">

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground/70 uppercase tracking-wide text-[10px]">Copyright &amp; Content</p>
              <p>
                YTOUDown does not host, store, or distribute any copyrighted media on its own servers.
                All content is processed from publicly accessible sources. Users are solely responsible
                for ensuring they have the legal right to download and use any content.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground/70 uppercase tracking-wide text-[10px]">No Affiliation</p>
              <p>
                YTOUDown is an independent platform and is not affiliated with, endorsed by, or sponsored
                by YouTube, Google, Meta, TikTok, X (Twitter), Instagram, Facebook, Vimeo, or any other
                platform. All trademarks are the property of their respective owners.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground/70 uppercase tracking-wide text-[10px]">Disclaimer</p>
              <p>
                YTOUDown is provided for educational and lawful personal use only. Users are responsible
                for ensuring their use of downloaded content complies with applicable copyright laws,
                platform terms, and local regulations. YTOUDown accepts no responsibility for misuse.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground/70 uppercase tracking-wide text-[10px]">Cookies &amp; Advertising</p>
              <p>
                This site may use cookies to improve functionality, analyze traffic, and support
                advertising services. Third-party vendors including Google may use cookies to serve
                or personalize ads. By using YTOUDown you consent to cookies as described in our{" "}
                <Link href="/cookies" title="Read YTOUDown's Cookie Policy" className="text-primary/80 hover:text-primary underline">Cookie Policy</Link>.
              </p>
            </div>
          </div>

          {/* DMCA strip */}
          <p className="border-t border-border/40 pt-5">
            <strong className="text-foreground/60">DMCA:</strong>{" "}
            If you believe content associated with YTOUDown infringes your intellectual property rights,
            submit a notice via our <Link href="/dmca" title="Read YTOUDown's DMCA Policy" className="text-primary/80 hover:text-primary underline">DMCA Policy page</Link>.
            We review valid copyright complaints promptly and take appropriate action.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/40">
          <div className="container mx-auto px-4 md:px-8 py-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <DownloadCloud aria-hidden="true" className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">YTOUDown</span>
              <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} · All Rights Reserved.</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              YTOUDown is an independent online video downloader and is not affiliated with YouTube,
              Google, Meta, TikTok, X (Twitter), Instagram, Facebook, Vimeo, or any other platform.
            </p>

            <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground -mx-1">
              {[
                { href: "/about", label: "About", title: "About YTOUDown" },
                { href: "/faq", label: "FAQ", title: "Frequently asked questions about YTOUDown" },
                { href: "/formats", label: "Formats", title: "Supported video and audio formats" },
                { href: "/alternatives", label: "Alternatives", title: "YTOUDown vs. other YouTube downloaders" },
                { href: "/contact", label: "Contact", title: "Contact the YTOUDown team" },
                { href: "/privacy", label: "Privacy Policy", title: "Read YTOUDown's Privacy Policy" },
                { href: "/terms", label: "Terms of Service", title: "Read YTOUDown's Terms of Service" },
                { href: "/cookies", label: "Cookie Policy", title: "Read YTOUDown's Cookie Policy" },
                { href: "/dmca", label: "DMCA", title: "Read YTOUDown's DMCA Policy" },
                { href: "/copyright", label: "Copyright Policy", title: "Read YTOUDown's Copyright Policy" },
                { href: "/disclaimer", label: "Disclaimer", title: "Read YTOUDown's Disclaimer" },
              ].map(({ href, label, title }) => (
                <Link key={href} href={href} title={title} className="hover:text-foreground transition-colors px-1 py-2.5 min-h-[44px] flex items-center">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

      </footer>
    </div>
  );
}
