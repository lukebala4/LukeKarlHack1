# LukeKarlHack1
LukeKarlHack1
==================================================
AVAILABLE API ACCESS AND INTEGRATION REQUIREMENT
================================================

The Cursor project already contains valid API credentials with available credits for:

* Unify
* Zero
* Scaile

These APIs are available for use in the implementation.

Before building mock providers, inspect the existing repository, environment variables, installed packages, configuration files and any existing integration code to determine:

* Which API credentials are already configured
* The exact environment-variable names
* Which SDKs or API clients are installed
* Which functionality each provider supports
* Whether existing code already uses any of these providers
* The available rate limits, credit constraints and response formats

Use the real APIs wherever their documented functionality supports the workflow.

Do not default to mock data when a functioning provider integration is available.

Never:

* Print API keys in the terminal output
* Expose API keys in client-side code
* Commit credentials to Git
* Add credentials directly into source files
* Display secrets in the dashboard
* Invent endpoints, parameters or provider capabilities

All API requests involving private credentials must run server-side.

Use environment variables and create an `.env.example` containing variable names only, never real values.

==================================================
PROVIDER RESPONSIBILITIES
=========================

Use Unify, Zero and Scaile together as a coordinated GTM stack.

Do not force each provider to perform tasks it is not designed to perform.

Inspect the real documentation, available tools and existing API access, then assign each provider to the parts of the workflow it handles best.

Potential responsibilities include:

* ICP account discovery
* Founder and executive discovery
* Company filtering
* Contact enrichment
* Email discovery and verification
* Social-profile discovery
* Intent and trigger-signal detection
* Website and public-content research
* Recent-post identification
* Newsletter identification
* Audience and network analysis
* Prospect prioritisation
* Personalisation research
* Outreach-sequence preparation
* Campaign or audience creation
* Lead syncing
* Response or engagement tracking
* CRM-style pipeline management

The final implementation should use the strongest available provider for each task rather than relying on a single platform for the entire process.

Where two providers return overlapping information:

* Compare the results
* Prefer verified or directly sourced data
* Record which provider supplied each data point
* Use cross-provider agreement to increase confidence
* Do not silently overwrite conflicting values
* Flag material conflicts for human review

==================================================
HOLISTIC DISCOVERY WORKFLOW
===========================

Build a holistic workflow using the available APIs.

The preferred pipeline is:

1. Discover relevant AI-native and B2B startup accounts.
2. Identify founders and founder-creators at those companies.
3. Enrich their professional and contact information.
4. Find their LinkedIn, X, newsletter, website, podcast and event presence.
5. Collect current trigger events such as:

   * Recent funding
   * Product launches
   * Senior hiring
   * Partnerships
   * Market expansion
   * Upcoming speaking appearances
   * Recent posts about AI, writing, communication, productivity, taste or authenticity
6. Analyse mission-alignment evidence.
7. Estimate high-stakes email usage.
8. Evaluate network and distribution potential.
9. Calculate the Lightfern Champion Score.
10. Recommend the best communication channel.
11. Produce a human-reviewable personalisation brief.
12. Add approved prospects to an outreach-ready pipeline.

The system should produce one unified prospect record even when the underlying data comes from several providers.

==================================================
API-FIRST PROVIDER ARCHITECTURE
===============================

Create a modular provider architecture, but implement the real integrations available in the Cursor environment.

Suggested interfaces:

interface AccountDiscoveryProvider {
searchAccounts(criteria: AccountSearchCriteria): Promise<Company[]>
}

interface PeopleDiscoveryProvider {
findPeopleAtCompany(
company: Company,
criteria: PeopleSearchCriteria
): Promise<RawProspect[]>
}

interface EnrichmentProvider {
enrichProspect(prospect: RawProspect): Promise<ProspectEnrichment>
}

interface IntentSignalProvider {
findSignals(
prospect: Prospect,
company: Company
): Promise<IntentSignal[]>
}

interface ContentResearchProvider {
findRelevantContent(prospect: Prospect): Promise<ContentEvidence[]>
}

interface ContactProvider {
findContactRoutes(prospect: Prospect): Promise<ContactRoute[]>
}

interface OutreachProvider {
createOutreachReadyProspect(
prospect: ScoredProspect
): Promise<OutreachRecord>
}

Create provider adapters based on the APIs actually available, such as:

* UnifyProvider
* ZeroProvider
* ScaileProvider
* CsvProvider
* ManualEntryProvider

Do not assume in advance which provider performs each task.

Inspect each API and map capabilities based on evidence from its actual documentation or existing integration.

==================================================
OUTREACH CAPABILITIES
=====================

Although this stage focuses primarily on finding and scoring the ICP, use the available APIs to make the output fully outreach-ready.

For each approved prospect, prepare:

* Verified contact details where available
* Best primary channel
* Best secondary channel
* Recommended outreach timing
* Relevant trigger event
* Personalisation evidence
* Recommended value proposition
* Suggested call to action
* Warm-introduction path where available
* Campaign or sequence destination
* Provider-specific identifiers required for later outreach

