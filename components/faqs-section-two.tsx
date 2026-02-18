'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'

export default function FAQs() {
  const faqItems = [
    {
      id: 'item-1',
      question: 'How does the product sourcing process work?',
      answer:
        'Simply upload a product image or paste a product link, add your requirements, and submit your request. Our team researches suppliers, negotiates pricing, and sends you a detailed quote within 24 hours.',
    },
    {
      id: 'item-2',
      question: 'How long does it take to receive a price quote?',
      answer:
        'You will receive a transparent price quote within 24 hours after submitting your product request.',
    },
    {
      id: 'item-3',
      question: 'What subscription plans do you offer?',
      answer:
        'We offer three plans: Basic, Advanced, and VIP. Each plan is designed to filter serious buyers and provide different levels of service, from basic sourcing to full customization and live factory calls.',
    },
    {
      id: 'item-4',
      question: 'Can I customize my products (branding, packaging, quality)?',
      answer:
        'Yes. With the Advanced and VIP plans, you can request branding, packaging customization, quality checks, and product photography based on your needs.',
    },
    {
      id: 'item-5',
      question: 'Do you offer live video calls with markets or factories?',
      answer:
        'Yes. The VIP plan includes live video calls and remote market or factory visits so you can see your products in real time before placing an order.',
    },
    {
      id: 'item-6',
      question: 'How do I pay for subscriptions and services?',
      answer:
        'All payments are handled securely online. You can subscribe to a plan or pay for video call bookings directly through the platform.',
    },
    {
      id: 'item-7',
      question: 'What happens after I approve the quote?',
      answer:
        'Once you approve the quote, production and shipping will start based on your requirements. Our team will coordinate with suppliers and keep you updated.',
    },
  ]

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-5 md:gap-12">
          <div className="md:col-span-2">
            <h2 className="text-foreground text-4xl font-semibold">FAQs</h2>
            <p className="text-muted-foreground mt-4 text-balance text-lg">
              Everything you need to know about our sourcing process
            </p>
            <p className="text-muted-foreground mt-6 hidden md:block">
              Can't find what you're looking for? Contact our{' '}
              <Link href="#" className="text-primary font-medium hover:underline">
                support team
              </Link>
            </p>
          </div>

          <div className="md:col-span-3">
            <Accordion type="single" collapsible>
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="cursor-pointer text-base hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-base">{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <p className="text-muted-foreground mt-6 md:hidden">
            Can't find what you're looking for? Contact our{' '}
            <Link href="#" className="text-primary font-medium hover:underline">
              support team
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
