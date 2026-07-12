---
name: Nix module install requires full env restart for PATH
description: Installing a Nix module (e.g. yt-dlp) via package management adds it to replit.nix and builds it in the store, but the running shell/workflow PATH does not pick it up until a full environment restart, not just a workflow restart.
---

Installing a system dependency via `installSystemDependencies`/module install succeeds and builds the derivation in `/nix/store`, but neither the bash tool session nor a `restart_workflow` call refreshes `PATH` to include it — `which <bin>` keeps failing even after several restarts.

**Why:** the Nix profile symlink that populates `PATH` is only rebuilt on a full container/environment restart, which isn't triggered by restarting a single workflow.

**How to apply:** if a newly installed CLI tool isn't found on PATH after installing + restarting its workflow, don't keep restarting — instead resolve the binary directly from `/nix/store/*-<pkg>-*/bin/<bin>` (glob + pick latest version) via a small shim script, and point the app at it with an env var (e.g. `YT_DLP_PATH`) rather than relying on bare `PATH` lookup. This unblocks without waiting for a full env reboot.
