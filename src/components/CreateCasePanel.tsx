import { useEffect, useRef, useState } from "react";
import type { ReservationContext } from "../mockData";
import type { Case, CasePriority, CaseType, Classification } from "../caseTypes";
import { CASE_TYPE_OPTIONS, PRIORITY_OPTIONS, caseTypeLabel } from "../caseTypes";
import type { ActionPlanState } from "../hooks/useActionPlan";
import { ActionPlanStatus } from "./ActionPlanStatus";
import { CaseSummary } from "./CaseSummary";

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
  // Local, not driven by createdCase directly: createdCase lives in App and
  // never resets (it feeds the Open Cases card and the action-plan enabled
  // gate even after this panel unmounts), so keying the success view off it
  // would mean reopening the panel after a case exists always shows "Case
  // created." with no way back to the form. justCreated resets to false on
  // every fresh mount, so reopening always reaches the form again. Trade-
  // off, not a coincidence: creating again re-calls onCreate and replaces
  // createdCase in App (same reservationId/caseType/casePriority every time
  // given the mock data, so only id/createdAt/title/description actually
  // change) — no multi-case support exists, so "create again" means
  // "replace," not "add a second case." Documented in DECISIONS.md.
  const [justCreated, setJustCreated] = useState(false);
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

  function handleCreate() {
    onCreate({ title, description });
    setJustCreated(true);
  }

  return (
    <aside className="casePanel" aria-label="Create case panel">
      <div className="casePanelHeader">
        <div>
          <p className="eyebrow">{justCreated ? "Case created" : "Create case"}</p>
          <h2>{reservation.guestName}</h2>
        </div>
        <button className="iconButton" type="button" onClick={onClose} aria-label="Close create case panel">
          ×
        </button>
      </div>

      {justCreated && createdCase ? (
        <div className="caseForm">
          {/* State-order inversion, documented in DECISIONS.md: the brief
              lists "loading" (5) before "success" (6); this renders success
              immediately and the action plan can still be "Generating…"
              right below it — creation never waits on generation. */}
          <CaseSummary record={createdCase} />

          <p className="successGuarantee">
            Case created. You can close this panel — suggested actions will attach when they're ready.
          </p>

          <span className="fieldLabel">Suggested actions</span>
          <ActionPlanStatus actionPlan={actionPlan} />
        </div>
      ) : (
        <>
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
            <ActionPlanStatus actionPlan={actionPlan} />
          </div>

          {/* Real third grid row (.casePanel is grid-template-rows: auto 1fr
              auto), not another item stacked inside the scrollable body —
              the primary action stays reachable without scrolling past
              title, description, both pill rows, reasoning, and the access
              code first. */}
          <div className="casePanelFooter">
            <button type="button" className="primaryButton" onClick={handleCreate}>
              Create case
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
