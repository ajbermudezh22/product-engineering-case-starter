import { useEffect, useRef } from "react";
import type { Case } from "../caseTypes";
import type { ActionPlanState } from "../hooks/useActionPlan";
import { ActionPlanStatus } from "./ActionPlanStatus";
import { CaseSummary } from "./CaseSummary";

type CaseDetailPanelProps = {
  record: Case;
  actionPlan: ActionPlanState;
  onClose: () => void;
};

// Read-only — no draft state, no create logic. Shares the same 420px side-
// panel slot as CreateCasePanel (App.tsx keeps the two mutually exclusive;
// the grid only has room for one), opened from the Open Cases row instead
// of the Add case button.
export function CaseDetailPanel({ record, actionPlan, onClose }: CaseDetailPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <aside className="casePanel" aria-label="Case details panel">
      <div className="casePanelHeader">
        <p className="eyebrow">Case details</p>
        <button
          ref={closeButtonRef}
          className="iconButton"
          type="button"
          onClick={onClose}
          aria-label="Close case details panel"
        >
          ×
        </button>
      </div>

      <div className="caseForm">
        <CaseSummary record={record} />

        <span className="fieldLabel">Suggested actions</span>
        <ActionPlanStatus actionPlan={actionPlan} />
      </div>
    </aside>
  );
}
