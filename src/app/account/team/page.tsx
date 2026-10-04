/**
 * Team management dashboard for team-subscription owners.
 *
 * Reads the team overview from /api/team (Clerk session → backend GET /team)
 * and delegates actions to:
 *   - /api/team/invite  → add a member (sends them their license key by email)
 *   - /api/team/remove  → remove a member, free the seat
 *   - /api/team/seats   → change seat count (Dodo change-plan, prorated)
 *   - /api/dodo/portal-session → Dodo hosted portal (card, invoices, cancel)
 *
 * The Dodo webhook is the authoritative writer of billing state; after
 * mutations we simply re-fetch the overview.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Footer from "@/components/sections/footer";
import Header from "@/components/sections/header";
import { TEAM_SEAT_PRICE_USD } from "@/lib/reddit";
import {
  FaCheckCircle,
  FaEnvelope,
  FaExclamationTriangle,
  FaSpinner,
  FaTrash,
  FaUsers,
} from "react-icons/fa";

interface TeamMember {
  email: string;
  isOwner: boolean;
  activated: boolean;
  machineCount: number;
}

interface TeamOverview {
  ownerEmail: string;
  subscriptionStatus?: string;
  seatsPurchased: number;
  seatsUsed: number;
  validUntil: number | null;
  effectiveActive: boolean;
  inGrace: boolean;
  members: TeamMember[];
}

/** Returned when the signed-in user is a MEMBER of someone else's team. */
interface MemberOf {
  ownerEmail: string;
  licenseKey: string | null;
  active: boolean;
  machineCount: number;
  licenseCount: number;
}

