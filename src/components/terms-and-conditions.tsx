"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const legalDocuments = [
  {
    href: "/terms",
    label: "Terms and Conditions",
    description: "Commercial terms, subscriptions, billing, refunds, support, and disputes.",
  },
  {
    href: "/privacy",
    label: "Privacy Policy",
    description: "How personal information, AWS credentials, and customer content are handled.",
  },
  {
    href: "/eula",
    label: "End-User License Agreement",
    description: "The licence governing installation and use of the desktop application.",
  },
] as const;

export function TermsAndConditions() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary">
          Terms and Conditions
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buckets by ServerlessCreed legal documents</DialogTitle>
          <DialogDescription>
            Review the authoritative documents that apply to your account and use of the product.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid gap-3">
          {legalDocuments.map((document) => (
            <Link
              key={document.href}
              href={document.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border p-4 transition-colors hover:border-primary hover:bg-muted/50"
            >
              <span className="font-semibold text-foreground">{document.label}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {document.description}
              </span>
            </Link>
          ))}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          The linked documents are maintained by ServerlessCreed and take precedence over summaries
          or earlier product copy.
        </p>
      </DialogContent>
    </Dialog>
  );
}
