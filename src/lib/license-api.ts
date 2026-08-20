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

export function getTeamByOwner(ownerEmail: string) {
  return licenseApiRequest(`/team?ownerEmail=${encodeURIComponent(ownerEmail)}`);
}
