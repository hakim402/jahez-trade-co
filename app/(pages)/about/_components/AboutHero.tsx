import { Button } from "@/components/ui/button";
import Link from "next/link";



export default function AboutHero() {

    return (
        <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-linear-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 opacity-50" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About{" "}
              <span className="text-gradient">
                China Import Sourcing Platform
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Your trusted intermediary for sourcing products from China
              quickly, transparently, and professionally
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-color hover:opacity-90">
                <Link href="/contact">Get In Touch</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-color hover:bg-color/10"
              >
                <Link href="#how-it-works">How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    )
}