import { useMemo, useState, useEffect, memo } from "react";
import { Download, Loader2, FileVideo, FileAudio, Music } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatFilesize } from "@/lib/format";

interface Format {
  formatId: string;
  ext: string;
  quality: string;
  resolution?: string | null;
  filesize?: number | null;
  vcodec?: string | null;
  acodec?: string | null;
  fps?: number | null;
  tbr?: number | null;
  container?: "mp4" | "webm" | "audio" | string;
  hasAudio?: boolean;
  audioBitrate?: number | null;
}

interface FormatDropdownProps {
  formats: Format[];
  onDownload: (formatId: string) => void;
  isPending: boolean;
  ffmpegAvailable?: boolean;
}

function getResolutionHeight(format: Format): number {
  const res = format.resolution ?? format.quality ?? "";
  const wh = res.match(/\d+x(\d+)/i);
  if (wh) return parseInt(wh[1], 10);
  const p = res.match(/(\d+)p/i);
  if (p) return parseInt(p[1], 10);
  return 0;
}

function isMp3(format: Format): boolean {
  return format.formatId.startsWith("mp3-");
}

function isAudioOnly(format: Format): boolean {
  return format.container === "audio" || isMp3(format) || (!format.vcodec && !!format.acodec);
}

function getCodecLabel(format: Format): string | null {
  const raw = isAudioOnly(format) ? format.acodec : format.vcodec;
  if (!raw || raw === "none") return null;
  if (raw.startsWith("avc") || raw.startsWith("h264")) return "H.264";
  if (raw.startsWith("av01")) return "AV1";
  if (raw.startsWith("vp9")) return "VP9";
  if (raw.startsWith("vp8")) return "VP8";
  if (raw.startsWith("hev") || raw.startsWith("h265")) return "H.265";
  if (raw.startsWith("mp4a")) return "AAC";
  if (raw.startsWith("opus")) return "Opus";
  if (raw.startsWith("vorbis")) return "Vorbis";
  return raw.split(".")[0].toUpperCase();
}

function getContainer(format: Format): "mp4" | "webm" | "audio" {
  if (format.container === "mp4" || format.container === "webm" || format.container === "audio") {
    return format.container;
  }
  if (isAudioOnly(format)) return "audio";
  return format.ext === "webm" ? "webm" : "mp4";
}

function primaryLabel(format: Format): string {
  if (isMp3(format)) return `MP3 ${format.audioBitrate ?? ""}kbps`.trim();
  if (isAudioOnly(format)) {
    const bitrate = format.tbr ? `${Math.round(format.tbr)}kbps` : format.quality;
    return `${format.ext.toUpperCase()} Audio · ${bitrate}`;
  }
  return format.resolution || format.quality || "Unknown quality";
}

function detailLabel(format: Format): string {
  const details: string[] = [];
  const codec = getCodecLabel(format);
  if (!isAudioOnly(format)) {
    if (codec) details.push(codec);
    if (format.fps) details.push(`${Math.round(format.fps)}fps`);
    if (!format.hasAudio && !isMp3(format)) details.push("no audio");
  } else if (codec && !isMp3(format)) {
    details.push(codec);
  }
  if (format.filesize) details.push(`≈${formatFilesize(format.filesize)}`);
  else if (isMp3(format)) details.push("converted with FFmpeg");
  return details.join(" · ");
}

const GROUP_META: Record<"mp4" | "webm" | "audio", { label: string; Icon: typeof FileVideo }> = {
  mp4: { label: "MP4 Video", Icon: FileVideo },
  webm: { label: "WEBM Video", Icon: FileVideo },
  audio: { label: "Audio", Icon: FileAudio },
};

function pickDefault(groups: Record<string, Format[]>): string {
  const mp4 = groups.mp4 ?? [];
  const preferred =
    mp4.find((f) => getResolutionHeight(f) === 1080) ||
    mp4.find((f) => getResolutionHeight(f) === 720) ||
    mp4[0] ||
    (groups.webm ?? [])[0] ||
    (groups.audio ?? [])[0];
  return preferred?.formatId ?? "";
}

