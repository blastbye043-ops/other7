import { useGetHistory, useGetHistoryStats, useDeleteHistoryItem, getGetHistoryQueryKey, getGetHistoryStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/layout/seo";
import { formatFilesize, formatDate } from "@/lib/format";
import { Trash2, Download, CheckCircle, XCircle, BarChart2, HardDrive, FileVideo } from "lucide-react";
import { toast } from "sonner";

export default function HistoryPage() {
  const queryClient = useQueryClient();

  const { data: history, isLoading: historyLoading } = useGetHistory(
    { limit: 50, offset: 0 },
    { query: { queryKey: getGetHistoryQueryKey({ limit: 50, offset: 0 }) } }
  );

  const { data: stats, isLoading: statsLoading } = useGetHistoryStats({
    query: { queryKey: getGetHistoryStatsQueryKey() }
  });

  const deleteMutation = useDeleteHistoryItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetHistoryStatsQueryKey() });
        toast.success("History item deleted");
      },
      onError: () => {
        toast.error("Failed to delete history item");
      },
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  return (
    <div className="space-y-8">
      <SEO
        title="Download History"
        description="View your YouTube video download history and statistics."
        path="/history"
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Download History</h1>
        <p className="text-muted-foreground mt-1">All your past downloads in one place.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.totalDownloads ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Total Downloads</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.successfulDownloads ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Successful</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <HardDrive className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatFilesize(stats?.totalSizeBytes)}</div>
                  <div className="text-xs text-muted-foreground">Total Downloaded</div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Popular Formats */}
      {stats && stats.popularFormats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Popular Formats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.popularFormats.map((f) => (
                <div key={f.format} className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-3 py-1.5">
                  <span className="font-mono text-xs uppercase font-bold text-primary">{f.format}</span>
                  <span className="text-xs text-muted-foreground">— {f.count} {f.count === 1 ? "download" : "downloads"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History list */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Downloads</h2>
        {historyLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : !history?.items?.length ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <FileVideo className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground font-medium">No downloads yet</p>
              <p className="text-sm text-muted-foreground mt-1">Your download history will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {history.items.map((item) => (
              <Card
                key={item.id}
                data-testid={`history-item-${item.id}`}
                className="hover:bg-secondary/30 transition-colors"
              >
                <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-16 h-10 sm:w-20 sm:h-12 object-cover rounded-md flex-shrink-0 bg-secondary"
                      width="64"
                      height="40"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-16 h-10 sm:w-20 sm:h-12 bg-secondary rounded-md flex-shrink-0 flex items-center justify-center">
                      <FileVideo className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm break-words">{item.title}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                      <span className="font-mono text-xs uppercase text-muted-foreground">{item.format}</span>
                      {item.filesize && (
                        <span className="text-xs text-muted-foreground">{formatFilesize(item.filesize)}</span>
                      )}
                      <span className="text-xs text-muted-foreground hidden sm:inline">{formatDate(item.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 sm:hidden">
                      <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <Badge
                      variant={item.status === "done" ? "default" : "destructive"}
                      className="text-xs hidden sm:flex"
                    >
                      {item.status === "done" ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {item.status}
                    </Badge>
                    {/* Mobile: icon-only status indicator */}
                    <span className="sm:hidden" aria-label={item.status === "done" ? "Successful" : "Failed"}>
                      {item.status === "done"
                        ? <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
                        : <XCircle className="w-4 h-4 text-destructive" aria-hidden="true" />}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${item.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
