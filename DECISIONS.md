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