function downloadLabel(format: Format | undefined): string {
  if (!format) return "Download";
  if (isMp3(format)) return "Download MP3";
  const container = getContainer(format);
  if (container === "webm") return "Download WEBM";
  if (container === "audio") return `Download ${format.ext.toUpperCase()}`;
  return "Download MP4";
}

function FormatDropdownInner({ formats, onDownload, isPending, ffmpegAvailable }: FormatDropdownProps) {
  const groups = useMemo(() => {
    const byContainer: Record<"mp4" | "webm" | "audio", Format[]> = { mp4: [], webm: [], audio: [] };
    for (const f of formats) byContainer[getContainer(f)].push(f);

    const sortVideo = (a: Format, b: Format) =>
      getResolutionHeight(b) - getResolutionHeight(a) || (b.tbr ?? 0) - (a.tbr ?? 0);
    const sortAudio = (a: Format, b: Format) => (b.tbr ?? 0) - (a.tbr ?? 0);

    byContainer.mp4.sort(sortVideo);
    byContainer.webm.sort(sortVideo);
    byContainer.audio.sort(sortAudio);

    return byContainer;
  }, [formats]);

  const orderedGroups = (["mp4", "webm", "audio"] as const).filter((k) => groups[k].length > 0);

  const [selected, setSelected] = useState<string>(() => pickDefault(groups));

  useEffect(() => {
    const allIds = new Set(formats.map((f) => f.formatId));
    if (!allIds.has(selected)) {
      setSelected(pickDefault(groups));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formats]);

  const selectedFormat = formats.find((f) => f.formatId === selected);

  if (orderedGroups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No downloadable formats were found.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <Select value={selected} onValueChange={setSelected} disabled={isPending}>
          <SelectTrigger
            className="w-full sm:w-80 h-12 rounded-xl transition-colors hover:bg-muted/50"
            aria-label="Select download format"
          >
            <SelectValue placeholder="Choose a format" />
          </SelectTrigger>
          <SelectContent className="max-h-80 rounded-xl">
            {orderedGroups.map((key) => {
              const { label, Icon } = GROUP_META[key];
              return (
                <SelectGroup key={key}>
                  <SelectLabel className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                    <Icon aria-hidden="true" className="w-3.5 h-3.5" /> {label}
                  </SelectLabel>
                  {groups[key].map((format) => (
                    <SelectItem
                      key={format.formatId}
                      value={format.formatId}
                      className="rounded-lg transition-colors data-[highlighted]:bg-muted"
                    >
                      <span className="flex flex-col items-start">
                        <span className="flex items-center gap-1.5 font-medium">
                          {isMp3(format) && <Music aria-hidden="true" className="w-3 h-3 text-primary" />}
                          {primaryLabel(format)}
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            .{format.ext}
                          </span>
                        </span>
                        {detailLabel(format) && (
                          <span className="text-xs text-muted-foreground">{detailLabel(format)}</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
            {ffmpegAvailable === false && (
              <div className="px-2 py-2 text-xs text-muted-foreground border-t border-border mt-1">
                MP3 conversion is unavailable on this server (FFmpeg not installed).
              </div>
            )}
          </SelectContent>
        </Select>
        <Button
          onClick={() => selected && onDownload(selected)}
          disabled={!selected || isPending}
          className="gap-2 shrink-0 h-12 w-full sm:w-auto"
        >
          {isPending ? (
            <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="w-4 h-4" />
          )}
          {downloadLabel(selectedFormat)}
        </Button>
      </div>
    </div>
  );
}

// memo: formats and callbacks are stable references (useMemo + useCallback in
// parent) so this eliminates re-renders while the job-status polling interval
// ticks every 2 s.
export const FormatDropdown = memo(FormatDropdownInner);
