import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';


export default function CTA() {

    return (
        <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-6xl mx-auto text-center">
            <Card className="border-2 border-color shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Ready to Start Sourcing from China?
                </CardTitle>
                <CardDescription>
                  Join businesses worldwide who trust our platform for their import needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="bg-color hover:opacity-90">
                    <Link href="/contact">
                      Contact Our Team
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-color hover:bg-color/10">
                    <Link href="#">
                      View Demo
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Professional platform • Transparent pricing • 24-hour response
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    )
}