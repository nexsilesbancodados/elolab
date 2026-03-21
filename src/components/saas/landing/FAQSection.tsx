import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  items: FAQItem[];
  columns?: 1 | 2;
  contactCta?: { text: string; onClick: () => void };
}

export function FAQSection({
  title = "Perguntas frequentes",
  subtitle,
  items,
  columns = 1,
  contactCta,
}: FAQSectionProps) {
  const half = Math.ceil(items.length / 2);
  const col1 = columns === 2 ? items.slice(0, half) : items;
  const col2 = columns === 2 ? items.slice(half) : [];

  const renderAccordion = (faqItems: FAQItem[], keyPrefix: string) => (
    <Accordion type="single" collapsible className="space-y-3">
      {faqItems.map((item, i) => (
        <AccordionItem
          key={`${keyPrefix}-${i}`}
          value={`${keyPrefix}-${i}`}
          className="rounded-xl border border-border bg-card px-6 data-[state=open]:shadow-sm transition-shadow"
        >
          <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-4">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold font-display tracking-tight">{title}</h2>
          {subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className={`max-w-4xl mx-auto ${columns === 2 ? "grid md:grid-cols-2 gap-6" : ""}`}
        >
          {renderAccordion(col1, "a")}
          {columns === 2 && renderAccordion(col2, "b")}
        </motion.div>

        {contactCta && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-sm text-muted-foreground">
              Não encontrou o que procurava?{" "}
              <button onClick={contactCta.onClick} className="text-primary font-medium hover:underline">
                {contactCta.text}
              </button>
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
