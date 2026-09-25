# Hyperframes Composition Brief: FENAC COOP — Individual Sign-Up (Web + Mobile)

## Objective
Create a short, narrated, launch-style brag video showing that individuals can sign up for FENAC COOP
on the web app and in the mobile app — the same three-step journey on both surfaces.

## Output
- Composition directory: `brag-output-2026-09-24-234549/composition/`
- Rendered video: `brag-output-2026-09-24-234549/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 25 seconds (5 scenes: 6/5/5/5/4)

## Source Material
- Project root: `/Users/creativemexy/Downloads/coop`
- Primary files read: `web/src/pages/auth/Register.tsx` (real web registration UI/copy),
  `mobile/src/screens/auth/RegisterScreen.tsx` (real mobile registration UI/copy),
  `mobile/src/ui/theme.ts`, `mob.md` (design bible — warm palette replacing cold-blue),
  `web/src/pages/register/PayRegistrationFee.tsx` (fee step), `mobile/src/navigation/AppNavigator.tsx`
- Product name: FENAC COOP
- Tagline / strongest claim: "Building Wealth Together." / "A Digital Smart Cooperative"
- Key UI to recreate: the dark warm Register card (web) and the cream "co-op premium" register screen (mobile)
- Copy that must appear verbatim:
  - "A Digital Smart Cooperative"
  - "Join your cooperative community"
  - "Choose your apex organization" / "Choose your member organization"
  - "Create Account"
  - Steps: Organization / Selection / Your Details
  - "Building Wealth Together."

## Creative Direction
- Tone preset: `cinematic`
- Creative direction: "co-op premium launch cut — membership, anywhere" (narrated, short)
- Interpretation: trailer-scale type and motion, 5 scenes ~5s, short declarative VO lines, restrained cin hits
- Angle: membership is now self-service — 3 steps on web or mobile, one account anywhere
- Hook: emblem ignites, "Membership, in minutes.", web + mobile silhouettes appear
- Outro / punchline: full-screen FENAC COOP wordmark on the strongest beat (22.93s), "Building Wealth Together."
- Avoid: generic SaaS language, pure abstract filler, unrelated redesigns

## Visual Identity
- Background: #140C09
- Text: #FFF9EF (primary), #A99683 / #6B5B4D (muted)
- Accent: #E4A42A / #F8CE68 gold; secondary anchor #176B5B green
- Display font: Avenir Next (headers, 800 caps); body: Avenir Next / system sans
- Visual references: real Register.tsx card structure + warm design-bible mobile screens

## Storyboard
Use `brag-output-2026-09-24-234549/brag-plan.md` as the creative contract.

Scene summary:
1. Emblem / Hook — 6s — FENAC COOP emblem ignite + headline "Membership, in minutes." + web/mobile chips
2. Web sign-up — 5s — actual web register card, cursor picks apex + member org, details typed, "Create Account"
3. Mobile sign-up — 5s — cream phone app, bottom-sheet pickers, details + password strength, "Register"
4. One account anywhere — 5s — web + phone converge with sync arc, ₦5,000 fee chip, green "Member" badge
5. Wordmark outro — 4s — FENAC COOP slam, divider, "Building Wealth Together.", "Become a member today"

## Audio
- Audio role: cinematic support bed under 5-line narration
- Audio arc: open warm → tight procedural mid → resolve into the big payoff
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: 25s bed, baseline ~0.38, duck under VO via carve, no intro fade, settle at end
- Music cue guidance: bundled preset beside the track. Strong cues in-window: 8.74, 10.93, 13.11, 15.84,
  17.47, 18.56, 19.66, 22.37, 22.93 (1.0), 23.46, 24.56. Beat grid ≈0.55s.
- Audio-reactive treatment: subtle — ambient glow + device presence breathe with RMS/bass (frames from
  `assets/music/audio-data.js`). No waveform/equalizer visuals.
- Audio-coupled moments:
  - S1 emblem reveal — beat 0.56 soft hit; device chips sequence 3.82/4.39
  - S2 web selects — clicks, per-char keypress ticks; "Account created" chip beat-locked 10.93
  - S3 mobile taps — clicks at ~13.11, sheet slide, success tick beat 15.84
  - S4 convergence — wood hit 17.47, sync arc 18.56, fee chip 19.66 (chip-lay), member badge drop
  - S5 wordmark — impactBell_heavy_000 beat-locked 22.93, tagline tick 23.46
- SFX selection guidance: match motion; sparse cinematic. Choose exact files from the copied `assets/sfx/`.
- Exact SFX choice: Hyperframes chooses among `assets/sfx/{impact,interface,casino,ui,keyboard}/` copied below.
- Audio files: music + cues + audio-data already copied into `assets/`; VO clips at `assets/voice/vo1..5.wav`
  (durations 4.01 / 3.69 / 3.75 / 4.18 / 1.92)

## Voiceover
Narrated (user confirmed short narrated cut). 5 lines:
1. "Joining your cooperative now takes minutes — on the web, or on your phone." @1.2
2. "On the web, choose your organization, add your details, and you're in." @6.6
3. "On mobile, the exact same three steps live right in the FENAC app." @11.6
4. "Start in your browser. Finish on your phone. One account, everywhere you go." @16.6
5. "FENAC COOP — building wealth together." @21.4
Voice track group "voiceover"; music ducks under it (carve).

## Hyperframes Instructions
Reuse the validated conventions from the sibling run `brag-output-2026-09-23-200205/composition/`
(scene sub-compositions registering `window.__timelines["scene-N"]`, GSAP from CDN, master timeline in
index.html, ambient glow + grain + vignette overlays). Files already staged in `assets/`.

Requirements:
- Show real UI from `Register.tsx` (web) and the design-bible mobile register screen (rescored copy: apex org
  "Federal Employees Alliance", member org "Civil Service Credit Union" from backend seeds)
- Keep all text readable; honor the reading-time floor for each ~5s scene (~2-4 short reads)
- Keep total at 25s
- Include music + VO + sparse cinematic SFX
- Provide audio-reactive subtle treatment (ambient glow breathing) — audio-data extracts already present
- Beat-lock: wordmark slam → 22.93 (±0.15s), success chip → 10.93; sequence small events to beats (±0.10s)
- Use curled quotes in VO text blocks if displaying lines
- Run `npx hyperframes check` (single gate) then `hyperframes render` for delivery