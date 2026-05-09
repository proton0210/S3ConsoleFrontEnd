import { siteConfig } from "@/lib/config";
import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="max-w-6xl mx-auto py-8 sm:px-10 px-5">
        <div className="border-t py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3">
          <span className="text-sm tracking-tight text-foreground">
            Copyright © {new Date().getFullYear()}{" "}
            <Link href="/" className="cursor-pointer">
              {siteConfig.name}
            </Link>{" "}
            - {siteConfig.description}
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
