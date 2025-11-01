import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What is Sollucky?',
    answer: 'Sollucky is a next-generation decentralized lottery platform built on the Solana blockchain. We offer automated, transparent, and fair lotteries with Monthly, Weekly, and Daily draws. Everything runs automatically via smart contracts with no manual intervention.',
  },
  {
    question: 'How do I play?',
    answer: 'Connect your Solana wallet (Phantom or Solflare) and buy tickets for the lottery you want to enter. Tickets are pegged at $1 USD worth of SOL. Pre-ordering Monthly tickets gives you 2× tickets (up to 250 max). Payment is made directly when purchasing tickets.',
  },
  {
    question: 'How are winners chosen?',
    answer: 'Winners are chosen automatically by our Solana smart contracts using verifiable random functions (VRF). The draw happens automatically at the scheduled time with complete transparency. All results are recorded on-chain and publicly verifiable.',
  },
  {
    question: 'Is Sollucky secure?',
    answer: 'Yes. Sollucky is built on Solana, one of the most secure and fastest blockchains. All draws are automated by audited smart contracts. Your wallet remains non-custodial, meaning you always control your funds. We never hold your SOL - it goes directly into the smart contract.',
  },
  {
    question: 'What is Solana?',
    answer: 'Solana is a high-performance blockchain known for fast transactions and low fees. It powers Sollucky\'s automated lottery system, ensuring transparency, security, and instant payouts. Learn more at solana.com.',
  },
  {
    question: 'How is the prize pool distributed?',
    answer: 'For every ticket: 70% goes to the prize pool, 5% covers operational costs, and 25% goes to the platform. This split is enforced automatically by smart contracts and is transparent on-chain.',
  },
];

export function FAQ() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about Sollucky
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl px-6 hover:border-primary/40 hover:bg-card/80 transition-all"
              >
                <AccordionTrigger className="text-left font-semibold hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
