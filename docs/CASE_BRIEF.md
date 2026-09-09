# Arbio Product Engineering Case — Part 1 Brief

Source: Arbio's case document (Notion), Part 1 only. Kept here verbatim-in-substance so
the requirements, assumptions, and constraints stay attached to the repo instead of
living only in chat/Notion. Part 2 (agent system design) is tracked separately.

## Context for the whole case

- Two parts plus an optional bonus. Part 1 is a hands-on build (this doc). Part 2 is a
  design/systems-thinking exercise. Budget ~3 hours total, then a live working session
  with Mohsen (Arbio product engineer) to walk through it.
- Terminology: **"this case"** = the exercise itself. **"a case in Nexus"** = a support
  ticket Arbio's ops team creates — that's the subject of Part 1.
- **What's graded:** product judgment, how I think about agents, how I scope a useful
  first version, and how I use AI tools while staying in control.
- **What's not graded:** perfect visual polish (it should still never be *unfriendly*)
  or production-ready code. Arbio runs on an 80/20 principle day to day.
- **Live session:** run as a brainstorm/discussion, not a one-way demo. Expect pushback,
  new angles, and mid-conversation redirects. Every shipped line — generated or
  hand-written — needs to be defendable. Code ownership matters.
- **Tools:** any setup/AI tools I normally use are fine.

## Submission logistics

- Push to a GitHub repo Arbio can open — private (invite **`mohsen89z`**) or a public
  fork, either is fine. A fork of a public repo can't be made private on GitHub, so a
  public fork is an accepted option, not a workaround.
- Include docs/sketches/notes made along the way, and the Part 2 Excalidraw link in the
  README.
- Email the repo link to **louise@arbio.com** by **10am Berlin time** the day of the
  session.

**Decision made:** working in a public fork
(`github.com/ajbermudezh22/product-engineering-case-starter`) rather than a private repo
— satisfies the "repo Arbio can open" requirement with no invite step, and public is
explicitly sanctioned by the brief.

## Part 1: Create Case Flow

### Goal

Improve one realistic product interaction in the starter repo: the `Create case` flow,
for an **urgent access issue**, from an ops agent's reservation page. Judged on product
judgment, interaction clarity, scoping, and AI-tool usage — not visual polish.

### Tested / not tested

Tests: product judgment, interaction design/UX taste, scoping a useful first version,
AI-tool usage while staying in control, communication and tradeoff reasoning.

Does **not** test: memorized algorithms, framework setup speed, perfect visual fidelity,
full backend implementation, production-ready persistence.

### The problem

Arbio is building **Nexus**, an internal ops platform for guest support, reservations,
and property workflows. Ops agents work from a reservation page; when they spot a
problem they need to create a case. Today the flow is too manual and pulls them out of
the context they were just in.

**Task:** improve the `Create case` interaction so an ops agent can create an urgent
access case quickly while keeping the relevant reservation context available.

### Current flow (today, before improvement)

1. Agent leaves the current reservation/unit context.
2. Agent opens a separate case-creation flow.
3. Agent enters title and description manually.
4. Agent selects/confirms basic case information.
5. Agent links the case to a reservation or property.
6. System generates suggested actions — **takes ~10–20 seconds**.
7. Agent reviews the suggested actions.
8. Case is created and opens on a case detail page.

**Known pain points:** too many clicks, lost context, unclear waiting state, and
repeated manual entry for information already known from the reservation.

### Exercise assumptions

- The human agent is on a reservation detail page.
- The guest message is already linked to this reservation.
- The starter repo already contains the relevant mock context.
- I am improving the interaction for an **urgent access issue** specifically.
- Anything not directly part of the interaction can be mocked.

### Safety note (constraint, not flavor text)

Access information is sensitive. The prototype should help the agent act quickly, but
must **not casually expose access codes or sensitive details**.

### Required first slice — states the prototype must show

1. Reservation context is visible (as in the wireframe) or recoverable.
2. Create-case surface opens from the `Add case` button.
3. Title and description are useful and can be prefilled from context.
4. Case type and priority are suggested or easy to select.
5. Loading state appears while suggested actions are generated.
6. Success state appears after the case is created.

Pattern is my choice — side panel, modal, split view, inline flow, or other — but I need
to be able to explain why, and its drawbacks.

### What not to build

Real backend calls, authentication, real smart-lock lookups, real task-generation logic,
exact Arbio design-system fidelity (taste still matters), production persistence, or any
Slack/Booking.com/Airbnb/Typeform integrations. Mock whatever's needed.

**Escape hatch:** if setup or styling blocks me for more than 5 minutes, drop to the
simplest possible path (plain component / static mock / single HTML file). The exercise
evaluates product reasoning and interaction judgment, not setup debugging. (Not needed
here — the starter installed cleanly.)

### Deliverable

1. Repo link (public fork or private + `mohsen89z` invited).
2. Short README with:
   1. How to run or open it.
   2. What I built.
   3. What tradeoffs I made.
   4. What I'd improve with 2 more hours.
   5. What would be needed before shipping this in production.

**Bar for a strong result:** coherent, makes the ops agent faster, keeps context
available, and shows clear ownership of product and implementation decisions.

## Repo notes (my own, from reading the starter)

- Stack: Vite + React + TypeScript, plain CSS (no Tailwind), no router, no backend, no
  test setup.
- Work centers on two files: `src/components/CreateCasePanel.tsx` (currently a static
  placeholder — this is the real deliverable) and `src/App.tsx` (reservation page shell,
  owns `casePanelOpen` state, can be touched but doesn't need a rebuild).
- `src/mockData.ts` is the only context source: guest Sarah Keller, message "The door
  code does not work and I am standing outside," smart lock at 18% battery, backup
  keybox available, and a note that a similar issue was reported for this listing 3 days
  ago. No access code is included in the mock data — consistent with the safety note.
