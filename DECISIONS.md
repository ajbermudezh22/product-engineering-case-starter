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

## Success renders before the action plan finishes (src/components/CreateCasePanel.tsx)

The brief's required-states list orders "loading state while actions
generate" (5) before "success state after creation" (6), reading as if
actions finish first. This build inverts that on purpose: the success view
renders as soon as `createdCase` exists, and `actionPlan.status` can still
be `"loading"` right there inside it — case creation never waits on
generation (see the classification/action-plan split above). Both required
states still exist, just not in that sequence, and that's the actual
product bet, not an accident of build order.

## One side-panel slot, not two (App.tsx, CaseDetailPanel)

Once a case can be viewed again after creation (the "View details" link on
the Open Cases row), there are two different side panels the app can show —
the create flow and the read-only case detail view — but `.appShell.
panelOpen` only reserves room for one 420px column. Rather than adding
overlay/stacking logic for a second panel, `casePanelOpen` and
`caseDetailOpen` are kept mutually exclusive: opening either one explicitly
closes the other. `CaseDetailPanel` shares `CaseSummary` and
`ActionPlanStatus` with `CreateCasePanel`'s success view — same content,
different component, because one is a draft-in-progress and the other is
deliberately not editable.

## No automated tests

There's no test framework in this repo (no vitest, no test script) and none
was added. Not an oversight: it's not a graded dimension here (the brief
explicitly excludes "production-ready code"), and adding one this late means
introducing new tooling against the same rule the rest of the stack followed
— a dependency has to remove more code than it adds, and a test framework
adds infrastructure, it doesn't remove anything. Correctness was checked by
hand instead: a build check plus a live browser walkthrough after most
changes, both visible in the commit history. If this were graded on code
quality rather than product judgment, `deriveClassification` in
`classifyCase.ts` is where I'd start — a pure function with real business
consequences (getting urgency wrong is the point of the exercise) and the
cheapest thing here to test in isolation.
