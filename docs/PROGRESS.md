# Pianora — Progress Tracker

> Source of truth for "where are we / what next". Update after every task. Plan: `docs/PLAN.md`.

## Status
- **Current phase:** P5 Progress & motivation
- **Next up:** P5.1 ProgressRepository + Dexie — migrate interim `src/stores/progress.ts` (localStorage key `pianora-progress`) behind the repository
- **Blockers:** none

## Phases & tasks
Legend: `[x]` done · `[~]` in progress · `[ ]` todo

### P1 — Foundation
- [x] P1.1 Scaffold Next.js 15 + TS + Tailwind v4 + ESLint (npm)
- [x] P1.2 Install ui-ux-pro-max skill, generate `design-system/pianora/MASTER.md`
- [x] P1.3 Tracking docs: CLAUDE.md, docs/PLAN.md, docs/PROGRESS.md
- [x] P1.4 Design tokens (light/dark, default dark) + Be Vietnam Pro font in `globals.css`
- [x] P1.5 Install deps: next-intl, zustand, dexie, zod, tone, vexflow, lucide-react, vitest
- [x] P1.6 next-intl setup: `[locale]` routing, middleware, vi/en messages, locale switcher
- [x] P1.7 App shell: sidebar/bottom nav (Home, Path, Practice, Tools, Profile), theme toggle, skip link

### P2 — Music core & instrument
- [x] P2.1 music-core: notes (midi↔name, 88-key range, white/black), intervals + tests
- [x] P2.2 music-core: scales, chords (triads/7ths, inversions), keys + tests
- [x] P2.3 Keyboard88 component (SVG, range zoom, highlight expected/correct/wrong, finger numbers, hand colors)
- [x] P2.4 Audio: Tone.js Salamander sampler (lazy), velocity, sustain pedal
- [x] P2.5 MIDI: Web MIDI adapter + computer-keyboard/mouse fallback, unified input event bus, unsupported-browser banner
- [x] P2.6 Metronome + latency calibration (settings)

### P3 — Notation & practice engine
- [x] P3.1 Score model (notes w/ time, duration, hand, finger) + scoring engine (timing windows, chord grouping) + tests
- [x] P3.2 Staff rendering with VexFlow (grand staff, cursor, note coloring)
- [x] P3.3 Falling notes canvas (opacity driven by level → fading)
- [x] P3.4 Practice player: Wait / Play-along / Performance modes, A–B loop, tempo 40–120%, hand split
- [x] P3.5 Result screen: accuracy, timing histogram, stars, weak-notes heatmap

### P4 — Lesson player & content L0–L3
- [x] P4.1 Curriculum schema (zod): Level → Unit → Lesson (theory/drill/technique/song/checkpoint)
- [x] P4.2 Lesson player shell + theory step renderer (text, keyboard demo, quiz)
- [x] P4.3 Drills: note-finding on keyboard, staff note reading, rhythm tapping
- [x] P4.4 Content Level 0 (posture, keyboard map, finger numbers, middle C)
- [x] P4.5 Content Level 1 (pulse, note values, C position RH/LH)
- [x] P4.6 Content Level 2 (treble/bass clef, landmarks, intervals)
- [x] P4.7 Content Level 3 (hands together, 3/4, dynamics) + checkpoints
- [x] P4.8 Path (skill tree) page with lock/unlock

### P5 — Progress & motivation
- [ ] P5.1 ProgressRepository + Dexie impl (lessonProgress, attempts, settings…)
- [ ] P5.2 XP, stars, streak (+freeze), daily goal
- [ ] P5.3 SRS (SM-2) for note reading / chords + daily review
- [ ] P5.4 Dashboard + stats page (charts), export/import JSON
- [ ] P5.5 Badges

### P6 — Expansion
- [ ] P6.1 Content L4–L5 · [ ] P6.2 L6–L7 · [ ] P6.3 L8–L10
- [ ] P6.4 Ear training · [ ] P6.5 Sight-reading generator · [ ] P6.6 Song library (public domain)
- [ ] P6.7 PWA (manifest, service worker, sample caching) · [ ] P6.8 UX polish vs MASTER checklist, Lighthouse

### P7 — Docs
- [ ] P7.1 docs/GUIDELINES.md · [ ] P7.2 docs/CURRICULUM.md · [ ] P7.3 docs/PRACTICE-NOTES.md

