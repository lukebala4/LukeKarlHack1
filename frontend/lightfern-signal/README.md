# Lightfern Signal — Stage 2

Lightfern Signal is a research-led GTM operating system that connects founder discovery to evidence-backed outreach, product adoption, referral, and champion progression.

## Architecture and ownership

This repository was created as an isolated Stage 2 implementation because no Lightfern repository or Stage 1 worktree was present in the supplied workspace on June 20, 2026. It does not contain or recreate company discovery, founder discovery, enrichment, Champion scoring, or Stage 1 provider clients.

Stage 2 owns:

- `app/control-room`, `app/outreach`, and `app/api/outreach`
- `components/control-room` and `components/visualisations`
- `src/outreach`, `src/job-events`, `src/repositories`, and `src/contracts/outreach.ts`
- the landing, Control Room, Activate workspace, benchmark, Five-Email Test, pipeline, analytics, approval and sync experiences

Stage 1 plugs in through `ApprovedProspectRepository` in `src/contracts/outreach.ts`. UI code never imports a Stage 1 table or mock fixture directly as its persistence boundary.

## Shared approved-prospect contract

`ApprovedProspect` carries identity, company context, Champion and confidence scores, six category scores, public profiles, verified contacts, evidence, triggers, personalisation brief, warm routes, provider IDs, restrictions, and approval status.

Every personalised claim stores an `evidenceId`. The quality gate rejects a draft when a claim does not point to a permitted Stage 1 evidence record.

## Repository adapters

`MockApprovedProspectRepository` is active in `src/repositories/approved-prospects.ts`. It supplies six deterministic, clearly labelled demo prospects.

`DatabaseApprovedProspectRepository` implements the same interface. To switch after Stage 1 lands:

1. Import the project database client in `src/repositories/approved-prospects.ts`.
2. Map Stage 1 records to the `ApprovedProspect` contract without dropping evidence IDs.
3. Replace the exported `approvedProspects` instance with `new DatabaseApprovedProspectRepository(db)`.
4. Update the `Stage1DatabaseClient` query names only if Claude’s final model names differ.
5. Run `npm test`, `npm run typecheck`, and `npm run build`.

No UI logic needs to change.

## Event stream

Pipeline events use the contract in `src/contracts/outreach.ts` and are stored by job in `src/job-events/event-store.ts`. `GET /api/outreach/jobs/:jobId/events` returns stored events using Server-Sent Events.

The current demo animation is deterministic client-side state and every row is labelled `DEMO`; it is not described as production provider streaming. Real mode should append events only after completed provider/backend operations, then stream those stored events through the same endpoint.

## Provider responsibility map

The current UI uses a conservative responsibility map pending access to real provider API documentation and credentials:

- Unify: company/audience sourcing and sequence destination
- Zero: contact records, relationships, workflow/reply state, provider sync
- Scaile: search themes and public evidence discovery

This is an explicit integration hypothesis, not a claim about enabled account capabilities. Provider credentials remain server-side. `POST /api/outreach/sync` validates payloads and prevents duplicate syncs with an idempotency key. The route is a demo-safe adapter and does not call external providers.

## Running

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

- Demo mode: select **Run Demo** or **Run Signal**. The fixed run cannot fail during judging and is always labelled `Demo Run`.
- Real mode: connect the database adapter, replace demo event production with completed backend operations, and implement provider clients behind one orchestration service. Until then, the header shows real mode as idle and does not invent activity.

## Human approval and claims

Nothing sends automatically. The outreach workspace exposes research, generated email, and claims ledger together. Approval remains disabled unless:

- at least one specific personalised claim exists;
- every claim points to permitted evidence;
- the email includes a natural Lightfern connection and low-friction CTA;
- the draft is not reusable by changing only the founder name/company.

After approval, the user explicitly chooses provider sync. The UI records approver and timestamp in demo state. Production should persist the original draft, final draft, actor, timestamp, changes, destination, and provider result.

Social posts are research inputs only. The system does not generate LinkedIn or X direct messages.

## Adding an outreach play

1. Extend `OutreachPlay` in `src/contracts/outreach.ts`.
2. Add deterministic ranking logic to `selectOutreachPlay` in `src/outreach/engine.ts`.
3. Add tests proving priority, eligibility, fallback, and channel safety.
4. Add play-specific asset generation behind the same evidence and approval gates.

Only one recommended play is active at a time.

## Routes

- `/` — concise landing experience
- `/control-room` — two-engine live pipeline
- `/outreach` — readiness, play, email builder, claims and approval
- `/signal/founder/[secure-token]` — private benchmark and Five-Email Test
- `/api/outreach/prospects` — active approved-prospect repository
- `/api/outreach/jobs/[jobId]/events` — persisted SSE event replay
- `/api/outreach/sync` — validated, idempotent demo sync

Pipeline and Analytics are top-level views inside the product shell.

## Known limitations

- No Stage 1 repository, schema, environment variables, or provider clients were available to inspect.
- Provider operations, trial events, referral, and champion completion are simulated and labelled.
- The event store and sync idempotency set are process-memory implementations; production needs durable database tables.
- Secure founder tokens are route-shaped but not cryptographically issued or checked in this standalone build.
- No outbound email is sent.
- Real Lightfern usage instrumentation is not connected.

## Merge steps after Stage 1

1. Create or check out `feat/stage2-codex` in the real repository.
2. Copy the Stage 2-owned paths listed above.
3. Merge `app/globals.css` tokens selectively into the existing design system instead of overwriting it.
4. Add package dependencies only if absent: `framer-motion`, `lucide-react`, `zod`, and test packages.
5. Map Claude’s final approved-prospect model in `DatabaseApprovedProspectRepository`.
6. Add durable `Outreach`, `PipelineEvent`, `ApprovalAudit`, `ProviderSync`, `BenchmarkPage`, and `FiveEmailTest` models in a coordinated Prisma migration; do not edit Stage 1 models.
7. Replace process-memory event/sync stores with database repositories.
8. Connect verified provider capabilities through one server-side orchestration layer.
9. Configure environment validation and secrets without exposing them to the browser.
10. Run tests, type checking, linting, and the production build.

Potential conflicts are limited to `package.json`, the root layout, global CSS, and any route ownership that Stage 1 independently created. No Prisma schema or Stage 1 contract was modified here.
