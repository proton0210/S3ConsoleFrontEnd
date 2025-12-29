"use client";

import Section from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { FaStar } from "react-icons/fa";

export default function PricingSection() {
  return (
    <Section title="Pricing" subtitle="Simple, transparent pricing">
      <div className="flex justify-center">
        <div className="max-w-md w-full">
          <p className="text-sm text-muted-foreground text-center mb-6">
            Please note: depending on your country's tax rules, additional VAT/GST may be added to the final amount.
          </p>
          {siteConfig.pricing.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 30,
                delay: 0.2,
              }}
              className={cn(
                "rounded-2xl p-8 bg-background text-center relative overflow-hidden",
                "border border-border hover:border-transparent",
                "group transition-all duration-500 ease-out",
                "hover:shadow-[0_0_50px_rgba(8,_112,_184,_0.7)]",
                "before:absolute before:inset-0 before:rounded-2xl before:p-[2px]",
                "before:bg-gradient-to-r before:from-blue-500 before:via-purple-500 before:to-pink-500",
                "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
                "before:-z-10 before:content-['']",
                "after:absolute after:inset-[2px] after:rounded-2xl after:bg-background after:-z-10"
              )}
            >
              <div>
                <p className="text-lg font-semibold text-muted-foreground mb-4">
                  {plan.name}
                </p>
                <div className="mt-6 flex items-baseline justify-center gap-x-1">
                  <span className="text-6xl font-bold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 mb-8">
                  {plan.period}
                </p>

                <ul className="mt-8 space-y-3 text-left">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <Check className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={cn(
                    buttonVariants({
                      variant: "default",
                    }),
                    "w-full mt-8 text-lg font-semibold py-3",
                    "bg-primary hover:bg-primary/90 text-white",
                    "transform transition-all duration-200 hover:scale-105"
                  )}
                >
                  {plan.buttonText}
                </Link>
                <p className="mt-4 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
