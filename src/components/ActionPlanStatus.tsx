import type { ActionPlanState } from "../hooks/useActionPlan";

type ActionPlanStatusProps = {
  actionPlan: ActionPlanState;
};

// Extracted once a third consumer needed it (CaseDetailPanel), after the
// form and success views inside CreateCasePanel already shared it.
export function ActionPlanStatus({ actionPlan }: ActionPlanStatusProps) {
  // idle and loading render the same on purpose, not an unhandled case: idle
  // only ever lasts one render — App re-renders with enabled=true a render
  // before its effect flips state to loading, regardless of what feeds
  // `enabled`, so this holds for casePanelOpen, createdCase !== null, or both.
  if (actionPlan.status === "idle" || actionPlan.status === "loading") {
    return (
      <>
        <p className="actionPlanStatus">Generating suggested actions…</p>
        {/* Skeleton rows, not just the status line: a single sentence in a
            420px column leaves most of the panel blank for the real ~14s
            delay, which reads as "nothing is happening" rather than "the
            case is already done, this part is extra." aria-hidden since the
            status line above already says the same thing to a screen reader. */}
        <ul className="actionPlanList actionPlanSkeleton" aria-hidden="true">
          <li className="skeletonRow" />
          <li className="skeletonRow skeletonRowShort" />
          <li className="skeletonRow skeletonRowShorter" />
        </ul>
      </>
    );
  }
  if (actionPlan.status === "error") {
    return <p className="actionPlanStatus">Couldn't generate suggested actions.</p>;
  }
  return (
    <ul className="actionPlanList">
      {actionPlan.items.map((item) => (
        <li key={item.id}>{item.label}</li>
      ))}
    </ul>
  );
}
