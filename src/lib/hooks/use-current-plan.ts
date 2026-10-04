"use client";

/**
 * The signed-in user's current plan, for plan pickers. Anonymous visitors and
 * accounts without a license resolve to "none" (show the normal purchase flow).
 */
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { currentPlanFromLicense, type CurrentPlan } from "@/lib/plan-options";

export function useCurrentPlan(): { loading: boolean; plan: CurrentPlan } {
  const { isLoaded, userId } = useAuth();
  const [state, setState] = useState<{ loading: boolean; plan: CurrentPlan; forUser: string | null }>({
    loading: true,
    plan: "none",
    forUser: null,
  });

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let canceled = false;
    Promise.all([
      fetch("/api/user-data", { cache: "no-store" }).catch(() => null),
      fetch("/api/team", { cache: "no-store" }).catch(() => null),
    ])
      .then(async ([resp, teamResp]) => {
        const data = await resp?.json().catch(() => null);
        const team = await teamResp?.json().catch(() => null);
        // A Lifetime owner keeps their personal license; the separate team
        // record still blocks buying a second team subscription.
        const ownsTeam = teamResp?.ok && team?.ownerEmail && !team?.memberOf &&
          !["canceled", "cancelled", "expired", "failed"].includes(team.subscriptionStatus);
        const plan = ownsTeam ? "team" : resp?.ok && data?.success ? currentPlanFromLicense(data.userData) : "none";
        if (!canceled) setState({ loading: false, plan, forUser: userId });
      })
      .catch(() => {
        if (!canceled) setState({ loading: false, plan: "none", forUser: userId });
      });
    return () => {
      canceled = true;
    };
  }, [isLoaded, userId]);

  if (!isLoaded) return { loading: true, plan: "none" };
  if (!userId) return { loading: false, plan: "none" };
  if (state.forUser !== userId) return { loading: true, plan: "none" };
  return { loading: state.loading, plan: state.plan };
}
