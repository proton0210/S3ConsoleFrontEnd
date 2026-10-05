"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CreditCard, Download, Receipt, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const accountLinks = [
  { href: "/account/billing", label: "Billing", icon: CreditCard },
  { href: "/account/invoices", label: "Invoices", icon: Receipt },
  { href: "/account/team", label: "Team", icon: Users },
];

export default function AccountNavigation() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  return (
    <nav aria-label="Account" className="border-b border-border/70 bg-background/60">
      <div className="mx-auto flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2.5 sm:px-6">
        {accountLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative isolate inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium outline-none sm:px-3.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="account-nav-pill"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                  className="absolute inset-0 -z-10 rounded-full border border-border bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.06)]"
                />
              )}
              <Icon className={cn("h-4 w-4", active ? "text-[hsl(var(--acct-accent-ink))]" : "")} aria-hidden />
              {label}
            </Link>
          );
        })}
        <span aria-hidden className="mx-1.5 h-5 w-px shrink-0 bg-border" />
        <Link
          href="/downloads"
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="h-4 w-4" aria-hidden />
          Downloads
          <ArrowUpRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
