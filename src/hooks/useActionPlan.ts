import { useEffect, useRef, useState } from "react";
import { generateActionPlan } from "../api/nexusMock";
import type { ActionPlanItem, CasePriority, CaseType } from "../caseTypes";

export type ActionPlanState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; items: ActionPlanItem[] }
  | { status: "error" };

type Params = {
  reservationId: string;
  caseType: CaseType;
  casePriority: CasePriority;
  // Generic on purpose — this hook doesn't know about panels or cases, only
  // "should a request be in flight right now." The caller decides what that
  // means (see App.tsx).
  enabled: boolean;
};

// Only applied when caseType/casePriority change while already enabled — the
// request that fires on enabling (panel open) goes out immediately, since
// starting as early as possible is the whole point of the eager-generation bet.
const CHANGE_DEBOUNCE_MS = 400;

export function useActionPlan({ reservationId, caseType, casePriority, enabled }: Params): ActionPlanState {
  const [state, setState] = useState<ActionPlanState>({ status: "idle" });

  // Holds the previous request's key so we can tell "the classification
  // actually changed" apart from "this is just another render of the same
  // key." Reset to null whenever disabled, so the next enable always fires
  // immediately rather than depending on whether the key happens to match
  // what it was before.
  const previousKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      previousKeyRef.current = null;
      setState({ status: "idle" });
      return;
    }

    const key = `${reservationId}:${caseType}:${casePriority}`;
    const isChange = previousKeyRef.current !== null && previousKeyRef.current !== key;
    previousKeyRef.current = key;

    const controller = new AbortController();
    setState({ status: "loading" });

    const timer = setTimeout(
      () => {
        generateActionPlan({ reservationId, caseType, priority: casePriority }, controller.signal)
          .then((items) => {
            // Without this guard, a request superseded by a newer one (a
            // fast pill click before the previous request finished) could
            // still resolve after it and silently overwrite fresher state.
            if (!controller.signal.aborted) {
              setState({ status: "ready", items });
            }
          })
          .catch((error: unknown) => {
            // Aborted requests reject by design — the superseding effect run
            // owns state now, this one has nothing left to report.
            if (error instanceof DOMException && error.name === "AbortError") {
              return;
            }
            // A real failure, not a cancellation: surface it instead of
            // leaving the UI on "Generating…" forever.
            console.error("Action plan generation failed", error);
            setState({ status: "error" });
          });
      },
      isChange ? CHANGE_DEBOUNCE_MS : 0
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // Note on StrictMode: this hook now lives in App, which mounts once for
    // the whole session — so the classic StrictMode double-invoke only ever
    // hits this effect at enabled=false (harmless, see the early return
    // above), not at every panel open. Panel opens are ordinary dependency-
    // triggered re-runs, not remounts, so they're not double-invoked at all.
    // previousKeyRef still guards real double-fires (e.g. a fast double
    // click), just no longer against StrictMode specifically.
  }, [enabled, reservationId, caseType, casePriority]);

  return state;
}
