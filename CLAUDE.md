# Pianora — Claude working guide

Piano learning web app (PWA), "zero to hero", 88 keys, MIDI input, vi/en. **Frontend only** (Next.js 15); no backend/DB yet (see docs/PLAN.md §2.0).

## Start of every session (resume protocol)
1. Read `docs/PROGRESS.md` — current phase, next task, blockers. This is the source of truth.
2. Only open `docs/PLAN.md` / `design-system/pianora/MASTER.md` sections needed for the current task.
3. Pick the first unchecked task in the current phase; finish it fully (code + verify) before the next.
4. After each task: tick it in PROGRESS.md, update "Next up" and add a one-line log entry. Keep it short.

## Token economy (user requirement)
- Don't re-read files already read in this session; read with offset/limit or `grep` instead of whole large files.
- Don't dump `node_modules`, lockfiles, generated sample data or long build logs — pipe through `tail`/`grep`.
- Prefer small, focused edits over rewriting files. No narration of options not pursued.
- Use subagents only for genuinely parallel/broad work.

## Stack & conventions
- Next.js 15 App Router, TS strict, Tailwind v4 (tokens in `src/app/globals.css`), `npm` (no pnpm on this machine).
- i18n: `next-intl`, routes under `src/app/[locale]/`, messages in `src/i18n/messages/{vi,en}.json`. Default `vi`. Every user-facing string goes through messages.
- Music logic: pure TS in `src/lib/music-core/` with Vitest tests next to code (`*.test.ts`). No React/DOM there.
- Audio `src/lib/audio/` (Tone.js), MIDI `src/lib/midi/`, storage `src/lib/storage/` (Dexie behind `ProgressRepository`), gamification `src/lib/gamification/`.
- Curriculum content: `src/content/curriculum/` typed TS/JSON validated by zod; text fields are `{ vi, en }`.
- State: Zustand stores in `src/stores/`. Client components only where needed (`"use client"`).
- UI: follow `design-system/pianora/MASTER.md` (Pianora overrides at top win). Lucide icons, never emoji. Visible focus, reduced-motion, 44px targets.
- MIDI numbers: A0=21 … C4=60 … C8=108. Note names use scientific pitch (C4 = middle C).

## Commands
- `npm run dev` · `npm run build` · `npm run lint` · `npm test` (vitest run)
