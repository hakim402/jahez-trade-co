import { Globe, Shield, Target, Zap } from "lucide-react";

export default function MissionVision() {
  return (
    <section className="py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">
              Our <span className="text-gradient">Mission</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              To revolutionize how businesses source products from China by
              providing a trusted, transparent, and efficient intermediary
              platform that eliminates the complexities and risks of
              international trade.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Target className="w-6 h-6 text-color mt-1" />
                <div>
                  <h3 className="font-semibold">Project Goals</h3>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <li>• Launch a professional platform quickly</li>
                    <li>• Filter serious buyers using subscriptions</li>
                    <li>
                      • Build trust through transparency and live interaction
                    </li>
                    <li>• Keep operating costs low at the early stage</li>
                    <li>• Ensure system scalability for future upgrades</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-6">Why Choose Us?</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="p-2 rounded-full bg-color/20">
                  <Shield className="w-5 h-5 text-color" />
                </div>
                <div>
                  <h4 className="font-semibold">Trusted Intermediary</h4>
                  <p className="text-sm text-muted-foreground">
                    Professional platform with verified suppliers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="p-2 rounded-full bg-color/20">
                  <Zap className="w-5 h-5 text-color" />
                </div>
                <div>
                  <h4 className="font-semibold">24-Hour Response</h4>
                  <p className="text-sm text-muted-foreground">
                    Quick price quotes and support
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="p-2 rounded-full bg-color/20">
                  <Globe className="w-5 h-5 text-color" />
                </div>
                <div>
                  <h4 className="font-semibold">Global Reach</h4>
                  <p className="text-sm text-muted-foreground">
                    Shipping to all major countries
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
