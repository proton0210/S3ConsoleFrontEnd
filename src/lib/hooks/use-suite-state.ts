"use client";

/**
 * The signed-in person's Buckets plan plus what they own of Tables, and the
 * Suite offer that fits (see suiteStateFor). The Tables answer is one request
 * per signed-in user per page, shared by the pricing banner, /suite, /buy and
 * the billing card. Signed-out visitors resolve immediately to the public offer.
 */
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useCurrentPlan } from "@/lib/hooks/use-current-plan";
import {
  ownsLifetime,
  suiteStateFor,
  type CurrentPlan,
  type SuiteOwnership,
  type SuiteState,
} from "@/lib/plan-options";

export interface SuiteStatus {
  /** True until we know who is looking, including while Clerk starts up. */
  loading: boolean;
  /**
   * True only while a SIGNED-IN person's ownership is being fetched. Use this
   * (not `loading`) to dim prices: anonymous visitors — most traffic — never
   * see a dimmed page, and owners never see $149 flash before their offer.
   */
  pending: boolean;
  /**
   * The plan for Suite decisions. Same as useCurrentPlan, except that a
   * personal Buckets Lifetime wins over an owned Team (useCurrentPlan reports
   * "team" for those owners, which would hide their $49 upgrade).
   */
  plan: CurrentPlan;
  suite: SuiteOwnership | null;
  state: SuiteState;
}

type OwnershipResponse = (SuiteOwnership & { herePlan?: CurrentPlan }) | null;

const inflight = new Map<string, Promise<OwnershipResponse>>();

function loadOwnership(userId: string): Promise<OwnershipResponse> {
  let request = inflight.get(userId);
  if (!request) {
    request = fetch("/api/suite/ownership", { cache: "no-store", signal: AbortSignal.timeout(10_000) })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => (data?.suite ?? null) as OwnershipResponse)
      .catch(() => null);
    inflight.set(userId, request);
    // Fresh answer on the next navigation (e.g. right after a purchase).
    void request.finally(() => setTimeout(() => inflight.delete(userId), 5_000));
  }
  return request;
}

const PREVIEW_STATES: readonly SuiteState[] = ["public", "subscriber", "team", "upgrade-here", "upgrade-there", "owned"];

/**
 * Development only: `?suite_preview=<state>` renders that version of every
 * Suite surface without needing an account in that state. The branch is
 * removed from production builds (NODE_ENV is inlined at build time).
 */
function previewState(): SuiteState | null {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("suite_preview");
  return PREVIEW_STATES.includes(value as SuiteState) ? (value as SuiteState) : null;
}

export function useSuiteState(): SuiteStatus {
  const { isLoaded, userId } = useAuth();
  const { loading: planLoading, plan } = useCurrentPlan();
  const [result, setResult] = useState<{ forUser: string; suite: OwnershipResponse } | null>(null);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let canceled = false;
    void loadOwnership(userId).then((suite) => {
      if (!canceled) setResult({ forUser: userId, suite });
    });
    return () => {
      canceled = true;
    };
  }, [isLoaded, userId]);

  const preview = previewState();
  if (preview) {
    const previewPlan = preview === "subscriber" ? "monthly" : preview === "team" ? "team" : preview === "upgrade-here" || preview === "owned" ? "lifetime" : "none";
    return { loading: false, pending: false, plan: previewPlan, suite: null, state: preview };
  }
  if (!isLoaded) return { loading: true, pending: false, plan: "none", suite: null, state: "public" };
  if (!userId) return { loading: false, pending: false, plan: "none", suite: null, state: "public" };
  if (planLoading || result?.forUser !== userId) return { loading: true, pending: true, plan, suite: null, state: "public" };
  const herePlan = result.suite?.herePlan;
  const suitePlan = herePlan && ownsLifetime(herePlan) ? herePlan : plan;
  const suite: SuiteOwnership | null = result.suite
    ? { partnerLifetime: result.suite.partnerLifetime, viaSuite: result.suite.viaSuite }
    : null;
  return { loading: false, pending: false, plan: suitePlan, suite, state: suiteStateFor(suitePlan, suite) };
}
