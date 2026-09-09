import { useState } from "react";
import type { ReservationContext } from "../mockData";

type CreateCasePanelProps = {
  open: boolean;
  reservation: ReservationContext;
  onClose: () => void;
};

export function CreateCasePanel({ open, reservation, onClose }: CreateCasePanelProps) {
  const [title, setTitle] = useState(() => `Access issue — ${reservation.listingName}`);
  const [description, setDescription] = useState(() => reservation.latestGuestMessage);

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
      </div>
    </aside>
  );
}
