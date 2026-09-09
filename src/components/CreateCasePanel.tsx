import { useEffect, useRef, useState } from "react";
import type { ReservationContext } from "../mockData";
import type { Case, CasePriority, CaseType, Classification } from "../caseTypes";
import type { ActionPlanState } from "../hooks/useActionPlan";

type CreateCasePanelProps = {
  reservation: ReservationContext;
  classification: Classification;
  caseType: CaseType;
  casePriority: CasePriority;
  onCaseTypeChange: (type: CaseType) => void;
  onCasePriorityChange: (priority: CasePriority) => void;
  actionPlan: ActionPlanState;
  createdCase: Case | null;
  onCreate: (details: { title: string; description: string }) => void;
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

function caseTypeLabel(type: CaseType): string {
  // Looked up from the same options the pills render, so the title prefill
  // can never drift from what "Case type" actually shows as selected.
  return CASE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

// Parent mounts this component only while the panel is open (see App.tsx),
// so every open is a fresh instance — local state below always starts clean,
// including the access-code reveal toggle.
export function CreateCasePanel({
  reservation,
  classification,
  caseType,
  casePriority,
  onCaseTypeChange,
  onCasePriorityChange,
  actionPlan,
  createdCase,
  onCreate,
  onClose,
}: CreateCasePanelProps) {
  // Tracks the live case-type pill, not the frozen suggestion — otherwise
  // switching the pill would leave a title that names the wrong type with no
  // indication it's stale, worse than the reasoning block since there's
  // nothing here to dim. Stops following once the agent types their own
  // title; a manual edit is theirs, not something a pill click should erase.
  const [title, setTitle] = useState(() => `${caseTypeLabel(caseType)} — ${reservation.listingName}`);
  const [titleTouched, setTitleTouched] = useState(false);
  // Attributed as a quote rather than dropped in verbatim: this text is what
  // travels with the case once it exists independently of this reservation
  // page (no linked-message view is built in this prototype), so it needs to
  // read as "the guest said this," not as the agent's own note.
  const [description, setDescription] = useState(() => `Guest: "${reservation.latestGuestMessage}"`);
  const [accessCodeRevealed, setAccessCodeRevealed] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!titleTouched) {
      setTitle(`${caseTypeLabel(caseType)} — ${reservation.listingName}`);
    }
  }, [caseType, reservation.listingName, titleTouched]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // The reasoning describes why the *original* suggestion was made — once the
  // agent picks something else, showing it at full strength would read like
  // it's still arguing for a value that's no longer selected.
  const isOverridden = caseType !== classification.type || casePriority !== classification.priority;

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

      {createdCase ? (
        <div className="caseForm">
          {/* Placeholder on purpose — step 11 replaces this with the real
              success view (case summary + the live action plan attached to
              it). This just proves creation doesn't wait on generation. */}
          <p className="placeholderBlock">Case created.</p>
        </div>
      ) : (
        <div className="caseForm">
          <label className="fieldLabel" htmlFor="caseTitle">
            Title
          </label>
          <input
            id="caseTitle"
            ref={titleInputRef}
            className="textInput"
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setTitleTouched(true);
            }}
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
          <div className="choiceRow" role="group" aria-label="Case type">
            {CASE_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={caseType === option.value}
                className={caseType === option.value ? "choicePill choicePillActive" : "choicePill"}
                onClick={() => onCaseTypeChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <span className="fieldLabel">Priority</span>
          <div className="choiceRow" role="group" aria-label="Priority">
            {PRIORITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={casePriority === option.value}
                className={casePriority === option.value ? "choicePill choicePillActive" : "choicePill"}
                onClick={() => onCasePriorityChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className={isOverridden ? "suggestionNote suggestionNoteDimmed" : "suggestionNote"}>
            <p className="suggestionNoteTitle">Why this was suggested</p>
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

          <span className="fieldLabel">Suggested actions</span>
          {/* idle and loading render the same on purpose, not an unhandled
              case: idle only ever lasts one render — App re-renders with
              enabled=true a render before its effect flips state to loading,
              regardless of what feeds `enabled`, so this holds even once it
              becomes casePanelOpen || caseCreated. */}
          {(actionPlan.status === "idle" || actionPlan.status === "loading") && (
            <p className="actionPlanStatus">Generating suggested actions…</p>
          )}
          {actionPlan.status === "error" && (
            <p className="actionPlanStatus">Couldn't generate suggested actions.</p>
          )}
          {actionPlan.status === "ready" && (
            <ul className="actionPlanList">
              {actionPlan.items.map((item) => (
                <li key={item.id}>{item.label}</li>
              ))}
            </ul>
          )}

          <button type="button" className="primaryButton" onClick={() => onCreate({ title, description })}>
            Create case
          </button>
        </div>
      )}
    </aside>
  );
}
