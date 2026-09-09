# Part 2 — Listing Optimization Agent

Design for the agent layer. Live diagram: [Excalidraw board](https://excalidraw.com/#json=wFVpSjvRmlwZiJ-H77ut0,XdZ9WevMuHs7-G2CkMjXJg) · static export: [`listing-optimization-agent.png`](listing-optimization-agent.png)

![Listing Optimization Agent diagram](listing-optimization-agent.png)

## What it does

Continuously improves a listing's price, copy and photos to lift revenue — without buying that revenue with worse reviews.

The brief's framing is that most work should be triaged and drafted by agents, with humans supervising rather than typing. So the entry point is not a person asking for an optimization. Signals trigger runs; a human only appears where a change needs judgment.

## Requirements

**Functional**

- Detect which listings are underperforming
- Produce ranked, evidence-backed recommendations
- Apply safe changes itself; route the rest to a human
- Measure whether the change actually worked

**Non-functional**

- **Safe** — never touches access codes or guest PII
- **Reversible** — every applied change has a rollback
- **Bounded** — cheap enough to sweep the portfolio nightly
- **Explainable** — every recommendation carries the evidence behind it
- **Latency is not a requirement** — this is an async job measured in minutes

That last one is load-bearing. Because nothing here is interactive, there is no streaming or real-time surface, and a whole category of complexity drops out of the design.

## Core entities

```
Unit             1--* Listing 1--* ContentVersion
Listing          1--* RatePlan | Reservation | Review
Unit             1--1 OwnerConstraint
City             1--* Signal
OptimizationRun  1--* Recommendation
Recommendation   1--0..1 Approval   1--0..1 AppliedChange
AppliedChange    1--* OutcomeMeasurement
```

## Interface

```
POST /runs { listing_id, trigger }              -> OptimizationRun
get_signals(listing_id, date_range)             -> Signal[]
price_recommendation(listing_id, range,
                     constraints)                -> RatePlanDelta
draft_content(unit, angle)                      -> ContentDraft
vision_score(images[])                          -> ImageRanking
verify_claims(draft, amenities)                 -> { ok, violations[] }
apply_change(rec_id, actor, idem_key)           -> AppliedChange
measure_outcome(change_id, window_days)         -> OutcomeMeasurement
```

`POST /runs` is the manual override and the internal API. It is not the main path — most runs originate from the scheduler or the event bus.

## The flow

**Triggers** — nightly sweep plus event-driven signals: booking pace below forecast, a calendar gap opening inside the booking window, a new review, a comp-set reprice, a local event announcement. Manual invocation exists as an override.

**Run queue** — each run is a checkpointed job. If the image step fails, the run resumes there rather than re-running everything. The idempotency key is `(listing_id, trigger_type, date)`, enforced as a database unique constraint, so a retry can never double-apply a price change.

**Context builder** — fetches signals and caches them. A cheap deterministic filter decides which listings earn a run at all; most nights, most listings don't. Demand context is cached per city-day, because every listing in Berlin shares one event calendar. These two things are the cost story.

**Strategist agent** — the only component here that plans. It reads the signals plus per-listing memory of what humans previously accepted or rejected, calls its tools, and emits typed `Recommendation` objects carrying a confidence score, a rationale, and the evidence behind them.

**Policy gate** — every proposed action passes through independently of the agent. Tool allowlist, `verify_claims()` against structured amenity data, guardrail bands, owner constraints, rate limits.

**Routing** — three tiers:

| Tier | Examples | Control |
|---|---|---|
| 1 — auto | price inside band, photo reordering, min-stay inside bounds | bounded, reversible, rate-limited |
| 2 — human approves | copy rewrites, discounts, amenity changes | approval inbox, diff view, reject-with-reason |
| 3 — refused | access codes, guest PII, delisting, copying comp content | blocked at the tool layer, logged with reason |

**Act** — versioned write to the PMS and out to channels, with a rollback token on every applied change.

**Observe** — outcome measured against hold-out listings the agent never touches, at 30, 60 and 90 days.

## Design decisions worth defending

**Only one component is actually an agent.** Comp retrieval, pricing, image scoring and copy drafting don't plan, don't loop, and don't call each other — they're single-shot calls with fixed contracts. That makes them tools. Wrapping them as agents would cost latency, tokens and traceability and buy nothing. If comp analysis later needs to plan its own retrieval, it can be promoted then.

**Safety is a layer, not a branch.** A parallel branch can't gate anything. The policy gate sits between the agent's output and any write, and the agent does not call the verifier itself — otherwise it would be marking its own homework.

**Pricing is not an LLM.** Revenue management is forecasting and constrained optimization. A deterministic model produces the number; the agent decides whether the qualitative context justifies it and explains the result in language a revenue manager can accept or reject.

**Comp data is licensed, not scraped.** Scraping competitor listings is a terms-of-service problem and brittle besides. A market data provider gives the same signal defensibly.

**Owner constraints are read before any action.** Arbio manages on behalf of owners. Some agreements carry price floors; some owners don't want their photos or copy touched. Skipping this is what turns a good agent into an incident.

## The tension in the objective

The brief asks to maximize revenue and review scores. Those pull against each other.

Raise the price and guest expectations rise with it, so the same stay earns a lower rating. Write more persuasive copy and you write cheques the flat has to cash — the gap between promise and reality gets absorbed by reviews.

Two consequences fall out of this. Every content claim must be verifiable against structured amenity data, which is what `verify_claims()` is for. And review impact only becomes visible 30 to 90 days out, which is why the eval loop is shaped the way it is.

## Evaluation

**Offline, in CI** — gold set plus LLM-as-judge on format, policy compliance, and invented claims. Runs on every prompt or model change and gates the deploy.

**Online** — hold-out listings receive no agent at all. Measure RevPAR, ADR, occupancy and review score against that control at 30/60/90 days.

**Adoption** — approval and rejection rate per recommendation type. If revenue managers reject most copy rewrites, that category loses its tier. Rejection reasons feed back into memory so the agent stops re-proposing the same rejected change, which is the failure mode that destroys trust fastest.

The honest limitation: offline evals cannot tell you a recommendation made money. Ground truth is realized revenue weeks later. Only the hold-out closes that gap.

## Failure handling

If a change goes wrong, three layers catch it. The guardrail band caps how far a price can move at all. The rate limit caps how often. And a pace monitor auto-reverts if bookings for the affected window fall sharply within a short window after a change. Every applied change carries a rollback token, so reverting is one call rather than a manual repair.

## What I'd ship first

**In:** nightly scheduled trigger only, no event bus. Comp set, demand signals and booking pace. Pricing tool and copy drafting. Approval inbox only — no auto-apply. Tracing plus the offline gold set.

**Out:** image agent, auto-apply tiers, switchback tests, auto-revert, event-driven triggers.

The reasoning on auto-apply: you can't justify a guardrail band before you have outcome data telling you what a safe band is. Auto-apply is earned after a few hundred approved recommendations show where the agent is reliable.

## Open questions

Things I'd want answered before committing to specifics:

- Portfolio size and which PMS is in use
- Whether there's already an RMS or pricing partner to call rather than build
- Real thresholds for the guardrail band, rate limit and revert trigger — I'd derive these from historical pace variance rather than pick them
- How much listing content the Booking and Airbnb APIs allow writing programmatically