## Decisions log
- 2026-10-11 Frontend-only (Next.js), no NestJS/Postgres until accounts/sync needed. Data via `ProgressRepository` (Dexie now).
- 2026-10-11 npm instead of pnpm (not installed).
- 2026-10-11 Repo: github.com/dinhthanh11011/pianora (main). Commit + push after each completed phase.
- 2026-10-11 Design: ui-ux-pro-max output adapted — fonts Be Vietnam Pro (Vietnamese diacritics; Righteous/Poppins lack them); primary indigo instead of red because red/green are reserved for wrong/correct note feedback; amber kept as accent (XP/streak). Dark default. See MASTER.md "Pianora overrides".

- 2026-10-11 Lesson progress kept in an interim Zustand/localStorage store (`stores/progress.ts`) so the path can lock/unlock before P5.1; unlock order is linear across the whole curriculum.

## Session log
- 2026-10-11 S1: plan approved; P1 done (build OK); P2.1–P2.2 music-core + 9 tests passing.
- 2026-10-11 S1: P2 done — Keyboard88 (SVG, glissando, velocity by y), Tone.js sampler w/ local Salamander samples (public/samples, CC-BY), input bus (Web MIDI + computer keyboard A-row/Z-X octave/Space pedal + pointer), stores (input, settings persisted), Metronome + latency calibration on /tools, free play + chord detection on /practice. 10 tests, build + lint clean, verified in Chrome (vi/en, 375 & 1440).

- 2026-10-11 S2: P3.1 — `music-core/score.ts` (Score in beats → `toTimeline` ms w/ tempo/hand/A–B, `groupChords` 80ms) + `scoring.ts` (windows 50/120/250, `TimingMatcher` real-time, `WaitCursor`, `summarize` → accuracy/timing/score/stars/offsets/velocity evenness/byNote, `toScoreTime` subtracts latency). 19 tests, tsc + lint clean.
- 2026-10-11 S2: P3 done — `notation.ts` (measures/rests/ties → VexFlow tokens), `StaffView` (VexFlow lazy, grand staff, cursor, status colors, scales down <640px), `FallingNotes` canvas (shared `keyLayout` with Keyboard88), `usePracticeSession` (Wait/Play-along/Performance, count-in via audio-clock `scheduleClicks`, A–B loop, tempo 40–120%, hand split auto-plays other hand), `ResultPanel` (stars, histogram, rushing/dragging, weak-note heatmap via Keyboard88 `tints`). 3 demo pieces in `src/content/scores`. Practice page = tabs (pieces / free play). 21 tests, build + lint clean; verified in Chrome (wait + play-along scored as scripted, light/dark, 375px).
- 2026-10-11 S3: P4 done — zod curriculum schema (Level→Unit→Lesson→Step: theory/quiz/findNote/readNote/rhythm/play), content L0–L3 (29 lessons, checkpoints per level), LessonPlayer (`/lesson/[id]`, gated steps, stars/XP), drills (find key incl. all-octaves timed, staff reading, rhythm tapping via TimingMatcher), PathView with lock/unlock. `music-core/drills.ts` + curriculum tests, vitest alias config. 30 tests, build + lint clean; verified in Chrome.

## Key files map (for fast resume)
- Input pipeline: `src/lib/midi/bus.ts` → `src/hooks/usePianoInput.ts` (sound + store) · sources: `webmidi.ts`, `computerKeyboard.ts`, `pointerHandlers`
- Audio: `src/lib/audio/{tone,piano,metronome}.ts` (Tone lazily imported)
- UI: `src/components/piano/{Keyboard88,LivePiano,MidiStatus}.tsx`, `src/components/tools/*`, shell `src/components/shell/*`
- Theory: `src/lib/music-core/*` (index re-exports all) · practice: `score.ts`, `scoring.ts`, `notation.ts`
- Practice UI: `src/components/practice/{PracticeRoom,PracticePlayer,FallingNotes,ResultPanel}.tsx` · engine hook `src/hooks/usePracticeSession.ts` · staff `src/components/notation/StaffView.tsx`
- Curriculum: `src/content/curriculum/{schema,index,level0-3,songs,build}.ts` · lesson UI `src/components/lesson/*` (LessonPlayer, PathView, drills) · progress `src/stores/progress.ts`
