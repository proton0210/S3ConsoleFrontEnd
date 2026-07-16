"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const words = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
const DEADLINE = Date.parse("2026-07-31T18:29:00.000Z");
const fieldClass = "mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const COMMUNITY_ROLES = ["AWS Cloud Captain", "AWS Student Group Leader", "AWS Community Builder", "Something else", "None"];
const INDIAN_STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
const GRADUATION_YEARS = Array.from({ length: 10 }, (_, index) => String(2026 + index));

export function InternshipForm({ initialEmail, initialName }: { initialEmail: string; initialName: string }) {
  const [form, setForm] = useState({ name: initialName, email: initialEmail, phone: "+91 ", collegeName: "", city: "", state: "", branch: "", graduationYear: "", experience: "", motivation: "", dailyCommitment: "", awsAccount: "", operatingSystem: "", communityRole: "", communityProofLink: "", communityDetails: "", links: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [closed, setClosed] = useState(() => Date.now() >= DEADLINE);
  useEffect(() => { const timer = window.setInterval(() => setClosed(Date.now() >= DEADLINE), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/internship", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Unable to check your application status.");
        setAlreadySubmitted(result.submitted === true);
      })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        console.error("Unable to check internship application status", caught);
      })
      .finally(() => { if (!controller.signal.aborted) setCheckingApplication(false); });
    return () => controller.abort();
  }, []);
  const counts = useMemo(() => ({ experience: words(form.experience), motivation: words(form.motivation) }), [form.experience, form.motivation]);
  const update = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }));
  const updateCommunityRole = (communityRole: string) => setForm((current) => ({
    ...current,
    communityRole,
    communityProofLink: communityRole === "None" ? "" : current.communityProofLink,
    communityDetails: communityRole === "Something else" ? current.communityDetails : "",
  }));

  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (closed) { setError("Applications closed on 31 July 2026 at 11:59 PM IST."); return; }
    if (!/^\+?91[6-9]\d{9}$/.test(form.phone.replace(/[\s()-]/g, ""))) { setError("Sorry, this internship is only valid for Indians. Please enter a valid +91 mobile number."); return; }
    if (form.collegeName.trim().length < 2 || form.city.trim().length < 2 || form.branch.trim().length < 2) { setError("Please complete your college, city and branch details."); return; }
    if (!INDIAN_STATES.includes(form.state) || !GRADUATION_YEARS.includes(form.graduationYear)) { setError("Please select a valid state and graduation year."); return; }
    if (counts.experience < 50 || counts.motivation < 50) { setError("Both long-form answers must contain at least 50 words."); return; }
    if (!form.communityRole) { setError("Please select your AWS community role."); return; }
    if (form.communityRole !== "None" && !/^https?:\/\/\S+$/i.test(form.communityProofLink.trim())) { setError("Please provide a valid supporting link beginning with http:// or https://."); return; }
    if (form.communityRole === "Something else" && form.communityDetails.trim().length < 80) { setError("Please add a short paragraph showcasing your skills and achievements."); return; }
    setConfirmOpen(true);
  }

  async function confirmSubmission() {
    setConfirmOpen(false); setStatus("submitting"); setError("");
    try {
      const response = await fetch("/api/internship", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, dailyCommitment: form.dailyCommitment === "yes", awsAccount: form.awsAccount === "yes" }) });
      const result = await response.json().catch(() => ({}));
      if (response.status === 409) { setAlreadySubmitted(true); setStatus("idle"); return; }
      if (!response.ok) { setError(result.error || "Unable to submit your application."); setStatus("idle"); return; }
      setStatus("success");
    } catch {
      setError("We could not reach the application service. Please check your connection and try again."); setStatus("idle");
    }
  }

  if (status === "success") return <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4"><div className="max-w-lg rounded-2xl border bg-card p-10 text-center shadow-sm"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h1 className="mt-5 text-3xl font-semibold tracking-tight">Application received</h1><p className="mt-3 text-muted-foreground">Thank you for applying to the S3Console internship. Our team will evaluate your application, and we will reach out to you if you are shortlisted.</p><Button asChild className="mt-7"><Link href="/">Back to S3Console</Link></Button></div></main>;

  return <main className="min-h-screen bg-muted/30 py-10 sm:py-16"><div className="mx-auto max-w-3xl px-4"><Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to S3Console</Link><div className="mt-8"><span className="rounded-full border bg-background px-3 py-1 text-xs font-medium">S3Console Internship</span><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Build real-world AWS S3 experience</h1><p className="mt-4 max-w-2xl text-lg text-muted-foreground">Tell us about yourself and why you’d be a great fit. This internship is open to applicants in India who can contribute 1–2 hours each day.</p></div>
    <form onSubmit={submit} className="mt-10 space-y-8 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
      {closed && <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Applications closed on 31 July 2026 at 11:59 PM IST.</div>}
      {checkingApplication && <div className="flex items-center justify-center rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking your application status…</div>}
      <fieldset disabled={closed || checkingApplication || alreadySubmitted || status === "submitting"} className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2"><Field label="Name" required><Input value={form.name} onChange={(e) => update("name", e.target.value)} required minLength={2} className="mt-2 h-12 rounded-xl" /></Field><Field label="Email"><Input value={form.email} readOnly type="email" className="mt-2 h-12 rounded-xl bg-muted" /><p className="mt-1 text-xs text-muted-foreground">Linked to your signed-in account</p></Field></div>
      <Field label="Phone number" hint="Indian mobile number starting with +91" required><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} inputMode="tel" required className="mt-2 h-12 rounded-xl" /></Field>
      <section className="space-y-5 rounded-2xl border bg-muted/20 p-4 sm:p-6">
        <div><h2 className="text-base font-semibold">Education details</h2><p className="mt-1 text-sm text-muted-foreground">Tell us about your current college programme.</p></div>
        <Field label="Name of the college" required><Input value={form.collegeName} onChange={(e) => update("collegeName", e.target.value)} minLength={2} maxLength={120} autoComplete="organization" required className="mt-2 h-12 rounded-xl" /></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="City" required><Input value={form.city} onChange={(e) => update("city", e.target.value)} minLength={2} maxLength={80} autoComplete="address-level2" required className="mt-2 h-12 rounded-xl" /></Field><Field label="State or union territory" required><select value={form.state} onChange={(e) => update("state", e.target.value)} autoComplete="address-level1" required className={`${fieldClass} h-12`}><option value="">Select state</option>{INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</select></Field></div>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Branch" hint="For example: CSE, IT, ECE or EXTC" required><Input value={form.branch} onChange={(e) => update("branch", e.target.value)} minLength={2} maxLength={80} placeholder="CSE" required className="mt-2 h-12 rounded-xl" /></Field><Field label="Graduation year" hint="Your expected graduation year" required><select value={form.graduationYear} onChange={(e) => update("graduationYear", e.target.value)} required className={`${fieldClass} h-12`}><option value="">Select year</option>{GRADUATION_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}</select></Field></div>
      </section>
      <LongField label="What experience do you have with AWS S3?" value={form.experience} count={counts.experience} onChange={(v) => update("experience", v)} />
      <LongField label="Why would you like to apply for this internship?" value={form.motivation} count={counts.motivation} onChange={(v) => update("motivation", v)} />
      <Choice label="Will you be able to dedicate 1–2 hours daily?" name="dailyCommitment" value={form.dailyCommitment} choices={["yes", "no"]} onChange={(v) => update("dailyCommitment", v)} />
      <Choice label="Do you have an AWS account?" name="awsAccount" value={form.awsAccount} choices={["yes", "no"]} onChange={(v) => update("awsAccount", v)} />
      <Choice label="Which operating system do you use?" name="operatingSystem" value={form.operatingSystem} choices={["Mac", "Windows", "Linux"]} onChange={(v) => update("operatingSystem", v)} />
      <section className="space-y-5 rounded-2xl border bg-muted/20 p-4 sm:p-6">
        <div><h2 className="text-base font-semibold">AWS community involvement</h2><p className="mt-1 text-sm text-muted-foreground">Tell us whether you currently hold an AWS community or student leadership role.</p></div>
        <Choice label="Which option best describes you?" name="communityRole" value={form.communityRole} choices={COMMUNITY_ROLES} onChange={updateCommunityRole} preserveCase />
        {form.communityRole && form.communityRole !== "None" && <Field label="Supporting link" hint="Share an official profile, announcement, AWS page, community page, or another public link that verifies this role." required><Input type="url" value={form.communityProofLink} onChange={(e) => update("communityProofLink", e.target.value)} placeholder="https://…" required className="mt-2 h-12 rounded-xl" /></Field>}
        {form.communityRole === "Something else" && <Field label="Showcase your skills and achievements" hint="Describe your AWS work, leadership, technical contributions, community impact, certifications, or other relevant accomplishments." required><textarea className={fieldClass} rows={6} minLength={80} value={form.communityDetails} onChange={(e) => update("communityDetails", e.target.value)} placeholder="Tell us what makes your experience stand out…" required /><p className="mt-1 text-right text-xs text-muted-foreground">{form.communityDetails.trim().length} / 80 characters minimum</p></Field>}
      </section>
      <Field label="Project links, LinkedIn or X" required><textarea className={fieldClass} rows={4} value={form.links} onChange={(e) => update("links", e.target.value)} placeholder="Share relevant links and a little context." required /></Field>
      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {!alreadySubmitted && <Button type="submit" size="lg" className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700" disabled={closed || checkingApplication || status === "submitting"}>{status === "submitting" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{closed ? "Applications closed" : "Submit application"}</Button>}
      </fieldset>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-[calc(100%_-_2rem)] rounded-2xl sm:max-w-md">
          <DialogHeader><DialogTitle>Confirm your application</DialogTitle><DialogDescription className="pt-2 leading-6">Please review your information carefully before continuing. Each applicant may submit only one application, and you will not be able to submit another application after confirmation.</DialogDescription></DialogHeader>
          <DialogFooter className="mt-2 gap-2 sm:gap-0"><Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>Review application</Button><Button type="button" onClick={confirmSubmission}>Confirm and submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlreadySubmittedDialog open={alreadySubmitted} product="S3Console" />
    </form></div></main>;
}

function AlreadySubmittedDialog({ open, product }: { open: boolean; product: string }) { return <Dialog open={open} onOpenChange={() => undefined}><DialogContent className="w-[calc(100%_-_2rem)] rounded-2xl sm:max-w-md" onEscapeKeyDown={(event) => event.preventDefault()} onPointerDownOutside={(event) => event.preventDefault()}><DialogHeader><CheckCircle2 className="mb-2 h-12 w-12 text-emerald-600" /><DialogTitle>Application already submitted</DialogTitle><DialogDescription className="pt-2 leading-6">Thank you for applying to the {product} internship. We have already received your application. Our team will evaluate it, and we will reach out to you if you are shortlisted.</DialogDescription></DialogHeader><DialogFooter className="mt-2"><Button asChild className="w-full"><Link href="/">Back to {product}</Link></Button></DialogFooter></DialogContent></Dialog>; }
function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) { return <div><Label className="text-sm font-medium">{label}{required && <span className="text-destructive"> *</span>}</Label>{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}{children}</div>; }
function LongField({ label, value, count, onChange }: { label: string; value: string; count: number; onChange: (value: string) => void }) { return <Field label={label} required><textarea className={fieldClass} rows={7} value={value} onChange={(e) => onChange(e.target.value)} required /><p className={`mt-1 text-right text-xs ${count < 50 ? "text-muted-foreground" : "text-emerald-600"}`}>{count} / 50 words minimum</p></Field>; }
function Choice({ label, name, value, choices, onChange, preserveCase = false }: { label: string; name: string; value: string; choices: string[]; onChange: (value: string) => void; preserveCase?: boolean }) { return <fieldset><legend className="text-sm font-medium leading-6">{label} <span className="text-destructive">*</span></legend><div className="mt-3 flex flex-wrap gap-3">{choices.map((choice) => <label key={choice} className={`flex min-h-11 min-w-[5.5rem] flex-1 cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-center text-sm transition sm:flex-none ${preserveCase ? "" : "capitalize"} ${value === choice ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted"}`}><input className="sr-only" type="radio" name={name} value={choice} checked={value === choice} onChange={() => onChange(choice)} required />{choice}</label>)}</div></fieldset>; }
