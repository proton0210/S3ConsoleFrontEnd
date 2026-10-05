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
 * mutations we simply re-fetch the overview. Seat changes and removals are
 * confirmed in a dialog first: both take effect (and bill) immediately.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Download,
  Loader2,
  Mail,
  Minus,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AccountHeader,
  AccountMain,
  Avatar,
  CopyField,
  EmptyState,
  Fact,
  Meter,
  Notice,
  NoticeStack,
  Panel,
  PanelHeader,
  Skeleton,
  StatusBadge,
  formatDate,
  relativeDays,
} from "@/components/account/kit";
import { TEAM_SEAT_PRICE_USD } from "@/lib/reddit";

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
  /** Per-seat yearly price of this team's product; null when unknown. */
  seatPriceUsd?: number | null;
}

/** Returned when the signed-in user is a MEMBER of someone else's team. */
interface MemberOf {
  ownerEmail: string;
  licenseKey: string | null;
  active: boolean;
  machineCount: number;
  licenseCount: number;
}

const MIN_SEATS = 3;
const MAX_SEATS = 50; // matches /api/team/seats

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
  const [seatConfirm, setSeatConfirm] = useState<number | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
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
    setConfirmRemove(null);
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

  /** Seat changes charge (or credit) immediately, so they are confirmed first. */
  function changeSeats(delta: number) {
    if (!team || busy || pendingSeats !== null) return;
    setSeatConfirm(team.seatsPurchased + delta);
  }

  async function confirmSeats() {
    if (seatConfirm === null) return;
    const next = seatConfirm;
    setSeatConfirm(null);
    await submitSeats(next);
  }

  async function submitSeats(next: number) {
    if (!team || busy || pendingSeats !== null) return;
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

  /** Manual re-check after automatic polling gave up. */
  async function checkPendingSeats() {
    if (pendingSeats === null) return;
    const updated = await refresh();
    if (updated?.seatsPurchased === pendingSeats) {
      setNotice(`Your team now has ${pendingSeats} seats.`);
      setPendingSeats(null);
    }
  }

  async function openPortal() {
    setError(null);
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


  // Per-seat price this team pays: reported by the server when it knows the
  // team's product (null = unknown, show none); otherwise the list price.
  const seatPrice = typeof team?.seatPriceUsd === "number"
    ? team.seatPriceUsd
    : team?.seatPriceUsd === null ? null : TEAM_SEAT_PRICE_USD;
  const openSeats = team ? Math.max(0, team.seatsPurchased - team.seatsUsed) : 0;
  const seatsLocked = busy !== null || pendingSeats !== null || !team?.effectiveActive;
  const statusTone = team?.inGrace || team?.subscriptionStatus === "past_due" ? "warning" : team?.effectiveActive ? "success" : "neutral";
  const statusLabel = team?.inGrace ? "Grace period" : team?.subscriptionStatus === "past_due" ? "Payment due" : team?.effectiveActive ? "Active" : team?.subscriptionStatus ? team.subscriptionStatus.replace(/_/g, " ") : "Inactive";
  const removing = confirmRemove ? team?.members.find((m) => m.email === confirmRemove) : undefined;

  return (
    <AccountMain>
      <AccountHeader
        title="Your"
        accent="team"
        description={memberOf
          ? "Your seat on a Buckets team plan."
          : "Invite people, manage seats and keep one invoice for the whole team."}
      >
        {team && (
          <Button variant="outline" size="sm" onClick={openPortal}>
            <CreditCard className="mr-1.5 h-3.5 w-3.5" />Billing portal
          </Button>
        )}
      </AccountHeader>

      <div className="mt-8">
        <NoticeStack>
          {error && (
            <Notice key="error" tone="danger" icon={AlertTriangle} title="Something needs attention" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {notice && (
            <Notice key="notice" tone="success" icon={CheckCircle2} title={notice} onDismiss={() => setNotice(null)} />
          )}
        </NoticeStack>
      </div>

      {loading && (
        <div aria-busy="true" aria-label="Loading team" className="mt-6 grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-56 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl lg:col-span-3" />
        </div>
      )}

      {!loading && isLoaded && !isSignedIn && (
        <div className="mt-6">
          <EmptyState icon={Users} title="Sign in to manage your team" actions={
            <Link href="/sign-in?redirect_url=/account/team"><Button size="lg">Sign in</Button></Link>
          }>
            Use the email address that owns the team subscription.
          </EmptyState>
        </div>
      )}

      {!loading && notFound && (
        <div className="mt-6">
          <EmptyState icon={Users} title="No team plan on this account" actions={
            <Link href="/buy?tier=team&seats=3"><Button size="lg">Start a team plan<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          }>
            <p>
              Every member gets their own full license, the company gets one invoice,
              and seats move to new people when your team changes — ${TEAM_SEAT_PRICE_USD} per seat per year, 3-seat minimum.
            </p>
            <p className="mt-4 text-sm">
              Just purchased? It can take a minute for your team to appear —{" "}
              <button type="button" className="font-medium text-foreground underline underline-offset-4" onClick={() => void refresh()}>
                refresh
              </button>
              .
            </p>
          </EmptyState>
        </div>
      )}

      {/* Member view — signed-in user is on someone else's team */}
      {!loading && memberOf && (
        <Panel className="mt-6 p-6 sm:p-8">
          <PanelHeader
            icon={Users}
            title={<>You&apos;re on <span className="text-[hsl(var(--acct-accent-ink))]">{memberOf.ownerEmail}</span>&apos;s team</>}
            description={memberOf.active
              ? `Your license is active on ${memberOf.machineCount} of ${memberOf.licenseCount} machines.`
              : "Your seat is currently inactive — ask the team owner to check the subscription."}
          >
            <StatusBadge tone={memberOf.active ? "success" : "neutral"} dot>{memberOf.active ? "Active seat" : "Inactive"}</StatusBadge>
          </PanelHeader>
          {memberOf.licenseKey && (
            <div className="mt-6 max-w-xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Your license key</p>
              <CopyField value={memberOf.licenseKey} label="Copy license key" className="mt-1.5" />
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/downloads">
              <Button><Download className="mr-2 h-4 w-4" />Download Buckets</Button>
            </Link>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Activate with this email address and the key above. Seats are
            managed by the team owner — contact {memberOf.ownerEmail} to add
            machines or leave the team.
          </p>
        </Panel>
      )}

      {team && (
        <>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {/* Seats */}
            <Panel className="p-6 sm:p-7 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Seats in use</p>
                  <p className="mt-2 flex items-baseline gap-2">
                    <span className="text-5xl font-semibold tracking-[-0.04em]">{team.seatsUsed}</span>
                    <span className="text-lg text-muted-foreground">of {team.seatsPurchased}</span>
                  </p>
                </div>
                <StatusBadge tone={statusTone} dot>{statusLabel}</StatusBadge>
              </div>
              <Meter used={team.seatsUsed} total={team.seatsPurchased} label={`${team.seatsUsed} of ${team.seatsPurchased} seats in use`} className="mt-5" />
              <p className="mt-2.5 text-sm text-muted-foreground">
                {openSeats === 0 ? "Every seat is assigned. Add a seat to invite someone new." : `${openSeats} open seat${openSeats === 1 ? "" : "s"} ready for an invite.`}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                <Button
                  variant="outline"
                  disabled={seatsLocked || team.seatsPurchased <= Math.max(MIN_SEATS, team.seatsUsed)}
                  onClick={() => changeSeats(-1)}
                >
                  <Minus className="mr-1.5 h-4 w-4" />Remove a seat
                </Button>
                <Button
                  disabled={seatsLocked || team.seatsPurchased >= MAX_SEATS}
                  onClick={() => changeSeats(1)}
                >
                  {busy === "seats" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
                  Add a seat
                </Button>
                <span className="text-xs leading-5 text-muted-foreground">
                  {seatPrice !== null ? `$${seatPrice} per seat per year, prorated.` : "Prorated to your renewal date."} Minimum {MIN_SEATS} seats.
                </span>
              </div>
            </Panel>

            {/* Subscription */}
            <Panel className="p-6 sm:p-7">
              <dl className="grid gap-5">
                <Fact label="Renews" hint={relativeDays(team.validUntil)}>{formatDate(team.validUntil)}</Fact>
                {seatPrice !== null && (
                  <Fact label="Yearly total" hint={`${team.seatsPurchased} seats × $${seatPrice}`}>${team.seatsPurchased * seatPrice} / year</Fact>
                )}
                <Fact label="Billed to">{<span className="break-all">{team.ownerEmail}</span>}</Fact>
              </dl>
            </Panel>
          </div>

          {pendingSeats !== null && (
            <Panel className="mt-5 flex flex-col gap-4 border-[hsl(var(--acct-accent)/0.35)] p-5 sm:flex-row sm:items-center sm:justify-between" role="status">
              <div className="flex items-start gap-3">
                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[hsl(var(--acct-accent-ink))]" aria-hidden />
                <div>
                  <p className="text-sm font-semibold">Waiting for confirmation of {pendingSeats} seats</p>
                  <p className="text-sm text-muted-foreground">
                    {busy === "seats"
                      ? "Payment providers can take a moment. We check automatically."
                      : "Still processing. Check again in a moment; seat changes stay locked until it's confirmed."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => void checkPendingSeats()}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Check again
                </Button>
              </div>
            </Panel>
          )}

          {/* Members */}
          <Panel className="mt-5 overflow-hidden">
            <div className="p-6 sm:p-7">
              <PanelHeader
                icon={UserPlus}
                title="Invite a member"
                description="They get their own license key by email, valid on up to 2 machines."
              />
              <form
                className="mt-5 flex flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  void invite();
                }}
              >
                <label htmlFor="team-invite-email" className="sr-only">Teammate email</label>
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <input
                    id="team-invite-email"
                    type="email"
                    autoComplete="off"
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-[hsl(var(--acct-accent)/0.6)] focus:ring-4 focus:ring-[hsl(var(--acct-accent)/0.12)]"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 rounded-xl px-5"
                  disabled={busy !== null || !team.effectiveActive || !inviteEmail.includes("@") || team.seatsUsed >= team.seatsPurchased}
                >
                  {busy === "invite" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send invite
                </Button>
              </form>
              {team.seatsUsed >= team.seatsPurchased && (
                <p className="mt-2.5 text-xs text-muted-foreground">
                  All seats are in use — add a seat above to invite more members.
                </p>
              )}
            </div>

            <div className="border-t border-border">
              <div className="flex items-center justify-between px-6 py-3 sm:px-7">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Members</h2>
                <span className="text-xs text-muted-foreground">{team.seatsUsed} of {team.seatsPurchased} seats</span>
              </div>
              <ul className="divide-y divide-border border-t border-border">
                {team.members.map((m) => (
                  <li key={m.email} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-4 sm:px-7">
                    <Avatar email={m.email} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={m.email}>{m.email}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {m.isOwner && <StatusBadge tone="brand">Owner</StatusBadge>}
                        {!m.activated && <StatusBadge tone="warning">Invited</StatusBadge>}
                        <span>
                          {m.activated
                            ? `Activated on ${m.machineCount} machine${m.machineCount === 1 ? "" : "s"}`
                            : "Hasn't activated the app yet"}
                        </span>
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
                            {busy === `resend:${m.email}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="mr-1.5 h-3.5 w-3.5" />Resend</>}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300"
                          disabled={busy !== null}
                          onClick={() => setConfirmRemove(m.email)}
                          aria-label={`Remove ${m.email}`}
                        >
                          {busy === m.email ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
                {Array.from({ length: openSeats }, (_, i) => (
                  <li key={`open-${i}`} className="flex items-center gap-4 px-6 py-4 sm:px-7">
                    <span aria-hidden className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                      <Plus className="h-4 w-4" />
                    </span>
                    <p className="text-sm text-muted-foreground">Open seat — invite someone above</p>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </>
      )}

      {/* Confirm seat change */}
      {team && seatConfirm !== null && (
        <Dialog open onOpenChange={(open) => { if (!open && busy !== "seats") setSeatConfirm(null); }}>
          <DialogContent className="theme-scope rounded-3xl border-border bg-card p-0 sm:max-w-md sm:rounded-3xl">
            <div className="p-6">
              <DialogHeader className="space-y-0 text-left">
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--acct-accent)/0.10)] text-[hsl(var(--acct-accent-ink))]">
                  <Users className="h-5 w-5" />
                </span>
                <DialogTitle className="text-xl tracking-tight">
                  {seatConfirm > team.seatsPurchased ? "Add a seat?" : "Remove a seat?"}
                </DialogTitle>
                <DialogDescription className="pt-1.5 text-sm leading-6">
                  {seatConfirm > team.seatsPurchased
                    ? "The change applies now. You're charged a prorated amount for the rest of this billing year."
                    : "The change applies now. Any unused time is credited by our payment provider."}
                </DialogDescription>
              </DialogHeader>
              <dl className="mt-5 divide-y divide-border rounded-2xl border border-border bg-muted/40 text-sm">
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">Seats</dt>
                  <dd className="font-medium">{team.seatsPurchased} → {seatConfirm}</dd>
                </div>
                {seatPrice !== null && (
                  <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <dt className="text-muted-foreground">From your next renewal</dt>
                    <dd className="font-medium">${seatConfirm * seatPrice} / year</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">Renews</dt>
                  <dd className="font-medium">{formatDate(team.validUntil)}</dd>
                </div>
              </dl>
              <DialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:gap-2">
                <Button variant="outline" onClick={() => setSeatConfirm(null)} disabled={busy === "seats"}>Not now</Button>
                <Button onClick={() => void confirmSeats()} disabled={busy === "seats"}>
                  {busy === "seats" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm seat change
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm member removal */}
      {team && confirmRemove !== null && (
        <Dialog open onOpenChange={(open) => { if (!open && busy !== confirmRemove) setConfirmRemove(null); }}>
          <DialogContent className="theme-scope rounded-3xl border-border bg-card p-0 sm:max-w-md sm:rounded-3xl">
            <div className="p-6">
              <DialogHeader className="space-y-0 text-left">
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-700 dark:text-red-300">
                  <Trash2 className="h-5 w-5" />
                </span>
                <DialogTitle className="text-xl tracking-tight">Remove {confirmRemove}?</DialogTitle>
                <DialogDescription className="pt-1.5 text-sm leading-6">
                  Their license stops working immediately{removing?.activated ? ` on ${removing.machineCount} machine${removing.machineCount === 1 ? "" : "s"}` : ""}. The seat stays on your plan, ready for someone new.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:gap-2">
                <Button variant="outline" onClick={() => setConfirmRemove(null)}>Keep member</Button>
                <Button variant="destructive" onClick={() => void remove(confirmRemove)}>Remove member</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AccountMain>
  );
}
