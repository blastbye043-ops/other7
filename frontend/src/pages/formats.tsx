import { useGetSupportedFormats, getGetSupportedFormatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/layout/seo";
import { FileVideo, Music } from "lucide-react";
import { Link } from "wouter";

export default function FormatsPage() {
  const { data: formats, isLoading } = useGetSupportedFormats({
    query: { queryKey: getGetSupportedFormatsQueryKey() }
  });

  const videoFormats = formats?.filter(f => f.type === "video") ?? [];
  const audioFormats = formats?.filter(f => f.type === "audio") ?? [];

  return (
    <div className="space-y-8">
      <SEO
        title="Supported Formats"
        description="Browse all supported video and audio download formats available on YTOUDown — MP4, WebM, M4A, MP3 and more."
        path="/formats"
        type="CollectionPage"
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supported Formats</h1>
        <p className="text-muted-foreground mt-1">Choose the right format for your needs — from 4K video to compressed audio.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Video formats */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileVideo className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Video Formats</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoFormats.map((fmt) => (
                <Card key={fmt.id} data-testid={`format-card-${fmt.id}`} className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm leading-tight">{fmt.label}</h3>
                      <Badge variant="secondary" className="font-mono text-xs uppercase ml-2 flex-shrink-0">
                        {fmt.ext}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{fmt.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Audio formats */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Music className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Audio Formats</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {audioFormats.map((fmt) => (
                <Card key={fmt.id} data-testid={`format-card-${fmt.id}`} className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm leading-tight">{fmt.label}</h3>
                      <Badge variant="secondary" className="font-mono text-xs uppercase ml-2 flex-shrink-0">
                        {fmt.ext}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{fmt.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6 pb-6">
          <h3 className="font-semibold mb-1">Need a specific format?</h3>
          <p className="text-sm text-muted-foreground">
            YTOUDown uses{" "}
            <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              yt-dlp
            </a>{" "}
            under the hood. When you paste a YouTube URL, we fetch all available formats directly
            from the video and let you pick the exact quality you want — including formats not listed
            here. Have a question that's not answered on this page? Check the{" "}
            <Link href="/faq" title="Frequently asked questions about YTOUDown" className="text-primary hover:underline">
              FAQ
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
