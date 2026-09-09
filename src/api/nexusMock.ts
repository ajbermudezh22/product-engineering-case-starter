import type { ActionPlanItem, CasePriority, CaseType } from "../caseTypes";

type ActionPlanRequest = {
  reservationId: string;
  caseType: CaseType;
  priority: CasePriority;
};

// Sits inside the brief's stated 10-20s range for "system generates suggested
// actions." Swap this function's body for a real call later — callers
// (useActionPlan) don't need to change, only this file does.
const ACTION_PLAN_DELAY_MS = 14000;

function buildActionPlan({ caseType, priority }: ActionPlanRequest): ActionPlanItem[] {
  const items: ActionPlanItem[] = [];

  if (caseType === "access_issue") {
    items.push({ id: "send-backup-code", label: "Send the guest the backup keybox code" });
    items.push({ id: "notify-ops-lead", label: "Notify the on-call ops lead" });
  } else {
    items.push({ id: "acknowledge-guest", label: "Send the guest an acknowledgement message" });
  }

  if (priority === "urgent" || priority === "high") {
    items.push({ id: "flag-followup", label: "Flag for a follow-up call within 15 minutes" });
  }

  return items;
}

export function generateActionPlan(
  request: ActionPlanRequest,
  signal: AbortSignal
): Promise<ActionPlanItem[]> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(() => resolve(buildActionPlan(request)), ACTION_PLAN_DELAY_MS);

    // Real cancellation, not just an ignored param: an aborted request clears
    // its own timer instead of running to completion in the background.
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}
