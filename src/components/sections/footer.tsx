import { siteConfig } from "@/lib/config";
import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="max-w-6xl mx-auto py-8 sm:px-10 px-5">
        <div className="border-t py-6 grid grid-cols-1 h-full justify-between w-full gap-1">
          <span className="text-sm tracking-tight text-foreground">
            Copyright © {new Date().getFullYear()}{" "}
            <Link href="/" className="cursor-pointer">
              {siteConfig.name}
            </Link>{" "}
            - {siteConfig.description}
          </span>
        </div>
      </div>
    </footer>
  );
}
