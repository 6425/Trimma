export interface CommissionRow {
  entity_type: "platform" | "salon" | "agent";
  amount: number; // LKR
  description: string;
}
export interface CommissionResponse {
  bookingId: string;
  rows: CommissionRow[];
}
