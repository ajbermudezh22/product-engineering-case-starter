import { useRef, useState } from "react";
import { Card } from "./components/Card";
import { CreateCasePanel } from "./components/CreateCasePanel";
import { reservationContext } from "./mockData";
import { deriveClassification } from "./classifyCase";
import { useActionPlan } from "./hooks/useActionPlan";
import type { ActionPlanState } from "./hooks/useActionPlan";
import { caseTypeLabel, isHighUrgency, priorityLabel } from "./caseTypes";
import type { Case, CasePriority, CaseType } from "./caseTypes";

function actionPlanSummary(actionPlan: ActionPlanState): string {
  if (actionPlan.status === "ready") {
    const count = actionPlan.items.length;
    return `${count} suggested action${count === 1 ? "" : "s"} ready`;
  }
  if (actionPlan.status === "error") {
    return "Couldn't generate suggested actions";
  }
  return "Suggested actions generating…";
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="infoRow">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function App() {
  const [casePanelOpen, setCasePanelOpen] = useState(false);
  const addCaseButtonRef = useRef<HTMLButtonElement>(null);

  // Computed once from static reservation data — the suggestion and its
  // reasoning don't change if the agent overrides type/priority below.
  const suggestedClassification = deriveClassification(reservationContext);
  const [caseType, setCaseType] = useState<CaseType>(suggestedClassification.type);
  const [casePriority, setCasePriority] = useState<CasePriority>(suggestedClassification.priority);

  // Singular, not a list: there's exactly one useActionPlan slot below, so a
  // second case would need its own independent action-plan tracking (a map
  // keyed by case id) to avoid the second draft's key silently overwriting
  // the first case's plan. Out of scope here — the brief is one urgent
  // access issue, one case. Named as a limit, not left implicit.
  const [createdCase, setCreatedCase] = useState<Case | null>(null);

  function createCase({ title, description }: { title: string; description: string }) {
    setCreatedCase({
      id: crypto.randomUUID(),
      reservationId: reservationContext.reservationId,
      title,
      description,
      type: caseType,
      priority: casePriority,
      createdAt: new Date().toISOString(),
    });
  }

  function openCasePanel() {
    // Reset to the current suggestion on every open — caseType/casePriority
    // live here in App state (not inside the panel), so unlike title/
    // description they wouldn't otherwise clear themselves between sessions.
    setCaseType(suggestedClassification.type);
    setCasePriority(suggestedClassification.priority);
    setCasePanelOpen(true);
  }

  function closeCasePanel() {
    setCasePanelOpen(false);
    addCaseButtonRef.current?.focus();
  }

  // Lives here, not in the panel: the panel unmounts on close, and once a
  // case can exist independently of the panel (next step), its action plan
  // has to keep generating after the agent closes it.
  const actionPlan = useActionPlan({
    reservationId: reservationContext.reservationId,
    caseType,
    casePriority,
    // Stays enabled once a case exists even after the panel closes — that's
    // the whole point of decoupling creation from generation.
    enabled: casePanelOpen || createdCase !== null,
  });

  return (
    <div className={casePanelOpen ? "appShell panelOpen" : "appShell"}>
      <aside className="leftRail" aria-label="Main navigation wireframe">
        <div className="brandMark">A</div>
        <nav>
          <span>＋</span>
          <span>⌂</span>
          <span>▣</span>
          <span>☰</span>
          <span className="activeNav">▤</span>
        </nav>
        <div className="avatar">MI</div>
      </aside>

      <main className="page">
        <header className="topBar">
          <div>
            <p className="breadcrumb">Reservations / {reservationContext.reservationId}</p>
            <div className="titleRow">
              <h1>{reservationContext.guestName}</h1>
              <span className="pill success">Direct</span>
              <span className="pill danger">Access issue</span>
            </div>
            <p className="metaLine">
              {reservationContext.unitSku} · {reservationContext.stayDates} · {reservationContext.nights} nights
            </p>
          </div>
          <div className="topActions">
            <button
              ref={addCaseButtonRef}
              className="primaryButton"
              type="button"
              onClick={openCasePanel}
            >
              ＋ Add case
            </button>
            <button className="secondaryButton" type="button">Unit</button>
            <button className="secondaryButton" type="button">Booking</button>
          </div>
        </header>

        <div className="contentGrid">
          <div className="mainColumn">
            <Card title="Reservation info">
              <InfoRow label="Reservation ID" value={reservationContext.reservationId} />
              <InfoRow label="ETA" value={reservationContext.eta} />
              <InfoRow label="ETD" value={reservationContext.etd} />
              <InfoRow label="Unit SKU" value={reservationContext.unitSku} />
              <InfoRow label="Listing" value={reservationContext.listingName} />
            </Card>

            <Card title="Latest guest message">
              <div className="messageBubble">
                <div className="messageHeader">
                  <strong>{reservationContext.guestName}</strong>
                  <span>Just now</span>
                </div>
                <p>{reservationContext.latestGuestMessage}</p>
              </div>
            </Card>

            <Card title="Access context">
              <InfoRow label="Access method" value={reservationContext.accessMethod} />
              <InfoRow label="Backup access" value={reservationContext.backupAccessAvailable ? "Available" : "Not available"} />
              <InfoRow label="Smart lock battery" value={`${reservationContext.smartLockBatteryPercent}%`} />
              <InfoRow
                label="Recent messages"
                value={`${reservationContext.recentMessageCount} in ${reservationContext.recentMessageWindowMinutes} minutes`}
              />
              <div className="attentionNote">{reservationContext.similarIssueNote}</div>
            </Card>
          </div>

          <div className="sideColumn">
            <Card title="Guest">
              <InfoRow label="Email" value={reservationContext.guestEmail} />
              <InfoRow label="Phone" value={reservationContext.guestPhone} />
              <InfoRow label="Address" value={reservationContext.listingAddress} />
            </Card>

            <Card title="Payment" action={<span className="pill success">{reservationContext.paymentStatus}</span>}>
              <InfoRow label="Accommodation" value="€197,00" />
              <InfoRow label="Cleaning fee" value="€20,00" />
              <InfoRow label="Total" value="€217,00" />
            </Card>

            <Card title="Open cases">
              {createdCase ? (
                <>
                  <div className="titleRow">
                    <strong>{createdCase.title}</strong>
                    <span className="pill success">{caseTypeLabel(createdCase.type)}</span>
                    <span className={isHighUrgency(createdCase.priority) ? "pill danger" : "pill success"}>
                      {priorityLabel(createdCase.priority)}
                    </span>
                  </div>
                  <p className="metaLine">{actionPlanSummary(actionPlan)}</p>
                </>
              ) : (
                <p className="emptyState">No open cases for this reservation.</p>
              )}
            </Card>
          </div>
        </div>
      </main>

      {casePanelOpen && (
        <CreateCasePanel
          reservation={reservationContext}
          classification={suggestedClassification}
          caseType={caseType}
          casePriority={casePriority}
          onCaseTypeChange={setCaseType}
          onCasePriorityChange={setCasePriority}
          actionPlan={actionPlan}
          createdCase={createdCase}
          onCreate={createCase}
          onClose={closeCasePanel}
        />
      )}
    </div>
  );
}
