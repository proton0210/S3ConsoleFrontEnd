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
    <section id={id || sectionId}>
      <div className={className}>
        <div className="relative container mx-auto px-4 py-20 max-w-7xl">
          <div className="space-y-3 pb-10 max-w-3xl mx-auto text-center">
            {title && (
              <p className="text-[11px] uppercase tracking-[0.24em] text-signal">
                § {title}
              </p>
            )}
            {subtitle && (
              <h3 className="font-display text-4xl font-light leading-[1.05] sm:text-5xl md:text-6xl">
                {subtitle}
              </h3>
            )}
            {description && (
              <p className="mt-4 text-[14px] leading-relaxed text-char-600 max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
