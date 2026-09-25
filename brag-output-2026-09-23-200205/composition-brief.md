# Hyperframes Composition Brief: FENAC COOP — 60s cinematic cut

## Objective

Produce a ~64s, budget-priced-as-premium launch film for FENAC COOP. Trailer-scale cinematic direction, warm cocoa/gold/ivory palette, the user-supplied transparent logo as the brand mark, and the mobile app's real functions (Savings, BNPL, Loans, Investments, KYC) demonstrated on iOS + Android handsets. Narrated per scene; music ducks under voice.

## Output

- Composition directory: `brag-output-2026-09-23-200205/composition/`
- Rendered video: `brag-output-2026-09-23-200205/brag.mp4`
- Format: landscape — 1920x1080
- Duration: ~64 seconds (scene durations: 6/6/7/9/6/8/8/8/6 = 64)

## Source Material

- Project root: `/Users/creativemexy/Downloads/coop`
- Primary files read: `web/src/pages/landing/Home.tsx`, `web/src/pages/individual/Dashboard.tsx`, `mob.md`, `mobile/src/navigation/AppNavigator.tsx`
- Product name: FENAC COOP
- Tagline / claims: `Building Wealth Together.` (parent), `Every contribution moves us forward.`, savings pool `₦2.4B`, `10,000+ members`, `35+ cooperatives`
- Logo: user-provided `assets/img/logo.png` (604x413, transparent PNG) — brand mark for Scene 1 and Scene 9
- Key UI moments to recreate: dark cocoa hero; ivory member dashboard with Savings Pool card; native iOS + Android app screens (warm surface, green balance card) showing Savings, BNPL, Loans, Investments

## Creative Direction

- Tone preset: cinematic
- Creative direction: "$500k-budget" trailer — expensive, dramatic, restrained
- Interpretation: slow push-ins, scale crossfades, grain + vignette, one idea per scene, giant editorial type, gold light sweeps at chapter changes
- Angle: a bank that belongs to its members, shown at blockbuster scale
- Hook: cold-open logo ignition with light sweep
- Outro: logo + wordmark + tagline + URL, final bell on strong cue 62.19
- Avoid: generic SaaS language, abstract filler, flat web-page layouts, over-busy SFX

## Visual Identity

- Background: cocoa `#140C09` (deep) / `#20120E`; ivory workspace `#FFF9EF` / `#FBF3E6`
- Surface/border: warm browns `#2E1C14`, `#452A20`; borders `#E7DCCB`; overlay strokes `#E4A42A`
- Text: `#FFF9EF` and `#23150F`; muted `#E5D7C7`, `#D6C5B3`
- Accent: gold `#E4A42A` / `#F8CE68` / `#FBD67D`; green `#176B5B` / `#0F5A4B`; success `#68D391`
- Fonts: Avenir Next (fallback Segoe UI / Helvetica Neue / system stack)
- Global post: film grain + vignette overlays; gold light-sweep wipes between chapters

## Storyboard

Follow `brag-plan.md` (9 scenes, 64s).

1. Logo open — 6.0s —`0.0–6.0`
2. The collective, in scale — 6.0s — `6.0–12.0`
3. Join in minutes — 7.0s — `12.0–19.0`
4. One warm dashboard — 9.0s — `19.0–28.0`
5. The app arrives — 6.0s — `28.0–34.0`
6. App: Savings & BNPL — 8.0s — `34.0–42.0`
7. App: Loans & Investments — 8.0s — `42.0–50.0`
8. Built for the member — 8.0s — `50.0–58.0`
9. FENAC COOP — 6.0s — `58.0–64.0`

## Audio

- Audio role: cinematic support under a sparse dramatic voice
- Audio arc: slow ignition → rising proof → satisfying payoff → app features → calm conviction → resolution
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (109.96 BPM, 117.4s)
- Music treatment: 0.34 volume, fade-in 0→0.34 by 1.5s, duck to 0.14 under each voice clip (recover between lines), swell under final bell, fade out 61→64
- Voice: 9 per-scene clips `assets/voice/vo1-9.wav` (Kokoro `af_heart`); starts: vo1@1.2, vo2@6.8, vo3@12.6, vo4@19.5, vo5@28.6, vo6@34.5, vo7@42.6, vo8@50.4, vo9@58.6 (flex to probed durations)
- Music cue guidance: preset `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`. Strong cues: 8.74/9.29/10.93 (stat counters), 22.93/23.46/24.02/24.56 (dashboard cards, pool 22.93), 36.55/37.64/38.73/39.82 (savings+BNPL steps), 44.74/46.37/48.55 (loans+investments), 50.74/51.29/51.83 (proof pillars), 54.57 (stats strip), 62.19 (final bell). Sequential snaps use the 0.56→69.83 beat grid within ±0.10s.
- Audio-reactive: subtle RMS + low-band breath on ambient glow and card presence; no waveform/strobe
- SFX: prefer low-HF-risk per `sfx-analysis.md`; warm impacts, card slides, a single CTA click, success bells/chimes; match timings to visual landings
- Audio files: local, under `composition/assets/`

## Hyperframes Instructions

Create a deterministic, self-contained Hyperframes composition (structure per `hyperframes-core`; motion per `hyperframes-animation`; beats/audio-reactive per `hyperframes-creative`; mixing per `hyperframes-audio`). Features:

- `index.html` with: bgm (automation ducking envelope), 9 voice tracks, SFX layer, ambient-glow audio-reactive driver reading `assetss/music/audio-data.js` frames (map `rms` + bands[0..2] as bass), 9 scene divs.
- 9 scene sub-compositions, each: full-bleed, grain+ vignette, slow push-in, dry entrance at scale 1.04→1.0, exit fade; beat-locked majors marked `// beat-locked`, sequential items marked `// beat-grid`.
- Scene 1 and 9 use the logo PNG with a soft gold halo behind it (dark floor; moderate size ~420px tall max).
- App scenes use handset shells (iOS rounded + Android) with warm cream screens, green balance cards, gold accents — consistent with `mob.md`.
- Keep text settle holds: headline ≥1.2s, labels ≥0.8s fully visible.
- Run `npx hyperframes check` until zero errors; fix contrast/lint findings, then render.