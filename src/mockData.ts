export type ReservationContext = {
  reservationId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  stayDates: string;
  nights: number;
  unitSku: string;
  listingName: string;
  listingAddress: string;
  eta: string;
  etd: string;
  paymentStatus: "Paid" | "Unpaid" | "Partial";
  accessMethod: string;
  backupAccessAvailable: boolean;
  smartLockBatteryPercent: number;
  latestGuestMessage: string;
  recentMessageCount: number;
  recentMessageWindowMinutes: number;
  similarIssueNote: string;
  accessCode: string;
};

export const reservationContext: ReservationContext = {
  reservationId: "rsv-demo-1729",
  guestName: "Sarah Keller",
  guestEmail: "sarah.keller@example.invalid",
  guestPhone: "+49 155 0100 1729",
  stayDates: "Today to 31.05.2026",
  nights: 2,
  unitSku: "unt-demo-berlin-042",
  listingName: "Rigaer Str. 12",
  listingAddress: "Rigaer Str. 12, Berlin",
  eta: "15:00",
  etd: "10:00",
  paymentStatus: "Paid",
  accessMethod: "Smart lock plus backup keybox",
  backupAccessAvailable: true,
  smartLockBatteryPercent: 18,
  latestGuestMessage: "The door code does not work and I am standing outside.",
  recentMessageCount: 4,
  recentMessageWindowMinutes: 8,
  similarIssueNote: "A similar access issue was reported for this listing 3 days ago.",
  // Mocked only so the create-case flow has a real value to mask by default and
  // reveal on explicit request — never written into a case's title/description.
  accessCode: "4821",
};
