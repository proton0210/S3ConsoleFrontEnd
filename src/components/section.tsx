import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function Section({
  id,
  title,
  subtitle,
  description,
  children,
  className,
}: SectionProps) {
  const sectionId = title ? title.toLowerCase().replace(/\s+/g, "-") : id;
  return (
    <section id={id || sectionId} className="scroll-mt-20">
      <div className={className}>
        <div className="relative container mx-auto max-w-7xl px-4 py-20 md:py-28">
          {(title || subtitle || description) && (
            <div className="mx-auto max-w-3xl space-y-4 pb-8 text-center">
              {title && (
                <h2 className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                  {title}
                </h2>
              )}
              {subtitle && (
                <h3
                  className={cn(
                    "mx-auto mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl md:text-5xl",
                    "text-foreground"
                  )}
                >
                  {subtitle}
                </h3>
              )}
              {description && (
                <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
