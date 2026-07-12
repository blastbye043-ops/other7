# Dockerfile for the YTOUDown API server.
#
# Build context MUST be the monorepo root, since the service depends on
# workspace packages (packages/db, packages/api-zod). On Render, leave
# "Root Directory" blank and set "Dockerfile Path" to ./backend/Dockerfile.
#
# The image bundles ffmpeg and a standalone yt-dlp binary — neither is
# available on Render's native Node runtime, which is why Docker is required.

FROM node:22-slim AS base

# ffmpeg: required to mux/re-encode downloaded audio+video streams.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
  && rm -rf /var/lib/apt/lists/*

# Standalone yt-dlp binary — pulled fresh on every build to stay current with
# YouTube's anti-bot changes. Checksum verified against yt-dlp's published
# SHA2-256SUMS so a corrupted/tampered download fails the build.
RUN set -eux; \
    cd /tmp; \
    curl -fsSL -o yt-dlp_linux https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux; \
    curl -fsSL -o SHA2-256SUMS https://github.com/yt-dlp/yt-dlp/releases/latest/download/SHA2-256SUMS; \
    grep -E '  yt-dlp_linux$' SHA2-256SUMS | sha256sum -c -; \
    install -m 0755 yt-dlp_linux /usr/local/bin/yt-dlp; \
    rm -f yt-dlp_linux SHA2-256SUMS

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

RUN useradd --system --create-home --uid 1001 appuser

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV PORT=8080

EXPOSE 8080

USER appuser

CMD ["node", "--enable-source-maps", "backend/dist/index.mjs"]
