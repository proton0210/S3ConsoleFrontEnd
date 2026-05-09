/**
 * Returns the active versions of legal documents. The desktop client polls
 * this on every revalidation cycle (Phase 13d) and shows a re-acceptance
 * modal if the user's stored `acceptedTermsVersion` is older than what we
 * return here.
 */
import { NextResponse } from "next/server";
import { LEGAL_VERSIONS, compositeLegalVersion } from "@/lib/legalVersions";

export async function GET() {
  return NextResponse.json(
    {
      versions: LEGAL_VERSIONS,
      composite: compositeLegalVersion(),
    },
    {
      headers: {
        // Cache at the edge for 5 min — emergency hotfix can wait that long.
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}
