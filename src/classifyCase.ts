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

  // Message frequency, the similar-issue note, and backup-access availability
  // are all real signals, but none of them change type or priority above —
  // they're appended as color, not reasoning. Left out on purpose: each one
  // is already visible in the Access context card sitting right next to this
  // panel, so repeating it here would only pad the list without explaining
  // the suggestion. Reasoning stays limited to what actually drove the call.

  return { type, priority, reasoning };
}
