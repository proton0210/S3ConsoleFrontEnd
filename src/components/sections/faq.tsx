import Section from "@/components/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { siteConfig } from "@/lib/config";

export default function FAQ() {
  return (
    <Section title="FAQ" subtitle="Questions, answered">
      <div className="mx-auto mt-6 md:max-w-3xl">
        <Accordion type="single" collapsible className="w-full divide-y divide-border border-y border-border">
          {siteConfig.faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={faq.question} className="border-0">
              <AccordionTrigger className="py-5 text-left text-base font-medium text-foreground hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-[15px] leading-7 text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <p className="mt-10 text-center text-sm text-muted-foreground">
        Still have questions?{" "}
        <a
          href={`mailto:${siteConfig.links.email}`}
          className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary"
        >
          Email the team
        </a>
        .
      </p>
    </Section>
  );
}
