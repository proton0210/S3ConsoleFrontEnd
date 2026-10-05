export type InvoiceScope = "personal" | "team";
export interface InvoiceAccount {
  scope: InvoiceScope;
  label: string;
  status: "available" | "unavailable" | "managed_by_owner";
}
export function isInvoiceProduct(row: Record<string, unknown>): boolean {
  return row.product === undefined || row.product === null || row.product === "buckets";
}
export function isInvoicePortalUrl(raw: unknown): raw is string {
  if (typeof raw !== "string" || raw.length > 4096) return false;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password && !url.port &&
      (url.hostname === "customer.dodopayments.com" || url.hostname.endsWith(".dodopayments.com"));
  } catch { return false; }
}
/** Billing history remains available after expiration. Entitlement is not financial authority. */
export function invoiceAccount(scope: InvoiceScope, row: Record<string, unknown>, email: string, subject: string): InvoiceAccount {
  const sameEmail = (value: unknown) => typeof value === "string" && value.toLowerCase() === email.toLowerCase();
  if (!isInvoiceProduct(row) || (row.clerkId && row.clerkId !== subject) || (scope === "personal" && row.email && !sameEmail(row.email)) ||
      (scope === "team" && (!sameEmail(row.ownerEmail) || (row.ownerClerkId && row.ownerClerkId !== subject)))) {
    throw new Error("Billing record does not belong to this account.");
  }
  const label = scope === "team" ? "Team purchases" : "Personal purchases";
  if (scope === "personal" && (row.tier === "team" || (row.teamOwner && !sameEmail(row.teamOwner)))) {
    return { scope, label: "Team purchases", status: "managed_by_owner" };
  }
  return { scope, label, status: typeof row.dodoCustomerId === "string" && row.dodoCustomerId.trim() ? "available" : "unavailable" };
}
