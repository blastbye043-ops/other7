import { useState } from "react";
import { Download, ChevronDown, FileVideo, FileAudio } from "lucide-react";
import { formatFilesize } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

interface FormatGroup {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  formats: Format[];
  type: "video" | "audio";
}

interface FormatPickerProps {
  formats: Format[];
  onDownload: (formatId: string) => void;
  isPending: boolean;
  /** Controlled: which group id is currently open. null = use first group. */
  openId: string | null;
  /** Called when the user switches groups. */
  onOpenChange: (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getResolutionHeight(format: Format): number {
  const res = format.resolution ?? format.quality ?? "";
  const wh = res.match(/\d+x(\d+)/i);
  if (wh) return parseInt(wh[1], 10);
  const p = res.match(/(\d+)p/i);
  if (p) return parseInt(p[1], 10);
  return 0;
}

interface Badge {
  label: string;
  className: string;
}

function getQualityBadge(format: Format, type: "video" | "audio"): Badge {
  // All badges use very low-opacity tints to stay within the dark premium theme.
  if (type === "audio") {
    return { label: "Audio", className: "bg-white/[0.06] text-zinc-400 border-white/[0.08]" };
  }
  const h = getResolutionHeight(format);
  if (h >= 2160) return { label: "4K",  className: "bg-violet-500/[0.12] text-violet-300/80 border-violet-500/[0.15]" };
  if (h >= 1440) return { label: "2K",  className: "bg-blue-500/[0.12]   text-blue-300/80   border-blue-500/[0.15]" };
  if (h >= 1080) return { label: "FHD", className: "bg-sky-500/[0.12]    text-sky-300/80    border-sky-500/[0.15]" };
  if (h >= 720)  return { label: "HD",  className: "bg-emerald-500/[0.12] text-emerald-300/80 border-emerald-500/[0.15]" };
  return              { label: "SD",  className: "bg-white/[0.05]    text-zinc-500      border-white/[0.07]" };
}

function getCodecLabel(format: Format, type: "video" | "audio"): string | null {
  const raw = type === "video" ? format.vcodec : format.acodec;
  if (!raw || raw === "none") return null;
  if (raw.startsWith("avc") || raw.startsWith("h264")) return "H.264";
  if (raw.startsWith("av01"))                           return "AV1";
  if (raw.startsWith("vp9"))                            return "VP9";
  if (raw.startsWith("vp8"))                            return "VP8";
  if (raw.startsWith("hev") || raw.startsWith("h265")) return "H.265";
  if (raw.startsWith("mp4a"))                           return "AAC";
  if (raw.startsWith("opus"))                           return "Opus";
  if (raw.startsWith("vorbis"))                         return "Vorbis";
  return raw.split(".")[0].toUpperCase();
}

function categorize(formats: Format[]): FormatGroup[] {
  const hasVideo   = (f: Format) => f.vcodec && f.vcodec !== "none";
  const hasAudio   = (f: Format) => f.acodec && f.acodec !== "none";
  const videoOnly  = (f: Format) => hasVideo(f);
  const audioOnly  = (f: Format) => !hasVideo(f) && hasAudio(f);

  const sortVideo = (a: Format, b: Format) => {
    const hDiff = getResolutionHeight(b) - getResolutionHeight(a);
    return hDiff !== 0 ? hDiff : (b.filesize ?? 0) - (a.filesize ?? 0);
  };
  const sortAudio = (a: Format, b: Format) => (b.tbr ?? 0) - (a.tbr ?? 0);

  const mp4Video  = formats.filter(f => f.ext === "mp4"  && videoOnly(f)).sort(sortVideo);
  const webmVideo = formats.filter(f => f.ext === "webm" && videoOnly(f)).sort(sortVideo);
  const mp3Audio  = formats.filter(f => (f.ext === "m4a" || f.ext === "mp3") && audioOnly(f)).sort(sortAudio);
  const webmAudio = formats.filter(f => f.ext === "webm" && audioOnly(f)).sort(sortAudio);

  const groups: FormatGroup[] = [
    { id: "mp4-video",  label: "MP4 Video",  Icon: FileVideo, formats: mp4Video,  type: "video" },
    { id: "mp3-audio",  label: "MP3 Audio",  Icon: FileAudio, formats: mp3Audio,  type: "audio" },
    { id: "webm-video", label: "WEBM Video", Icon: FileVideo, formats: webmVideo, type: "video" },
    { id: "webm-audio", label: "WEBM Audio", Icon: FileAudio, formats: webmAudio, type: "audio" },
  ];

  return groups.filter(g => g.formats.length > 0);
}

// ─── FormatCard ───────────────────────────────────────────────────────────────

function FormatCard({
  format,
  type,
  onDownload,
  isPending,
}: {
  format: Format;
  type: "video" | "audio";
  onDownload: (id: string) => void;
  isPending: boolean;
}) {
  const badge  = getQualityBadge(format, type);
  const codec  = getCodecLabel(format, type);
  const bitrate = format.tbr ? `${Math.round(format.tbr)} kbps` : null;

  const primaryLabel =
    type === "video"
      ? format.quality || format.resolution || "Unknown"
      : bitrate || format.quality || "Audio";

  const details: string[] = [];
  if (type === "video" && format.resolution) details.push(format.resolution);
  if (codec) details.push(codec);
  if (type === "video" && format.fps) details.push(`${Math.round(format.fps)} FPS`);
  if (type === "audio" && bitrate) details.push(bitrate);

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#1f1f23] hover:bg-[#26262b] shadow-[0_4px_14px_rgba(0,0,0,0.35)] hover:-translate-y-px transition-all duration-200 animate-in fade-in-0 duration-200">
      {/* Left: icon + info */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="bg-white/[0.06] p-2 rounded-lg shrink-0 mt-0.5">
          {type === "video"
            ? <FileVideo aria-hidden="true" className="w-4 h-4 text-zinc-400" />
            : <FileAudio aria-hidden="true" className="w-4 h-4 text-zinc-400" />}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          {/* Row 1: primary label + ext + quality badge */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="font-semibold text-sm text-foreground leading-none">
              {primaryLabel}
            </span>
            <span className="text-[10px] font-mono bg-white/[0.07] text-zinc-500 px-1.5 py-0.5 rounded uppercase leading-none">
              .{format.ext}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border leading-none ${badge.className}`}>
              {badge.label}
            </span>
          </div>

          {/* Row 2: resolution • codec • fps */}
          {details.length > 0 && (
            <p className="text-xs text-zinc-500 leading-relaxed">
              {details.join(" • ")}
            </p>
          )}

          {/* Row 3: file size */}
          {format.filesize ? (
            <p className="text-xs text-zinc-600">≈ {formatFilesize(format.filesize)}</p>
          ) : null}
        </div>
      </div>

      {/* Right: download button */}
      <button
        onClick={() => onDownload(format.formatId)}
        disabled={isPending}
        aria-label={`Download ${primaryLabel} .${format.ext}`}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#ef4444] to-[#dc2626] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0 w-full sm:w-auto"
      >
        <Download aria-hidden="true" className="w-4 h-4" />
        Download
      </button>
    </div>
  );
}

// ─── FormatAccordion ──────────────────────────────────────────────────────────

function FormatAccordion({
  group,
  isOpen,
  onToggle,
  onDownload,
  isPending,
}: {
  group: FormatGroup;
  isOpen: boolean;
  onToggle: () => void;
  onDownload: (id: string) => void;
  isPending: boolean;
}) {
  const { Icon } = group;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#18181b] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
      {/* Accordion header */}
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-white/[0.025] transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/[0.06] p-2 rounded-lg shrink-0">
            <Icon aria-hidden="true" className="w-4 h-4 text-zinc-400" />
          </div>
          <span className="font-semibold text-sm text-foreground">{group.label}</span>
          <span className="text-xs font-mono text-zinc-600 bg-white/[0.04] px-2 py-0.5 rounded-full tabular-nums">
            {group.formats.length}
          </span>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ease-out ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Animated content via CSS grid trick */}
      <div
        className={`grid transition-all duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className={`px-4 pb-4 pt-1 space-y-2 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>
            {isOpen &&
              group.formats.map((format) => (
                <FormatCard
                  key={format.formatId}
                  format={format}
                  type={group.type}
                  onDownload={onDownload}
                  isPending={isPending}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FormatPicker (main export) ───────────────────────────────────────────────

export function FormatPicker({ formats, onDownload, isPending, openId, onOpenChange }: FormatPickerProps) {
  const groups = categorize(formats);

  if (groups.length === 0) {
    return (
      <p className="text-center py-8 text-sm text-muted-foreground">
        No downloadable formats available for this video.
      </p>
    );
  }

  // Resolve effective open id: fall back to first group if parent has no selection yet.
  const effectiveOpenId = openId ?? groups[0]?.id ?? null;

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <FormatAccordion
          key={group.id}
          group={group}
          isOpen={effectiveOpenId === group.id}
          // Clicking the already-open header keeps it open (exactly one always open).
          onToggle={() => {
            if (effectiveOpenId !== group.id) onOpenChange(group.id);
          }}
          onDownload={onDownload}
          isPending={isPending}
        />
      ))}
    </div>
  );
}
