import fs from "fs";
import path from "path";
import { logger } from "./logger";

// Configurable via env vars so storage pressure can be tuned per-deployment
// without a code change. Defaults keep disk usage low: files expire after
// 30 minutes and the sweep runs every 10 minutes.
const FILE_MAX_AGE_MS = Number(process.env.DOWNLOAD_FILE_TTL_MS) || 30 * 60 * 1000; // 30 minutes
const JOB_MAX_AGE_MS = Number(process.env.DOWNLOAD_JOB_TTL_MS) || 60 * 60 * 1000; // 1 hour
const INTERVAL_MS = Number(process.env.CLEANUP_INTERVAL_MS) || 10 * 60 * 1000; // run every 10 minutes

export function startCleanupScheduler(
  downloadsDir: string,
  jobs: Map<string, { status: string; createdAt: string }>,
) {
  const run = () => {
    purgeOldFiles(downloadsDir);
    purgeOldJobs(jobs);
  };

  run();
  const timer = setInterval(run, INTERVAL_MS);
  timer.unref();
}

function purgeOldFiles(downloadsDir: string) {
  if (!fs.existsSync(downloadsDir)) return;

  let removed = 0;
  let errors = 0;
  const now = Date.now();

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(downloadsDir, { withFileTypes: true });
  } catch (err) {
    logger.error({ err }, "cleanup: failed to read downloads directory");
    return;
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(downloadsDir, entry.name);
    try {
      const stat = fs.statSync(filePath);
      const ageMs = now - stat.mtimeMs;
      if (ageMs > FILE_MAX_AGE_MS) {
        fs.unlinkSync(filePath);
        removed++;
      }
    } catch (err) {
      logger.warn({ err, file: entry.name }, "cleanup: failed to remove file");
      errors++;
    }
  }

  if (removed > 0 || errors > 0) {
    logger.info({ removed, errors }, "cleanup: purged old download files");
  }
}

function purgeOldJobs(jobs: Map<string, { status: string; createdAt: string }>) {
  const now = Date.now();
  let removed = 0;

  for (const [jobId, job] of jobs) {
    if (job.status !== "done" && job.status !== "failed") continue;
    const ageMs = now - new Date(job.createdAt).getTime();
    if (ageMs > JOB_MAX_AGE_MS) {
      jobs.delete(jobId);
      removed++;
    }
  }

  if (removed > 0) {
    logger.info({ removed }, "cleanup: evicted stale job entries");
  }
}
