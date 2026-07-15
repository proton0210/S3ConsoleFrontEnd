"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Application = {
  email: string; name: string; phone: string; experience: string; motivation: string;
  dailyCommitment: boolean; awsAccount: boolean; operatingSystem: string; links: string;
  submittedAt: string; recordType: "APPLICATION";
};
type SortOrder = "newest" | "oldest" | "favourites";

const PAGE_SIZE = 12;
const applicationId = (application: Application) => application.email.trim().toLowerCase();
const timestamp = (value: string) => Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;

export function AdminApplications({ project }: { project: string }) {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const storageKey = `internship-admin-favourites:${project.toLowerCase()}`;

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/internships", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load applications.");
      setItems((data.applications || []).filter((item: Application) => item.recordType === "APPLICATION"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load applications.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) setFavourites(new Set(saved.filter((value): value is string => typeof value === "string")));
    } catch { window.localStorage.removeItem(storageKey); }
  }, [storageKey]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items
      .filter((item) => !favouritesOnly || favourites.has(applicationId(item)))
      .filter((item) => !normalizedQuery || [item.name, item.email, item.phone, item.operatingSystem, item.experience, item.motivation, item.links].some((value) => value?.toLowerCase().includes(normalizedQuery)))
      .sort((a, b) => {
        if (sortOrder === "favourites") {
          const favouriteDifference = Number(favourites.has(applicationId(b))) - Number(favourites.has(applicationId(a)));
          if (favouriteDifference) return favouriteDifference;
        }
        return sortOrder === "oldest" ? timestamp(a.submittedAt) - timestamp(b.submittedAt) : timestamp(b.submittedAt) - timestamp(a.submittedAt);
      });
  }, [items, query, sortOrder, favouritesOnly, favourites]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [query, sortOrder, favouritesOnly]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const toggleFavourite = (id: string) => setFavourites((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    window.localStorage.setItem(storageKey, JSON.stringify([...next]));
    return next;
  });
  const toggleExpanded = (id: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return <main className="min-h-screen bg-muted/30 py-8 sm:py-12"><div className="mx-auto max-w-7xl px-4 sm:px-6">
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to {project}</Link><h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Internship applications</h1><p className="mt-2 text-muted-foreground">Review, organise and shortlist submitted {project} applications.</p></div><Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button></header>

    {!loading && !error && items.length > 0 && <section className="mt-8 rounded-2xl border bg-card p-4 shadow-sm sm:p-5" aria-label="Application controls">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]"><label className="relative"><span className="sr-only">Search applications</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, phone, answers or links…" className="h-11 pl-10" /></label><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className="h-11 rounded-md border bg-background px-3 text-sm" aria-label="Sort applications"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="favourites">Favourites first</option></select><Button type="button" variant={favouritesOnly ? "default" : "outline"} onClick={() => setFavouritesOnly((value) => !value)} className="h-11"><Star className={`mr-2 h-4 w-4 ${favouritesOnly ? "fill-current" : ""}`} />Favourites ({favourites.size})</Button></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"><p>Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} matching applications</p><p>{items.length} total</p></div>
    </section>}

    {loading ? <State><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading applications…</State> : error ? <div role="alert" className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">{error}</div> : items.length === 0 ? <State>No applications have been submitted yet.</State> : filtered.length === 0 ? <State>No applications match the current search or filters.</State> : <>
      <div className="mt-5 space-y-3">{visible.map((application) => <ApplicationCard key={applicationId(application)} application={application} project={project} favourite={favourites.has(applicationId(application))} open={expanded.has(applicationId(application))} onFavourite={() => toggleFavourite(applicationId(application))} onToggle={() => toggleExpanded(applicationId(application))} />)}</div>
      {pageCount > 1 && <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Application pages"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button><span className="text-sm text-muted-foreground">Page {page} of {pageCount}</span><Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button></nav>}
    </>}
  </div></main>;
}

function ApplicationCard({ application, project, favourite, open, onFavourite, onToggle }: { application: Application; project: string; favourite: boolean; open: boolean; onFavourite: () => void; onToggle: () => void }) {
  const submitted = timestamp(application.submittedAt) ? `${new Date(application.submittedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST` : "Date unavailable";
  return <article className={`rounded-2xl border bg-card shadow-sm transition ${favourite ? "border-amber-300/80" : ""}`}>
    <div className="flex items-start gap-3 p-4 sm:p-5"><button type="button" onClick={onFavourite} className={`mt-0.5 rounded-lg p-2 transition hover:bg-muted ${favourite ? "text-amber-500" : "text-muted-foreground"}`} aria-label={favourite ? `Remove ${application.name} from favourites` : `Add ${application.name} to favourites`} title={favourite ? "Remove from favourites" : "Add to favourites"}><Star className={`h-5 w-5 ${favourite ? "fill-current" : ""}`} /></button><button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left" aria-expanded={open}><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h2 className="truncate text-lg font-semibold sm:text-xl">{application.name}</h2><p className="truncate text-sm text-primary">{application.email}</p><p className="mt-1 text-sm text-muted-foreground">{application.phone}</p></div><div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground"><time>{submitted}</time><ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} /></div></div><div className="mt-3 flex flex-wrap gap-2"><Tag>{application.operatingSystem}</Tag><Tag>AWS account: {application.awsAccount ? "Yes" : "No"}</Tag><Tag>Daily: {application.dailyCommitment ? "Yes" : "No"}</Tag>{favourite && <Tag>Favourite</Tag>}</div></button></div>
    {open && <div className="border-t px-5 pb-6 sm:px-7"><dl className="mt-5 grid gap-4 sm:grid-cols-3"><Info label="Daily commitment" value={application.dailyCommitment ? "Yes" : "No"} /><Info label="AWS account" value={application.awsAccount ? "Yes" : "No"} /><Info label="Operating system" value={application.operatingSystem} /></dl><Section title={`AWS ${project === "S3Console" ? "S3" : "DynamoDB"} experience`} text={application.experience} /><Section title="Reason for applying" text={application.motivation} /><Section title="Project and social links" text={application.links} /><div className="mt-5 flex flex-wrap gap-3"><Button asChild size="sm"><a href={`mailto:${application.email}`}>Email applicant</a></Button><Button asChild size="sm" variant="outline"><a href={`tel:${application.phone.replace(/\s/g, "")}`}>Call applicant</a></Button></div></div>}
  </article>;
}

function State({ children }: { children: React.ReactNode }) { return <div className="mt-8 flex items-center justify-center rounded-2xl border bg-card p-12 text-center text-muted-foreground">{children}</div>; }
function Tag({ children }: { children: React.ReactNode }) { return <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">{children}</span>; }
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>; }
function Section({ title, text }: { title: string; text: string }) { return <section className="mt-5"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{text}</p></section>; }