function formatDate(ms?: number | null): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function TeamPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [team, setTeam] = useState<TeamOverview | null>(null);
  const [memberOf, setMemberOf] = useState<MemberOf | null>(null);
  const [fetching, setLoading] = useState(true);
  const loading = !isLoaded || (!!isSignedIn && fetching);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [pendingSeats, setPendingSeats] = useState<number | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null); // "invite" | "seats" | member email

  const refresh = useCallback(async () => {
    try {
      const resp = await fetch("/api/team", { cache: "no-store" });
      setError(null);
      if (resp.status === 404) {
        setNotFound(true);
        setTeam(null);
        setMemberOf(null);
        return;
      }
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Failed to load team");
      setNotFound(false);
      if (data?.memberOf) {
        // Signed-in user is a MEMBER of someone else's team, not an owner.
        setMemberOf(data.memberOf);
        setTeam(null);
        return;
      }
      setMemberOf(null);
      setTeam(data);
      return data as TeamOverview;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, refresh]);

  async function invite() {
    setBusy("invite");
    setError(null);
    setNotice(null);
    try {
      const resp = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberEmail: inviteEmail.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Invite failed");
      // Show the key here too — if the invite email is delayed or lost, the
      // owner can pass it along directly.
      setNotice(
        data?.resent
          ? `Invite re-sent to ${inviteEmail.trim()} — their license key is ${data?.member?.licenseKey ?? "on its way by email"}.`
          : `Invited ${inviteEmail.trim()} — their license key ${
              data?.member?.licenseKey ? `is ${data.member.licenseKey} and ` : ""
            }is on its way by email.`
      );
      setInviteEmail("");
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setBusy(null);
    }
  }

  async function resendInvite(memberEmail: string) {
    setBusy(`resend:${memberEmail}`);
    setError(null);
    setNotice(null);
    try {
      const resp = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberEmail }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Resend failed");
      setNotice(`Invite re-sent to ${memberEmail}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Resend failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove(memberEmail: string) {
    if (!window.confirm(`Remove ${memberEmail} from the team? Their license stops working immediately.`)) {
      return;
    }
    setBusy(memberEmail);
    setError(null);
    setNotice(null);
    try {
      const resp = await fetch("/api/team/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberEmail }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Remove failed");
      setNotice(`Removed ${memberEmail} — the seat is free again.`);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(null);
    }
  }

  async function changeSeats(delta: number) {
    if (!team || busy) return;
    if (pendingSeats !== null) return;
    const next = team.seatsPurchased + delta;
    setBusy("seats");
    setError(null);
    setNotice(null);
    try {
      const resp = await fetch("/api/team/seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seats: next }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Seat change failed");
      setPendingSeats(next);
      setNotice(data?.message || "Seat change submitted.");
      // Keep controls locked until the authoritative webhook count arrives.
      // A single delayed read can miss a slow webhook and charge twice.
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline) {
        const updated = await refresh();
        if (updated?.seatsPurchased === next) {
          setPendingSeats(null);
          setNotice(`Your team now has ${next} seats.`);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
      setNotice("Your seat change is still processing. Refresh this page before requesting another change.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Seat change failed");
    } finally {
      setBusy(null);
    }
  }

  async function openPortal() {
    try {
      const resp = await fetch("/api/dodo/portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "team" }),
      });
      const data = await resp.json();
      if (data?.link) window.location.href = data.link;
      else setError(data?.error || "Could not open the billing portal");
    } catch {
      setError("Could not open the billing portal");
    }
  }

  return (
    <div className="theme-scope min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-4 pt-10 pb-24 sm:pt-14">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FaUsers className="text-primary" /> Team
        </h1>
        <p className="text-muted-foreground mb-8">
          Manage seats and members on your Buckets by ServerlessCreed team subscription.
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <FaSpinner className="animate-spin" /> Loading…
          </div>
        )}

        {!loading && isLoaded && !isSignedIn && (
          <div className="surface rounded-2xl border border-border p-6">
            <p className="mb-4">Sign in with the email that owns the team subscription.</p>
            <Link href="/sign-in?redirect_url=/account/team">
              <Button>Sign in</Button>
            </Link>
          </div>
        )}

        {!loading && notFound && (
          <div className="surface rounded-2xl border border-border p-6">
            <p className="mb-2 font-medium">No team subscription on this account.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Team plans give every member a full license with centralized
              billing, from ${TEAM_SEAT_PRICE_USD}/seat/year (3-seat minimum).
            </p>
            <Link href="/buy?tier=team&seats=3">
              <Button>Start a team plan</Button>
            </Link>
            <p className="mt-4 text-xs text-muted-foreground">
              Just purchased? It can take a minute for your team to appear —{" "}
              <button className="underline" onClick={() => void refresh()}>
                refresh
              </button>
              .
            </p>
          </div>
        )}

        {/* Member view — signed-in user is on someone else's team */}
        {!loading && memberOf && (
          <div className="surface rounded-2xl border border-border p-6">
            <p className="mb-1 font-medium">
              You&apos;re on <span className="text-primary">{memberOf.ownerEmail}</span>&apos;s team
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {memberOf.active
                ? `Your license is active on ${memberOf.machineCount} of ${memberOf.licenseCount} machines.`
                : "Your seat is currently inactive — ask the team owner to check the subscription."}
            </p>
            {memberOf.licenseKey && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Your license key
                </p>
                <p className="font-mono text-sm break-all rounded-md bg-muted px-3 py-2">
                  {memberOf.licenseKey}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Link href="/downloads">
                <Button>Download Buckets by ServerlessCreed</Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Activate with this email address and the key above. Seats are
              managed by the team owner — contact {memberOf.ownerEmail} to add
              machines or leave the team.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
            <FaExclamationTriangle className="flex-shrink-0" /> {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <FaCheckCircle className="flex-shrink-0" /> {notice}
          </div>
        )}

        {team && (
          <>
            {/* Overview */}
            <div className="surface rounded-2xl border border-border p-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Seats</p>
                  <p className="text-2xl font-semibold">
                    {team.seatsUsed} <span className="text-muted-foreground text-base">of {team.seatsPurchased} used</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-2xl font-semibold capitalize">
                    {team.inGrace ? "grace period" : team.subscriptionStatus || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renews</p>
                  <p className="text-2xl font-semibold">{formatDate(team.validUntil)}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  disabled={busy !== null || pendingSeats !== null || !team.effectiveActive || team.seatsPurchased >= 50}
                  onClick={() => changeSeats(1)}
                >
                  {busy === "seats" ? <FaSpinner className="animate-spin mr-2" /> : null}
                  Add a seat
                </Button>
                <Button
                  variant="outline"
                  disabled={busy !== null || pendingSeats !== null || !team.effectiveActive || team.seatsPurchased <= Math.max(3, team.seatsUsed)}
                  onClick={() => changeSeats(-1)}
                >
                  Remove a seat
                </Button>
                <Button variant="outline" onClick={openPortal}>
                  Billing portal
                </Button>
              </div>
            </div>

            {/* Invite */}
            <div className="surface rounded-2xl border border-border p-6 mb-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <FaEnvelope className="text-primary" /> Invite a member
              </h2>
              <form
                className="flex gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void invite();
                }}
              >
                <input
                  type="email"
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <Button
                  type="submit"
                  disabled={busy !== null || !team.effectiveActive || !inviteEmail.includes("@") || team.seatsUsed >= team.seatsPurchased}
                >
                  {busy === "invite" ? <FaSpinner className="animate-spin mr-2" /> : null}
                  Invite
                </Button>
              </form>
              {team.seatsUsed >= team.seatsPurchased && (
                <p className="mt-2 text-xs text-muted-foreground">
                  All seats are in use — add a seat above to invite more members.
                </p>
              )}
            </div>

            {/* Members */}
            <div className="surface rounded-2xl border border-border divide-y divide-border">
              {team.members.map((m) => (
                <div key={m.email} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium">
                      {m.email}{" "}
                      {m.isOwner && (
                        <span className="ml-2 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5">
                          owner
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.activated
                        ? `Activated on ${m.machineCount} machine${m.machineCount === 1 ? "" : "s"}`
                        : "Invited — not activated yet"}
                    </p>
                  </div>
                  {!m.isOwner && (
                    <div className="flex items-center gap-2">
                      {!m.activated && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy !== null || !team.effectiveActive}
                          onClick={() => resendInvite(m.email)}
                          title="Re-send the invite email with their license key"
                        >
                          {busy === `resend:${m.email}` ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <>
                              <FaEnvelope className="mr-1.5 h-3 w-3" /> Resend
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => remove(m.email)}
                      >
                        {busy === m.email ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaTrash className="text-red-500" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