Where Unify, Zero or Scaile supports campaign creation, audience creation, lead syncing or outreach workflows, integrate that capability.

However:

* Do not automatically send messages during prospect discovery
* Do not enrol prospects into a live campaign without explicit user approval
* Keep all sending functionality disabled by default
* Require a clear human approval action before activation
* Clearly distinguish “outreach ready” from “outreach sent”

The dashboard may include actions such as:

* Approve for outreach
* Add to audience
* Add to draft sequence
* Sync to provider
* Export to CSV
* Reject
* Research further

Any live-send action must be separate and clearly labelled.

==================================================
CREDIT AND RATE-LIMIT MANAGEMENT
================================

Because the APIs have finite credits, implement a cost-conscious enrichment strategy.

Do not use every provider on every prospect automatically.

Use progressive enrichment:

Stage 1: Low-cost discovery

* Identify potentially relevant companies and founders
* Apply basic role, company and geography filters

Stage 2: Initial qualification

* Remove obvious low-fit prospects
* Calculate a preliminary fit score

Stage 3: Deeper enrichment

* Use paid enrichment only for prospects that pass the initial threshold

Stage 4: Content and mission research

* Perform deeper research only for likely Tier A or Tier B prospects

Stage 5: Contact enrichment

* Find or verify contact details only for prospects likely to enter active outreach

Suggested preliminary threshold:

* Continue paid enrichment when preliminary score is at least 50 out of 100

Make this threshold configurable.

Track:

* Provider used
* API operation
* Timestamp
* Success or failure
* Credits consumed where exposed by the provider
* Estimated cost where available
* Cache status
* Retry count

Cache successful enrichment results to avoid unnecessary repeated API calls.

Create retry logic with exponential backoff for temporary failures, while avoiding uncontrolled retry loops.

==================================================
DATA PROVENANCE
===============

Every material data point should retain its source.

Example:

{
"field": "work_email",
"value": "[founder@company.com](mailto:founder@company.com)",
"provider": "provider_name",
"sourceType": "api_enrichment",
"verified": true,
"confidence": 0.94,
"retrievedAt": "ISO timestamp"
}

Evidence used in the Champion Score must show:

* Provider or source
* Source URL where available
* Whether it was observed or inferred
* Confidence
* Retrieval date
* The scoring rule affected

The user must be able to inspect why a person received a particular score.

==================================================
REAL INTEGRATION REQUIREMENT
============================

The hackathon prototype should demonstrate a genuinely working end-to-end flow using the supplied API access.

At minimum, the completed implementation should demonstrate:

1. Real company or prospect discovery through at least one available API.
2. Real prospect enrichment through at least one available API.
3. Real intent, content or personalisation research where supported.
4. A unified prospect record.
5. An explainable Champion Score.
6. A channel recommendation.
7. An outreach-ready approved-prospect workflow.
8. Syncing or export into an available outreach system where supported.

Use mocks only where:

* The provider does not support the required function
* API documentation is unavailable
* The endpoint is inaccessible
* Credits or permissions prevent the operation

Any mocked functionality must be clearly labelled in the interface and README.

==================================================
INTEGRATION VALIDATION
======================

For every real provider integration:

* Validate credentials securely
* Test one minimal request first
* Confirm the response schema
* Add runtime validation using Zod
* Handle missing fields
* Handle authentication failures
* Handle credit exhaustion
* Handle rate limits
* Handle malformed responses
* Log safe diagnostic information without exposing secrets

Add a provider-status page or panel showing:

* Connected
* Authentication failed
* Credit or quota unavailable
* Rate limited
* Not configured
* Last successful request
* Supported workflow functions

Do not expose secret values.

==================================================
UPDATED EXECUTION PROCESS
=========================

Follow this order:

Step 1:
Inspect the entire repository and identify all existing Unify, Zero and Scaile credentials, integrations, SDKs and environment variables.

Step 2:
Research or inspect the available API documentation and create a capability matrix showing which provider will handle:

* Company discovery
* People discovery
* Enrichment
* Contact verification
* Intent signals
* Content research
* Personalisation
* Outreach preparation
* Campaign or audience syncing
* Engagement tracking

Step 3:
Test the smallest safe API request for each configured provider.

Step 4:
Design the unified data model and provider adapters.

Step 5:
Implement the end-to-end discovery, enrichment, scoring and approval workflow.

Step 6:
Integrate outreach-ready syncing where the APIs support it, but keep live sending disabled by default.

Step 7:
Run tests, type checking and linting.

Step 8:
Provide a completion report containing:

* How each API was used
* Which functions are live
* Which functions remain mocked
* How API credits are protected
* How prospects are scored
* How approved prospects reach the outreach-ready pipeline
* What would be required to enable live outreach safely

The objective is not merely to display sample leads.

The objective is to use the available Unify, Zero and Scaile API access to build the most complete, evidence-based and operational Lightfern champion-acquisition system possible within the hackathon.
