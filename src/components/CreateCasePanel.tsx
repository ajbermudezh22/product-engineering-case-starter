import { useState } from "react";
import type { ReservationContext } from "../mockData";
import type { CasePriority, CaseType, Classification } from "../caseTypes";

type CreateCasePanelProps = {
  open: boolean;
  reservation: ReservationContext;
  classification: Classification;
  caseType: CaseType;
  casePriority: CasePriority;
  onCaseTypeChange: (type: CaseType) => void;
  onCasePriorityChange: (priority: CasePriority) => void;
  onClose: () => void;
};

const CASE_TYPE_OPTIONS: { value: CaseType; label: string }[] = [
  { value: "access_issue", label: "Access issue" },
  { value: "general_issue", label: "General issue" },
];

const PRIORITY_OPTIONS: { value: CasePriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function CreateCasePanel({
  open,
  reservation,
  classification,
  caseType,
  casePriority,
  onCaseTypeChange,
  onCasePriorityChange,
  onClose,
}: CreateCasePanelProps) {
  const [title, setTitle] = useState(() => `Access issue — ${reservation.listingName}`);
  const [description, setDescription] = useState(() => reservation.latestGuestMessage);
  const [accessCodeRevealed, setAccessCodeRevealed] = useState(false);

  if (!open) {
    return null;
  }

  return (
    <aside className="casePanel" aria-label="Create case panel">
      <div className="casePanelHeader">
        <div>
          <p className="eyebrow">Create case</p>
          <h2>{reservation.guestName}</h2>
        </div>
        <button className="iconButton" type="button" onClick={onClose} aria-label="Close create case panel">
          ×
        </button>
      </div>

      <div className="caseForm">
        <label className="fieldLabel" htmlFor="caseTitle">
          Title
        </label>
        <input
          id="caseTitle"
          className="textInput"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <label className="fieldLabel" htmlFor="caseDescription">
          Description
        </label>
        <textarea
          id="caseDescription"
          className="textArea"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <span className="fieldLabel">Case type</span>
        <div className="choiceRow" role="radiogroup" aria-label="Case type">
          {CASE_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={caseType === option.value}
              className={caseType === option.value ? "choicePill choicePillActive" : "choicePill"}
              onClick={() => onCaseTypeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <span className="fieldLabel">Priority</span>
        <div className="choiceRow" role="radiogroup" aria-label="Priority">
          {PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={casePriority === option.value}
              className={casePriority === option.value ? "choicePill choicePillActive" : "choicePill"}
              onClick={() => onCasePriorityChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="suggestionNote">
          <p className="suggestionNoteTitle">Why we suggest this</p>
          <ul>
            {classification.reasoning.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <span className="fieldLabel">Access code</span>
        <div className="accessCodeRow">
          <code className="accessCodeValue">{accessCodeRevealed ? reservation.accessCode : "••••"}</code>
          <button
            type="button"
            className="linkButton"
            onClick={() => setAccessCodeRevealed((revealed) => !revealed)}
          >
            {accessCodeRevealed ? "Hide" : "Reveal"}
          </button>
        </div>
        <p className="accessCodeHint">Masked by default. Never written into the title or description.</p>
      </div>
    </aside>
  );
}
