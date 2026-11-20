# Blueprint Academy (`sunshade-learn`)
> **Standalone Proof-of-Cultivation Progression Ledger & Citizen Digital Backpack**  
> Deployed on **Cloudflare Workers with Static Assets** and integrated with **SunShade Systems Hub SSO** (`.sunshade.icu`).

---

## 1. Architectural Overview

```
                      +---------------------------------------+
                      |         SunShade Hub SSO Gate         |
                      |      https://hub.sunshade.icu         |
                      +-------------------+-------------------+
                                          |
                        Shared Cookie (.sunshade.icu)
                                          v
                      +---------------------------------------+
                      |      Cloudflare Worker & Assets       |
                      |   (Single Origin: worker/index.ts)    |
                      +---------+-------------------+---------+
                                |                   |
                      /api/*    |                   | Static Fallback (SPA)
                                v                   v
                     +--------------------+     +-------------------+
                     | Cloudflare Worker  |     | Vite React Bundle |
                     | API Middleware     |     | (Single-Page App) |
                     +---------+----------+     +-------------------+
                               |
                   JWT Guard & Ephemeral Check
                               |
                               v
                     +--------------------+
                     | Supabase Platform  |
                     |  (learn schema)    |
                     +--------------------+
```

- **Cloudflare Exclusivity:** Configured strictly via `wrangler.jsonc` using unified **Cloudflare Workers with Static Assets** (`worker/index.ts` + `./dist`). Zero Vercel dependencies, files, or environment references.
- **SSO Ecosystem Handshake:** `@supabase/ssr` `createBrowserClient` configured with `cookieOptions: { domain: '.sunshade.icu', path: '/', sameSite: 'lax', secure: true }` (falling back to `localhost` in local dev). Authenticated users arriving from `hub.sunshade.icu` bypass authentication transparently.
- **Privacy & Zero-Exploitation Law:**
  - Zero third-party analytics pixels, trackers, or public-by-default minor profiles.
  - All learner domains default to `private`. Unlisted sharing is an explicit opt-in.
  - Ephemeral Socratic checks run in-memory and discard raw conversational transcripts immediately. Only the concise coaching attestation and SHA-256 event hash are persisted.
  - Citizen Data Sovereignty: Hard-delete endpoint (`DELETE /api/learn/ledger`) permanently erases learner records upon typing `DELETE_MY_LEDGER`.

---

## 2. Target Domain Matrix

| Tier | Domain | Purpose |
| :--- | :--- | :--- |
| **Production** | `https://learn.sunshade.icu` | Live Citizen Progression Ledger |
| **Staging** | `https://learn-stag.sunshade.icu` | Pre-flight validation (`-stag` convention) |
| **SSO Gateway** | `https://hub.sunshade.icu/login` | Centralized identity provider |
| **DB Platform** | `sunshade-db-platform` | Canonical PostgreSQL migrations (`learn` schema) |

---

## 3. The 4-Stage Cultivation Discipline

1. **🌱 Seeded:** Initial capture of an article, book, codebase, or `sunshade-docs` deep-link query (`?source=docs&slug=...&sha=...`). Begins hash chain with `prev_hash: 'GENESIS'`.
2. **📖 Studied:** Active synthesis into 3–5 plain-language bullets. Skimming is rejected by the system.
3. **🛠️ Applied:** Practical proof of execution (deployed demo URL, repository commit, design RFC, or detailed execution notes).
4. **💎 Cultivated:** Verification of mastery via:
   - **Ephemeral AI Socratic Check (`POST /api/learn/check`):** 3 conversational probes evaluated in-memory.
   - **Single-Use Peer/Mentor Sign-Off (`POST /api/learn/signoff`):** Ephemeral 7-day single-use link for mentor attestation.

---

## 4. API Endpoints (`worker/index.ts`)

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Standardized discovery `{ status: "ok", appId: "sunshade-learn", uptime }` for `hub-admin-gateway`. Detailed metrics protected by `INTERNAL_HEALTH_TOKEN`. |
| `GET` | `/api/learn/export` | JWT | Citizen Tier Digital Backpack export (`?format=json` with `verifyCultivationChain()` or `?format=markdown` for printable portfolio). |
| `DELETE` | `/api/learn/ledger` | JWT | Hard-delete all `learn.*` records for the user upon explicit confirmation (`DELETE_MY_LEDGER`). |
| `POST` | `/api/learn/check` | JWT | Ephemeral Socratic check (`action: "start"` or `action: "submit"`). In-memory evaluation with immediate raw Q&A discard. |
| `POST` | `/api/learn/signoff`| Public (Token) | Validates single-use peer/mentor token, marks used, and appends `cultivated` event. |

All responses automatically include standard SunShade security headers:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## 5. Development & Testing Commands

```powershell
# 1. Install dependencies
npm install

# 2. Run frontend Vite dev server (proxies /api to Wrangler)
npm run dev

# 3. Run full Cloudflare Worker + Static Assets simulation locally
npm run worker:dev

# 4. Execute unit & integration test suites
npm test

# 5. Typecheck & build production bundle
npm run build
```

---

## 6. Living Print Stylesheet (`@media print`)

When pressing **Print Binder** or hitting `Ctrl+P`, the application strips navigation chrome, sidebars, modals, and drawers, rendering a clean, high-contrast, physical portfolio suitable for 3-ring binder filing and academic verification.
