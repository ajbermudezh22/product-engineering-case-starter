import { caseTypeLabel, formatCreatedAt, isHighUrgency, priorityLabel } from "../caseTypes";
import type { Case } from "../caseTypes";

type CaseSummaryProps = {
  record: Case;
};

// Shared by CreateCasePanel's success view and CaseDetailPanel — both show
// the same facts about a created case. Second real use case, not built
// ahead of one.
export function CaseSummary({ record }: CaseSummaryProps) {
  return (
    <>
      <div className="titleRow">
        <h2>{record.title}</h2>
        <span className="pill success">{caseTypeLabel(record.type)}</span>
        <span className={isHighUrgency(record.priority) ? "pill danger" : "pill success"}>
          {priorityLabel(record.priority)}
        </span>
      </div>
      <p className="metaLine">Created {formatCreatedAt(record.createdAt)}</p>
      <p>{record.description}</p>
    </>
  );
}
