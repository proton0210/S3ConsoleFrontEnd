/**
 * Single source of truth for the active versions of legal documents.
 *
 * Bump the date string when you change the corresponding document. The client
 * polls /api/legal/current-versions on each revalidation cycle; if the server
 * returns a newer version than what the user accepted, the app prompts for
 * re-acceptance (Phase 13d).
 *
 * IMPORTANT: these documents are scaffolds. Real legal review is required
 * before launch — do not ship the placeholder copy unchanged.
 */

export const LEGAL_VERSIONS = {
  terms: "2026-05-09",
  privacy: "2026-05-09",
  eula: "2026-05-09",
  refund: "2026-05-09",
} as const;

export type LegalDocumentKey = keyof typeof LEGAL_VERSIONS;

/**
 * The "agreed-to-everything" composite version users accept at trial start
 * and purchase. Stored on the license row as `acceptedTermsVersion`.
 */
export function compositeLegalVersion(): string {
  return [LEGAL_VERSIONS.terms, LEGAL_VERSIONS.privacy, LEGAL_VERSIONS.eula].join(
    "/"
  );
}
