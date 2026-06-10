"use client";

import Section from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
import { useEffect } from "react";
import { trackReddit } from "@/lib/reddit";

export default function PricingSection() {
  // High-intent signal: the user is looking at our plans. Fires once per
  // mount (home-page section or the dedicated /pricing route).
  useEffect(() => {
    trackReddit("ViewContent", {
      products: [{ id: "pricing", name: "S3Console pricing", category: "pricing" }],
    });
  }, []);

  return (
    <Section title="Pricing" subtitle="Pick a plan that fits">
      <p className="text-sm text-muted-foreground text-center mb-2 max-w-2xl mx-auto">
        All plans include every feature on up to 2 machines. Start with a 14-day
        free trial — no credit card required.
      </p>
      <p className="text-xs text-muted-foreground text-center mb-10">
        Depending on your country's tax rules, VAT/GST may be added at checkout.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {siteConfig.pricing.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: 0.1 * index,
            }}
            className={cn(
              "relative rounded-2xl p-8 bg-background text-center transition-all duration-300",
              "border",
              plan.isPopular
                ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                : "border-border hover:border-primary/40"
            )}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                  <FaStar className="h-3 w-3" />
                  Most Popular
                </span>
              </div>
            )}

            <p className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
              {plan.name}
            </p>
            <div className="mt-4 flex items-baseline justify-center gap-x-1">
              <span className="text-5xl font-bold tracking-tight text-foreground">
                {plan.price}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              {plan.period}
            </p>

            <ul className="space-y-2.5 text-left mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full font-medium",
                plan.isPopular
                  ? "bg-primary hover:bg-primary/90 text-white"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              )}
            >
              {plan.buttonText}
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              {plan.description}
            </p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
