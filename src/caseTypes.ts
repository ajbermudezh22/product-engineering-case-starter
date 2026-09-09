// Two distinct outputs come out of the create-case flow, deliberately kept as
// separate types instead of one "suggestion" blob — see DECISIONS.md.

export type CaseType = "access_issue" | "general_issue";

export type CasePriority = "urgent" | "high" | "medium" | "low";

// Instant, derived locally from reservation signals. Editable by the agent —
// the case is created with whatever type/priority is on screen at submit time,
// not necessarily this suggestion.
export type Classification = {
  type: CaseType;
  priority: CasePriority;
  reasoning: string[];
};

// Slow (10-20s), generated after the case type/priority are known. Attaches to
// an already-created case rather than gating its creation.
export type ActionPlanItem = {
  id: string;
  label: string;
};

export type Case = {
  id: string;
  reservationId: string;
  title: string;
  description: string;
  type: CaseType;
  priority: CasePriority;
  createdAt: string;
};
