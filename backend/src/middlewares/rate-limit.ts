import rateLimit from "express-rate-limit";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const jsonHandler = (_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }, _next: unknown, options: { statusCode: number }) => {
  res.status(options.statusCode).json({
    error: "Too many requests. Please wait a few minutes before trying again.",
  });
};

export const globalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler,
});

export const infoLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler,
  message: undefined,
});

export const downloadLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: jsonHandler,
  message: undefined,
});
