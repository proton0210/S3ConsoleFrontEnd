import "server-only";

const REQUEST_TIMEOUT_MS = 10_000;

export type LicenseApiData = Record<string, any>;

function config() {
  const apiUrl = process.env.LICENSE_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.LICENSE_API_KEY;
  if (!apiUrl || !apiKey) {
    throw new Error("License service is not configured");
  }
  return { apiUrl, apiKey };
}

export async function licenseApiRequest(
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; data: LicenseApiData }> {
  const { apiUrl, apiKey } = config();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "x-api-key": apiKey,
      ...init.headers,
    },
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const data = await response.json().catch(() => null);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid response from license service");
  }
  return { response, data };
}

export function getLicenseByEmail(email: string) {
  return licenseApiRequest(`/license?email=${encodeURIComponent(email)}`);
}

/**
 * License row for the signed-in account. The webhook keys rows by the email
 * exactly as Clerk/checkout stored it (trimmed, case preserved), while some
 * older rows were written lower-cased. Try the exact address first, then the
 * lower-cased one, so every billing route resolves the same row.
 */
export async function getLicenseForAccount(email: string) {
  const exact = email.trim();
  const first = await getLicenseByEmail(exact);
  const lower = exact.toLowerCase();
  if (first.response.status !== 404 || lower === exact) return first;
  return getLicenseByEmail(lower);
}

export function getTeamByOwner(ownerEmail: string) {
  return licenseApiRequest(`/team?ownerEmail=${encodeURIComponent(ownerEmail)}`);
}
