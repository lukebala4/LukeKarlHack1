# 🌿 Lightfern Champion Engine

> Built for the **GTM Hackathon London** (Cursor × GTMengineer.dev × Lightfern) — Lightfern Main Track.

An evidence-based GTM system that finds **champions, not just users** for Lightfern: AI-native B2B SaaS GTM/commercial operators who are **high-reach _and_ mission-aligned**, scores them on transparent evidence, and pushes outreach-ready leads **live into Zero (CRM) + Unify (records)**.

The thesis is reflexive: Lightfern is about **taste, distinct voice, and resisting AI slop** — so the outreach this engine produces is itself a demonstration of the product. *Outbound-as-craft: the proof is the message.*

---

## What it does

```
Discover (curated ICP) → Score (2-axis, explainable) → Gate (cost-conscious)
   → Enrich → Personalize (outreach-as-craft) → Approve → Sync (Zero + Unify)
```

- **Champion Quadrant scoring** — two axes, *Reach* (network effect) and *Mission* (taste alignment), plus an *Email-volume* modifier. A champion must be strong on **both** (the score is biased toward the weaker axis), so megaphones-without-taste and writers-without-audience are filtered out. See [scoring](#scoring).
- **Explainability** — every point traces to a piece of evidence (signal, detail, source, confidence). Click any card to see *why*.
- **Provenance** — every material field records its provider, source type, observed-vs-inferred, confidence, and timestamp.
- **Cost-conscious progressive enrichment** — cheap discovery first; paid enrichment only above `ENRICH_MIN_SCORE`; a cost/credit ledger tracks every provider call.
- **Outreach-ready, not outreach-sent** — sync creates a CRM deal + synced lead. **No messages are sent.** Live send is a separate, deliberate action.
- **Inbound (Scaile)** — an AI-search query map + content briefs your ICP types into ChatGPT/Claude, ready to feed Scaile.

## Provider capability matrix (verified against the live APIs)

| Capability | Provider | Status |
|---|---|---|
| CRM pipeline: companies / contacts / deals | **Zero** | ✅ read + write (write needs `x-workspace-id` header) |
| People/company records | **Unify** | ✅ read + write (`/objects/*/records`) |
| Intent signals (visitor activity → company/person) | **Unify** | ✅ read (`/events/query-jobs`) |
| External account/people **discovery** | — | ⚠️ neither Unify nor Zero exposes web discovery via API → curated/CSV ICP layer (`lib/seed.ts`), clearly labelled |
| Contact/email **enrichment** | — | ⚠️ not exposed via Zero/Unify REST → email is **pattern-inferred** (provenance `pattern_inference`, `verified:false`) |
| Inbound AI-search visibility / content | **Scaile** | ⚠️ API host unreachable from server (`app.scaile.to` serves SPA only); inbound artifacts generated locally, pasted into the Scaile dashboard |

> Honest by design: where a provider can't do something, it's a labelled fallback — not silently faked.

## Scoring

Two axes (each normalized to 100) combined with a champion bias:

```
balanced = min(reach, mission)            # must be high on BOTH
core     = balanced*0.70 + avg*0.30
total    = clamp(core + (email-50)*0.12)  # email volume = ±6 modifier

Tier A (champion): total >= 70 AND balanced >= 55
Tier B: >= 55   Tier C: >= 38   Tier D: below (dropped at enrichment gate)
```

Full rule weights live in `lib/scoring.ts`. Reach signals: audience size (log-scaled), VC/accelerator, thought leader, AI educator, community, speaking. Mission signals: taste/AI-slop discourse, newsletter, distinct voice, AI-stack posts, high-stakes-comms role.

## Architecture

```
app/
  page.tsx              # review dashboard (quadrant, scored cards, evidence, approve/sync)
  api/
    status/             # live provider status (read/write capability probe)
    pipeline/           # run discovery -> scoring -> personalization
    sync/               # POST {prospectId, targets} -> write to Zero + Unify
    scaile/             # inbound query map + content briefs (+ article API when reachable)
    export/             # CSV of all scored prospects
lib/
  env.ts                # server-only secret loader
  types.ts              # unified model + Zod schemas (provenance, evidence, score)
  scoring.ts            # explainable Champion Score engine
  seed.ts               # curated ICP discovery layer (swap for live feed)
  pipeline.ts           # orchestration + progressive enrichment + cost ledger
  sync.ts               # outreach-ready sync (no send)
  providers/
    zero.ts             # Zero CRM client (read + write)
    unify.ts            # Unify Data API client (read + write + intent)
    scaile.ts           # Scaile client + inbound strategy artifacts
```

## Security

- All secrets are server-side only (`server-only` import guard); **no key ever reaches the client**.
- `.env` is git-ignored; `.env.example` ships variable **names only**.
- Every provider call runs in an API route, never in a client component.

## Setup

```bash
cp .env.example .env      # then fill in keys
npm install
npm run dev               # http://localhost:3000
```

Required env: `UNIFY_API_KEY`, `ZERO_API_KEY`, `ZERO_WORKSPACE_ID`, `SCAILE_API_KEY` (+ `SCAILE_API_BASE` once you have the real backend host). Optional: `ANTHROPIC_API_KEY` (richer personalization; rule-based fallback otherwise).

## Tech partners used

- **Unify** — outbound infrastructure / records + intent (read + write).
- **Zero** — the only CRM; champion pipeline (read + write).
- **Scaile** — inbound / AI-search visibility (query map + content briefs).
- **Cursor** — built with it.
