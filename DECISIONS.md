# Decisions

Running log of the calls made building the create-case flow, in the order they
became code. See `docs/CASE_BRIEF.md` for the brief itself.

## Classification and action plan are two different things (src/caseTypes.ts)

The brief's "suggested actions" and "case type and priority" read as one idea
at first, but they behave differently and are kept as two types:

- **Classification** (`type`, `priority`, `reasoning`) is instant — derived
  locally from reservation signals already on screen, no network/async
  involved. The agent can override it before creating the case.
- **ActionPlanItem[]** is the slow part (10-20s per the brief's current-flow
  description). It's generated *after* classification is known and attaches
  to the case once it's already created — it never gates case creation.

This split is what makes the "don't block case creation on generation"
product bet coherent: the thing that's slow (action plan) is not the thing
required to create the case (classification).

## Only one case at a time (App.tsx, createdCase: Case | null)

There's exactly one `useActionPlan` slot in the app. A second concurrent case
would need its own independent action-plan tracking (a map keyed by case id)
to avoid a second draft's key silently overwriting the first case's plan —
real complexity the brief doesn't ask for (one urgent access issue, one
case). So `createdCase` is singular, not a list, and reopening the panel
after a case exists still reaches the create form again rather than getting
stuck — but clicking "Create case" a second time **replaces** `createdCase`
in App, it does not add a second one. Because `reservationId`/`caseType`/
`casePriority` reset to the same deterministic suggestion every time
(`openCasePanel()`), a replace only actually changes `id`/`createdAt`/
`title`/`description` — the action plan itself doesn't restart, since its key
is unchanged. No confirmation or guard against this exists; it's a named
scope cut, not an oversight.
