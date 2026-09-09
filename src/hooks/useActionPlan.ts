import { useEffect, useRef, useState } from "react";
import { generateActionPlan } from "../api/nexusMock";
import type { ActionPlanItem, CasePriority, CaseType } from "../caseTypes";

type ActionPlanState = { status: "loading" } | { status: "ready"; items: ActionPlanItem[] };

type Params = {
  reservationId: string;
  caseType: CaseType;
  casePriority: CasePriority;
};

// Only applied when caseType/casePriority change after the first request —
// the first request (panel open) fires immediately, since starting as early
// as possible is the whole point of the eager-generation bet.
const CHANGE_DEBOUNCE_MS = 400;

export function useActionPlan({ reservationId, caseType, casePriority }: Params): ActionPlanState {
  const [state, setState] = useState<ActionPlanState>({ status: "loading" });

  // Holds the previous request's key so we can tell "the classification
  // actually changed" apart from "this is just another render of the same
  // key" (e.g. React 18 StrictMode invoking this effect twice on mount).
  // Comparing keys instead of a boolean isFirstRun ref matters: StrictMode's
  // extra invocation happens with the *same* key, so it correctly reads as
  // "not a change" both times, instead of a bare first-run flag which would
  // flip to false on the throwaway invocation and wrongly debounce the real
  // mount that follows it.
  const previousKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${reservationId}:${caseType}:${casePriority}`;
    const isChange = previousKeyRef.current !== null && previousKeyRef.current !== key;
    previousKeyRef.current = key;

    const controller = new AbortController();
    setState({ status: "loading" });

    const timer = setTimeout(
      () => {
        generateActionPlan({ reservationId, caseType, priority: casePriority }, controller.signal)
          .then((items) => {
            // Without this guard, a request that was superseded (StrictMode's
            // double-invoke, or a fast pill click before the previous request
            // finished) could still resolve after the newer one and silently
            // overwrite fresher state with stale data.
            if (!controller.signal.aborted) {
              setState({ status: "ready", items });
            }
          })
          .catch(() => {
            // Aborted requests reject by design; the superseding effect run
            // owns state now, nothing to do here.
          });
      },
      isChange ? CHANGE_DEBOUNCE_MS : 0
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [reservationId, caseType, casePriority]);

  return state;
}
