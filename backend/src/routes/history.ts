import { Router, type IRouter } from "express";
import { db, downloadsTable } from "@workspace/db";
import { desc, count, sql, eq } from "drizzle-orm";
import { GetHistoryQueryParams, DeleteHistoryItemParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/history", async (req, res) => {
  if (!db) {
    res.status(503).json({ error: "Download history is not available — no database is configured." });
    return;
  }

  try {
    const parsed = GetHistoryQueryParams.safeParse(req.query);
    const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
    const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(downloadsTable)
        .orderBy(desc(downloadsTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(downloadsTable),
    ]);

    const total = totalResult[0]?.count ?? 0;

    res.json({
      items: items.map((item: typeof items[number]) => ({
        id: item.id,
        url: item.url,
        title: item.title,
        thumbnail: item.thumbnail,
        format: item.format,
        filesize: item.filesize,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch history");
    res.status(500).json({ error: "Failed to retrieve download history" });
  }
});

router.delete("/history/:id", async (req, res) => {
  if (!db) {
    res.status(503).json({ error: "Download history is not available — no database is configured." });
    return;
  }

  try {
    const parsed = DeleteHistoryItemParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const result = await db
      .delete(downloadsTable)
      .where(eq(downloadsTable.id, parsed.data.id))
      .returning();

    if (result.length === 0) {
      res.status(404).json({ error: "History item not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete history item");
    res.status(500).json({ error: "Failed to delete history item" });
  }
});

router.get("/history/stats", async (req, res) => {
  if (!db) {
    res.status(503).json({ error: "Download history is not available — no database is configured." });
    return;
  }

  try {
    const [totals, formatCounts] = await Promise.all([
      db
        .select({
          totalDownloads: count(),
          successfulDownloads: sql<number>`count(*) filter (where ${downloadsTable.status} = 'done')`,
          totalSizeBytes: sql<number>`coalesce(sum(${downloadsTable.filesize}), 0)`,
        })
        .from(downloadsTable),
      db
        .select({
          format: downloadsTable.ext,
          count: count(),
        })
        .from(downloadsTable)
        .groupBy(downloadsTable.ext)
        .orderBy(desc(count()))
        .limit(5),
    ]);

    const row = totals[0];
    res.json({
      totalDownloads: Number(row?.totalDownloads ?? 0),
      successfulDownloads: Number(row?.successfulDownloads ?? 0),
      totalSizeBytes: Number(row?.totalSizeBytes ?? 0),
      popularFormats: formatCounts.map((f: typeof formatCounts[number]) => ({
        format: f.format,
        count: Number(f.count),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch history stats");
    res.status(500).json({ error: "Failed to retrieve download stats" });
  }
});

export default router;
