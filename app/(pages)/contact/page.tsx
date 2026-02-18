// app/contact/page.tsx
import { Mail, Phone, MapPin, Clock, MessageSquare, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HeroHeader } from '@/app/_components/Header/HeroHeader';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <HeroHeader />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-linear-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 opacity-50" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Get in Touch</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect with our team for sourcing inquiries, support, or partnership opportunities
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              We're here to help you source products from China quickly, transparently, and professionally
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Person Card */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl text-gradient flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  Primary Contact Person
                </CardTitle>
                <CardDescription>
                  Direct contact for platform inquiries and support
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Email</h3>
                      <a 
                        href="mailto:hakimsafi402@gmail.com" 
                        className="text-lg hover:text-color transition-colors"
                      >
                        hakimsafi402@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Phone/WhatsApp</h3>
                      <a 
                        href="tel:+93765299123" 
                        className="text-lg hover:text-color transition-colors"
                      >
                        +93 76 529 9123
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Name</h3>
                      <p className="text-lg">Hakimullah Rahimi Safi</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Best Ways to Reach Us:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-color" />
                      Email for detailed inquiries
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-color" />
                      WhatsApp for quick questions
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-color" />
                      Response within 24 hours
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Platform Information Card */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl text-gradient flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  Platform Information
                </CardTitle>
                <CardDescription>
                  Details about our China Import Sourcing Platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Response Time</h3>
                      <p className="text-lg">Within 24 hours for all inquiries</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Service Areas</h3>
                      <p className="text-lg">Global sourcing from Chinese markets</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Yiwu, Guangzhou, Shenzhen markets
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Languages</h3>
                      <p className="text-lg">English, with future Arabic/Chinese support</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Platform Features:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm font-medium">Product Sourcing</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm font-medium">Video Calls</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm font-medium">Customization</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm font-medium">Quality Checks</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">
                Ready to Start Sourcing from China?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Book a video call with our team or submit your first product request
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-color hover:opacity-90">
                  <Link href="#">
                    Book Video Call
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-color hover:bg-color/10">
                  <Link href="#">
                    Submit Product Request
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's the typical response time?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We guarantee a response within 24 hours for all product sourcing requests and inquiries.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I book a video call?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Use our Video Call Booking page to schedule live calls with markets or factories in China.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We use Stripe for secure online payments, supporting both subscriptions and one-time payments.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I customize products?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! We offer branding, quality checks, packaging customization, and product photography services.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}