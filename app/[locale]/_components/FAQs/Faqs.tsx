'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function FAQs() {
  const t = useTranslations('FAQs')
  const items = t.raw('items') as { question: string; answer: string }[]

  return (
    <section className="py-16 md:py-24">
      
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-5 md:gap-12">
          <div className="md:col-span-2">
            <h2 className="text-foreground text-4xl font-semibold text-color">{t('title')}</h2>
            <p className="text-muted-foreground mt-4 text-balance text-lg">{t('description')}</p>
            <p className="text-muted-foreground mt-6 hidden md:block">
              {t.rich('contact', {
                link: (chunks) => (
                  <Link href="#" className="text-primary font-medium hover:underline">
                    {chunks}
                  </Link>
                )
              })}
            </p>
          </div>

          <div className="md:col-span-3">
            <Accordion type="single" collapsible>
              {items.map((item, index) => (
                <AccordionItem key={index} value={`item-${index + 1}`}>
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
            {t.rich('contact', {
              link: (chunks) => (
                <Link href="#" className="text-primary font-medium hover:underline">
                  {chunks}
                </Link>
              )
            })}
          </p>
        </div>
      </div>
    </section>
  )
}