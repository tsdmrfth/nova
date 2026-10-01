# Nova · Art Direction LOCK (user final — 2026-09-17)

**Status:** LOCKED by user. All prior mock iterations deleted.  
**Canonical reference image:** `/workspace/nova/design/reference/FINAL-HOME.png`

Do not revive amber-first, cozy-cottage, greenery/solarpunk, or fintech-form mock styles.

---

## 1. Visual thesis

Optimistic corporate-futurism / high-tech economy game on Arc. Full-bleed cinematic city at golden hour + translucent navy HUD + electric blue glow. Feels like a premium narrative strategy game, not a pitch deck and not a bank app.

## 2. Color theme (locked)

| Role | Direction | Notes |
|------|-----------|--------|
| **Primary accent** | Electric / Circle–USDC blue family (`#2775CA` → brighter glow ~`#3B8EF0` / cyan neon on CTAs) | Cast Influence, chips, cores, selected states |
| **UI surfaces** | Deep navy / cobalt translucent panels | Glass-like dark panels, thin luminous borders |
| **Text** | Crisp white (+ soft cool gray secondary) | High readability on navy |
| **World light** | Warm sunset gold / soft orange haze | City windows, rim light on Nova — multi-tone, not flat blue wash |
| **Neutrals** | White / silver robot armor, black joints, reflective dark platform | |
| **Rejected** | Amber-as-primary, purple neon crypto void, single flat blue fill, lush greens | |

Token rename guidance for `DESIGN-SYSTEM.md`: migrate `--color-accent` from amber to the blue family above; keep warm gold only as **environment / lighting**, not CTA.

## 3. World / environment (locked)

- Futuristic coastal / archipelago city: glass towers, arches, highways over water, reflective metal ground.
- **No plants, trees, grass, gardens, terraces of greenery.**
- Sunset sky + city lights OK; holographic / light-trail network accents OK.
- In-world Arc landmark energy OK as fiction; **production must not ship official Circle / Arc / USDC logo marks or “partnered with Circle Architects” claims** — plain text “USDC” / “on Arc” + disclaimer still apply.

## 4. Nova character (locked)

- Medium full-body humanoid robot (~⅕–¼ screen), not orb-only, not giant hero fill.
- Glossy white armor, black mechanical joints, circular glowing **blue** chest core (+ joint glow accents).
- Face signature: **horizontal pixel sunglasses / LED visor** (game-polished cool shades — not meme sticker caption, not angry X-grid eyes).
- Tone: Circle-universe adjacent futuristic product mascot — refined, slightly playful via visor.

## 5. UI / game feel (locked)

- Floating HUD over full-bleed scene (Day, Free Influence, Extra Influence, USDC chip).
- Large readable hero line (“Design today’s economy”) + short subline.
- **Three illustrated choice tiles** (A/B/C) with mini scene art — not identical white form rows.
- Primary CTA: large glowing blue **Cast Influence**.
- Architect rank is **in-game title only** (e.g. Architect Apprentice).
- Soft glass panels OK if they still read as game HUD, not slideware.

## 6. Still true (product / legal / anti-slop)

- Free / Extra Influence separate; Buy numbers per `BUY-INFLUENCE-UX.md`.
- No guaranteed-return / APR language.
- Anti-slop: no purple neon void, chrome orbs rain, Midjourney sludge as default, Inter-only bland SaaS.
- Client stack preference unchanged: Vite + React + TS + Pixi.

## 7. File policy

| Keep | Delete / do not regenerate as “current” |
|------|------------------------------------------|
| `reference/FINAL-HOME.png` | All prior `mocks/**` PNGs (wiped 2026-09-17) |
| This lock doc + updated design system | Cozy / amber / greenery experiments |

New screens (Vote, Results, Buy, …) must match this lock + the reference image.

---

## 8. Approved production references (2026-09-17 G1 start)

| File | Role | Gate |
|------|------|------|
| `reference/FINAL-HOME.png` | User-final look lock (full HUD mock) | G0 |
| `reference/nova-character-sheet.png` | Turnaround + visor + core + color chips | G1 draft |
| `reference/scene-home-sunset-city-textless.png` | Textless Home master plate | G2 draft |
| `reference/nova-idle-stand-3q.png` | P0 pose `nova_idle_stand_3q` | P0 draft |

