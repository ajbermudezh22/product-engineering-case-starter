import { useRef, useState } from "react";
import { Card } from "./components/Card";
import { CreateCasePanel } from "./components/CreateCasePanel";
import { reservationContext } from "./mockData";
import { deriveClassification } from "./classifyCase";
import type { CasePriority, CaseType } from "./caseTypes";

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
              <p className="emptyState">No open cases for this reservation.</p>
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
          onClose={closeCasePanel}
        />
      )}
    </div>
  );
}
