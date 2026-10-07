/**
 * Does this verified email own Lifetime of the OTHER app?
 *
 * SERVER-ONLY. Tables and Buckets run separate Clerk instances and separate
 * backends, so the only shared identity is the verified account email. The
 * partner backend exposes POST /suite/partner-lifetime, which answers one
 * boolean and is guarded by the shared SUITE_PARTNER_SECRET (it is NOT the
 * partner's license API key, which opens its whole license API).
 *
 * Env (server-only, never NEXT_PUBLIC_):
 * - SUITE_PARTNER_API_URL: the Tables backend's API Gateway base URL (the
 *   value of the Tables site's LICENSE_API_URL)
 * - SUITE_PARTNER_SECRET: the shared secret, same value in all four places
 */
import "server-only";

const TIMEOUT_MS = 4_000;

function config(): { url: string; secret: string } | null {
  const url = process.env.SUITE_PARTNER_API_URL?.trim().replace(/\/+$/, "");
  const secret = process.env.SUITE_PARTNER_SECRET?.trim();
  return url && secret ? { url, secret } : null;
}

export function partnerLookupConfigured(): boolean {
  return config() !== null;
}

/** Live answer from the partner backend. Throws when it cannot answer. */
export async function partnerOwnsLifetime(email: string): Promise<boolean> {
  const settings = config();
  if (!settings) throw new Error("Partner lookup is not configured");
  const response = await fetch(`${settings.url}/suite/partner-lifetime`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-suite-partner-secret": settings.secret },
    body: JSON.stringify({ email }),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.lifetime !== "boolean") {
    throw new Error(`Partner lookup failed (${response.status})`);
  }
  return data.lifetime;
}

/** For display: null when unconfigured or unavailable (never a guessed "no"). */
export async function partnerLifetimeOrNull(email: string): Promise<boolean | null> {
  if (!partnerLookupConfigured()) return null;
  try {
    return await partnerOwnsLifetime(email);
  } catch {
    console.warn("[partner-license] Partner lookup unavailable.");
    return null;
  }
}
