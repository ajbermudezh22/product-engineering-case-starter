import type { ReservationContext } from "./mockData";
import type { Classification, CasePriority, CaseType } from "./caseTypes";

// Plain sequential checks over the signals already on the reservation page —
// no scoring table. Each check either sets/escalates a value or doesn't, and
// leaves a plain-language reason behind it. This is a *suggestion*: the agent
// sees the same evidence and can pick something else before creating the case.
export function deriveClassification(reservation: ReservationContext): Classification {
  const reasoning: string[] = [];
  const message = reservation.latestGuestMessage.toLowerCase();

  const mentionsAccessProblem =
    message.includes("door") || message.includes("code") || message.includes("lock");

  let type: CaseType;
  if (mentionsAccessProblem) {
    type = "access_issue";
    reasoning.push("Guest message mentions the door/code, pointing at an access issue.");
  } else {
    type = "general_issue";
    reasoning.push("Guest message doesn't mention door, code, or lock — no clear signal for a specific type.");
  }

  let priority: CasePriority = "medium";

  // Inferred, not a field: "today" comes from stayDates, "at the door right now"
  // comes from reading the message text. Named as an inference in the UI, not a fact.
  const staysToday = reservation.stayDates.toLowerCase().startsWith("today");
  const guestSoundsPresent = message.includes("standing") || message.includes("outside");

  if (mentionsAccessProblem && staysToday && guestSoundsPresent) {
    priority = "high";
    reasoning.push(
      "Message reads as the guest standing at the door right now, and the stay starts today (inferred from the message plus today's check-in, not a stored field)."
    );
  }

  if (priority === "high" && reservation.smartLockBatteryPercent < 25) {
    priority = "urgent";
    reasoning.push(
      `Smart lock battery is at ${reservation.smartLockBatteryPercent}%, which raises the chance this is a real lockout rather than a code the guest can just retry.`
    );
  }

  if (priority === "urgent" && reservation.recentMessageCount >= 3) {
    reasoning.push(
      `Guest sent ${reservation.recentMessageCount} messages in ${reservation.recentMessageWindowMinutes} minutes — a pace that reads as active distress, not a routine question.`
    );
  }

  if (reservation.similarIssueNote) {
    reasoning.push(`${reservation.similarIssueNote} Worth checking whether this is a recurring problem, not a one-off.`);
  }

  if (reservation.backupAccessAvailable) {
    reasoning.push(
      "A backup keybox exists for this unit — useful for whoever picks this up, though it doesn't lower urgency since the guest is stuck right now."
    );
  }

  return { type, priority, reasoning };
}
