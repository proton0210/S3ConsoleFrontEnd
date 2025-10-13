"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_ID = "hero";

export default function HomeStickyPromo() {
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [activePromo, setActivePromo] = useState<"dyno" | "academy">("dyno");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const heroElement = document.getElementById(HERO_ID);

    if (!heroElement) {
      setIsHeroVisible(false);
      return;
    }

    const { bottom, top } = heroElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 0;
    const isInitiallyVisible = bottom > 0 && top < viewportHeight;
    setIsHeroVisible(isInitiallyVisible);

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsHeroVisible(entry?.isIntersecting ?? false);
      },
      {
        root: null,
        threshold: 0,
      }
    );

    observer.observe(heroElement);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isHeroVisible) {
      return;
    }

    setActivePromo("dyno");

    const interval = window.setInterval(() => {
      setActivePromo((prev) => (prev === "dyno" ? "academy" : "dyno"));
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isHeroVisible]);

  if (!isHeroVisible) {
    return null;
  }

  const promo =
    activePromo === "dyno"
      ? {
          badge: "DynoConsole",
          description: "Manage your DynamoDB tables like a pro.",
          href: "https://dynoconsole.com/",
          cta: "Explore DynoConsole",
          variant: "outline" as const,
        }
      : {
          badge: "Serverless Academy",
          description: "Master serverless and get job ready with hands-on labs.",
          href: "https://www.academy.serverlesscreed.com/",
          cta: "Join Serverless Academy",
          variant: "secondary" as const,
        };

  return (
    <div className="border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex flex-col items-center justify-between gap-3 py-2 text-sm sm:flex-row">
        <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:text-left">
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary transition-all">
            {promo.badge}
          </span>
          <span className="text-muted-foreground transition-all">
            {promo.description}
          </span>
        </div>
        <Link
          href={promo.href}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: promo.variant, size: "sm" }))}
        >
          {promo.cta}
        </Link>
      </div>
    </div>
  );
}
