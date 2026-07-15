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

export function InternshipForm({ initialEmail, initialName }: { initialEmail: string; initialName: string }) {
  const [form, setForm] = useState({ name: initialName, email: initialEmail, phone: "+91 ", experience: "", motivation: "", dailyCommitment: "", awsAccount: "", operatingSystem: "", links: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closed, setClosed] = useState(() => Date.now() >= DEADLINE);
  useEffect(() => { const timer = window.setInterval(() => setClosed(Date.now() >= DEADLINE), 1000); return () => window.clearInterval(timer); }, []);
  const counts = useMemo(() => ({ experience: words(form.experience), motivation: words(form.motivation) }), [form.experience, form.motivation]);
  const update = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (closed) { setError("Applications closed on 31 July 2026 at 11:59 PM IST."); return; }
    if (!/^\+?91[6-9]\d{9}$/.test(form.phone.replace(/[\s()-]/g, ""))) { setError("Sorry, this internship is only valid for Indians. Please enter a valid +91 mobile number."); return; }
    if (counts.experience < 50 || counts.motivation < 50) { setError("Both long-form answers must contain at least 50 words."); return; }
    setConfirmOpen(true);
  }

  async function confirmSubmission() {
    setConfirmOpen(false); setStatus("submitting"); setError("");
    try {
      const response = await fetch("/api/internship", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, dailyCommitment: form.dailyCommitment === "yes", awsAccount: form.awsAccount === "yes" }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error || "Unable to submit your application."); setStatus("idle"); return; }
      setStatus("success");
    } catch {
      setError("We could not reach the application service. Please check your connection and try again."); setStatus("idle");
    }
  }

  if (status === "success") return <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4"><div className="max-w-lg rounded-2xl border bg-card p-10 text-center shadow-sm"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h1 className="mt-5 text-3xl font-semibold tracking-tight">Application received</h1><p className="mt-3 text-muted-foreground">Thanks for applying to the S3Console internship. We’ll review your application and contact you by email.</p><Button asChild className="mt-7"><Link href="/">Back to S3Console</Link></Button></div></main>;

  return <main className="min-h-screen bg-muted/30 py-10 sm:py-16"><div className="mx-auto max-w-3xl px-4"><Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to S3Console</Link><div className="mt-8"><span className="rounded-full border bg-background px-3 py-1 text-xs font-medium">S3Console Internship</span><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Build real-world AWS S3 experience</h1><p className="mt-4 max-w-2xl text-lg text-muted-foreground">Tell us about yourself and why you’d be a great fit. This internship is open to applicants in India who can contribute 1–2 hours each day.</p></div>
    <form onSubmit={submit} className="mt-10 space-y-8 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
      {closed && <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Applications closed on 31 July 2026 at 11:59 PM IST.</div>}
      <fieldset disabled={closed || status === "submitting"} className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2"><Field label="Name" required><Input value={form.name} onChange={(e) => update("name", e.target.value)} required minLength={2} className="mt-2 h-12 rounded-xl" /></Field><Field label="Email"><Input value={form.email} readOnly type="email" className="mt-2 h-12 rounded-xl bg-muted" /><p className="mt-1 text-xs text-muted-foreground">Linked to your signed-in account</p></Field></div>
      <Field label="Phone number" hint="Indian mobile number starting with +91" required><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} inputMode="tel" required className="mt-2 h-12 rounded-xl" /></Field>
      <LongField label="What experience do you have with AWS S3?" value={form.experience} count={counts.experience} onChange={(v) => update("experience", v)} />
      <LongField label="Why would you like to apply for this internship?" value={form.motivation} count={counts.motivation} onChange={(v) => update("motivation", v)} />
      <Choice label="Will you be able to dedicate 1–2 hours daily?" name="dailyCommitment" value={form.dailyCommitment} choices={["yes", "no"]} onChange={(v) => update("dailyCommitment", v)} />
      <Choice label="Do you have an AWS account?" name="awsAccount" value={form.awsAccount} choices={["yes", "no"]} onChange={(v) => update("awsAccount", v)} />
      <Choice label="Which operating system do you use?" name="operatingSystem" value={form.operatingSystem} choices={["Mac", "Windows", "Linux"]} onChange={(v) => update("operatingSystem", v)} />
      <Field label="Project links, LinkedIn or X" required><textarea className={fieldClass} rows={4} value={form.links} onChange={(e) => update("links", e.target.value)} placeholder="Share relevant links and a little context." required /></Field>
      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      <Button type="submit" size="lg" className="w-full rounded-xl" disabled={closed || status === "submitting"}>{status === "submitting" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{closed ? "Applications closed" : "Submit application"}</Button>
      </fieldset>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-[calc(100%_-_2rem)] rounded-2xl sm:max-w-md">
          <DialogHeader><DialogTitle>Confirm your application</DialogTitle><DialogDescription className="pt-2 leading-6">Please review your information carefully before continuing. Each applicant may submit only one application, and you will not be able to submit another application after confirmation.</DialogDescription></DialogHeader>
          <DialogFooter className="mt-2 gap-2 sm:gap-0"><Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>Review application</Button><Button type="button" onClick={confirmSubmission}>Confirm and submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </form></div></main>;
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) { return <div><Label className="text-sm font-medium">{label}{required && <span className="text-destructive"> *</span>}</Label>{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}{children}</div>; }
function LongField({ label, value, count, onChange }: { label: string; value: string; count: number; onChange: (value: string) => void }) { return <Field label={label} required><textarea className={fieldClass} rows={7} value={value} onChange={(e) => onChange(e.target.value)} required /><p className={`mt-1 text-right text-xs ${count < 50 ? "text-muted-foreground" : "text-emerald-600"}`}>{count} / 50 words minimum</p></Field>; }
function Choice({ label, name, value, choices, onChange }: { label: string; name: string; value: string; choices: string[]; onChange: (value: string) => void }) { return <fieldset><legend className="text-sm font-medium leading-6">{label} <span className="text-destructive">*</span></legend><div className="mt-3 flex flex-wrap gap-3">{choices.map((choice) => <label key={choice} className={`flex min-h-11 min-w-[5.5rem] flex-1 cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm capitalize transition sm:flex-none ${value === choice ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted"}`}><input className="sr-only" type="radio" name={name} value={choice} checked={value === choice} onChange={() => onChange(choice)} required />{choice}</label>)}</div></fieldset>; }
