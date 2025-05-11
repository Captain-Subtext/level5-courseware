
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What's included in the guide?",
    answer:
      "The guide covers setting up a demo environment, making backups, rolling back changes, understanding prompting better, working with a database, implementing user authentication, and setting up credit card payments - all without needing to code!",
  },
  {
    question: "Do I need any coding experience?",
    answer:
      "Not at all! This guide is specifically designed for people who don't have coding experience but want to build applications using Cursor.",
  },
  {
    question: "How will I receive the guide?",
    answer:
      "After purchase, the guide will be immediately emailed to you as a downloadable document.",
  },
  {
    question: "Is there a money-back guarantee?",
    answer:
      "Yes! If you're not satisfied with the guide, we offer a 30-day money-back guarantee.",
  },
  {
    question: "Will I get updates to the guide?",
    answer:
      "Absolutely! When we update the guide with new tips and tricks, you'll receive the updates for free.",
  },
];

const FaqSection = () => {
  return (
    <section className="bg-gray-50 py-24" id="faq">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FaqSection;
