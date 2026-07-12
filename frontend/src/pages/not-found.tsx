import { Link } from "wouter";
import { SEO } from "@/components/layout/seo";
import { Button } from "@/components/ui/button";
import { DownloadCloud, Home, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 py-16">
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Return to YTOUDown to download YouTube videos."
        path="/404"
      />

      <div className="space-y-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <DownloadCloud className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
        <h2 className="text-xl font-semibold text-muted-foreground">Page Not Found</h2>
        <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Head back to the downloader to get started.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="gap-2 min-w-[160px]">
          <Link href="/">
            <Home className="w-4 h-4" />
            Go to Downloader
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2 min-w-[160px]">
          <Link href="/faq">
            <HelpCircle className="w-4 h-4" />
            Visit FAQ
          </Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Looking for something specific?{" "}
        <Link href="/contact" className="text-primary hover:underline">Contact us</Link>
      </p>
    </div>
  );
}
