---
name: yt-dlp on server IPs
description: YouTube blocks yt-dlp's default player clients from datacenter/server IPs; how to work around it without cookies or PO tokens.
---

YouTube (as of 2025-2026) increasingly blocks yt-dlp's default web/embedded
player clients when requests come from datacenter/server IPs (e.g. Replit,
Render, most cloud hosts). Symptoms: `nsig extraction failed`, "not available
on this app", "No video formats found!", or "Requested format is not
available" — even for popular, non-restricted videos.

**Fix that worked without cookies or a PO token:** force
`--extractor-args "youtube:player_client=android"` on every yt-dlp
invocation. The `web,mweb` client combination (an earlier attempt) made
things *worse* — those clients require a PO (Proof of Origin) token in 2025+
that isn't available without browser automation.

**Why:** The Android client's request signing doesn't hit the same PO-token
requirement as the web clients, so it still works from plain server IPs.

**How to apply:** Any yt-dlp-backed video/audio fetcher running server-side
should default to the Android client first, and only fall back to other
clients if Android also fails. Re-test periodically — YouTube changes this
frequently, so a client that works today may need revisiting in a few months.
