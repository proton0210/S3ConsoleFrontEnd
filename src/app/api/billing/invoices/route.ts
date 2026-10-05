import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getLicenseForAccount, getTeamByOwner } from "@/lib/license-api";
import { invoiceAccount, type InvoiceAccount } from "@/lib/invoice-access";

const headers = { "Cache-Control": "no-store" };
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in to view invoices." }, { status: 401, headers });
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.trim();
    if (!email || user?.primaryEmailAddress?.verification?.status !== "verified") {
      return NextResponse.json({ error: "Verify your primary email before viewing invoices." }, { status: 403, headers });
    }
    const personal = await getLicenseForAccount(email);
    
    const team = await getTeamByOwner(email, userId);
    if ((!personal.response.ok && personal.response.status !== 404) || (!team.response.ok && team.response.status !== 404)) {
      return NextResponse.json({ error: "Invoice access could not be verified. Please retry." }, { status: 503, headers });
    }
    const accounts: InvoiceAccount[] = [];
    try {
      // A team seat's inherited customer is never personal billing authority.
      if (personal.response.ok) {
        const account = invoiceAccount("personal", personal.data, email, userId);
        if (personal.data.tier !== "team" || !team.response.ok) accounts.push(account);
      }
      if (team.response.ok) accounts.push(invoiceAccount("team", team.data, email, userId));
    } catch {
      return NextResponse.json({ error: "This billing record belongs to a different account. Contact support." }, { status: 403, headers });
    }
    
    return NextResponse.json({ accounts }, { headers });
  } catch {
    return NextResponse.json({ error: "Invoice access is temporarily unavailable. Please retry." }, { status: 503, headers });
  }
}
