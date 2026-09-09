import type { ActionPlanItem, CasePriority, CaseType } from "../caseTypes";

type ActionPlanRequest = {
  reservationId: string;
  caseType: CaseType;
  priority: CasePriority;
};

// Sits inside the brief's stated 10-20s range for "system generates suggested
// actions." Swap this function's body for a real call later — callers
// (useActionPlan) don't need to change, only this file does.
const DEFAULT_ACTION_PLAN_DELAY_MS = 14000;

// The real 14s is the honest default — this isn't a way to pretend the
// latency doesn't exist, it's a visible override for a live demo. Append
// ?actionPlanDelayMs=2000 to the dev URL to shorten it for a session.
function resolveActionPlanDelayMs(): number {
  if (typeof window === "undefined") {
    return DEFAULT_ACTION_PLAN_DELAY_MS;
  }
  const raw = new URLSearchParams(window.location.search).get("actionPlanDelayMs");
  if (raw === null) {
    // Number(null) is 0, not NaN — without this check, no query param at
    // all would silently mean a 0ms default instead of the real 14s.
    return DEFAULT_ACTION_PLAN_DELAY_MS;
  }
  const override = Number(raw);
  return Number.isFinite(override) && override >= 0 ? override : DEFAULT_ACTION_PLAN_DELAY_MS;
}

const ACTION_PLAN_DELAY_MS = resolveActionPlanDelayMs();

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
