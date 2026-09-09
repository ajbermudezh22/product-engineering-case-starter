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

// Moved here from CreateCasePanel.tsx once the Open Cases card became a
// second consumer of the same labels/pills — one real use case each, not
// speculative sharing.
export const CASE_TYPE_OPTIONS: { value: CaseType; label: string }[] = [
  { value: "access_issue", label: "Access issue" },
  { value: "general_issue", label: "General issue" },
];

export const PRIORITY_OPTIONS: { value: CasePriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function caseTypeLabel(type: CaseType): string {
  return CASE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function priorityLabel(priority: CasePriority): string {
  return PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? priority;
}

export function isHighUrgency(priority: CasePriority): boolean {
  return priority === "urgent" || priority === "high";
}

export function formatCreatedAt(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
