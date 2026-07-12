export function formatFilesize(bytes: number | null | undefined): string {
  if (bytes == null) return "Unknown";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatViews(views: number | null | undefined): string {
  if (views == null) return "0";
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return views.toString();
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Unknown date";
  if (dateString.length === 8) {
    // YYYYMMDD format from youtube
    const y = dateString.substring(0, 4);
    const m = dateString.substring(4, 6);
    const d = dateString.substring(6, 8);
    return new Date(`${y}-${m}-${d}`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  try {
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateString;
  }
}
