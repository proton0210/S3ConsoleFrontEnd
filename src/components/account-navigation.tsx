"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const accountLinks = [
  { href: "/account/billing", label: "Billing" },
  { href: "/account/invoices", label: "Invoices" },
  { href: "/account/team", label: "Team" },
];
export default function AccountNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Account" className="border-b border-border bg-background"><div className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 py-3">
    {accountLinks.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={`rounded-lg px-4 py-2 text-sm font-medium ${pathname === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{link.label}</Link>)}
    <Link href="/downloads" className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted">Downloads</Link>
  </div></nav>;
}
