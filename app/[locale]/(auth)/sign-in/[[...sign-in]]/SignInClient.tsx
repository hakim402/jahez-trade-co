"use client";

import { SignIn } from "@clerk/nextjs";

interface SignInClientProps {
  locale: string;
  isAr: boolean;
}

export function SignInClient({ locale, isAr }: SignInClientProps) {
  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap");

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-slide-in-left {
          animation: slideInFromLeft 0.8s ease-out forwards;
        }

        .animate-slide-in-right {
          animation: slideInFromRight 0.8s ease-out forwards;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .delay-100 {
          animation-delay: 100ms;
        }

        .delay-200 {
          animation-delay: 200ms;
        }

        .delay-300 {
          animation-delay: 300ms;
        }

        .delay-400 {
          animation-delay: 400ms;
        }

        .grain-overlay {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.4;
        }

        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(99, 102, 241, 0.1) 50%,
            transparent 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }

        .dark .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(129, 140, 248, 0.1) 50%,
            transparent 100%
          );
        }
      `}</style>

      {/* Split Screen Layout */}
      <div className="relative flex min-h-[calc(100vh-80px)]">
        {/* Left Panel - Visual/Brand Side */}
        <div
          className={`hidden lg:flex lg:w-1/2 relative overflow-hidden ${
            isAr ? "lg:order-2" : "lg:order-1"
          }`}
        >
          {/* Background with gradient and pattern - Dark Mode */}
          <div className="absolute inset-0 bg-linear-to-br from-indigo-950 via-indigo-900 to-slate-950 dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950">
            <div className="grain-overlay" />

            {/* Geometric pattern overlay */}
            <div className="absolute inset-0 opacity-10 dark:opacity-5">
              <svg
                width="100%"
                height="100%"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="60"
                    height="60"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 60 0 L 0 0 0 60"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-indigo-400"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Floating decorative elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500 rounded-full blur-[120px] opacity-30 dark:opacity-20 animate-float" />
            <div
              className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400 rounded-full blur-[140px] opacity-20 dark:opacity-15 animate-float delay-300"
              style={{ animationDelay: "2s" }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white">
            {/* Logo/Brand */}
            <div className="animate-slide-in-left">
              <h1
                className="text-5xl xl:text-6xl font-bold tracking-tight"
                style={{ fontFamily: "'Crimson Pro', serif" }}
              >
                {isAr ? "جاهز" : "JAHEZ"}
              </h1>
              <div className="mt-2 h-1 w-20 bg-linear-to-r from-indigo-400 to-transparent" />
            </div>

            {/* Main message */}
            <div className="space-y-6 animate-slide-in-left delay-200">
              <h2
                className="text-4xl xl:text-5xl font-semibold leading-tight max-w-lg"
                style={{ fontFamily: "'Crimson Pro', serif" }}
              >
                {isAr
                  ? "مرحباً بعودتك إلى تجربة التسوق المميزة"
                  : "Welcome back to your premium shopping experience"}
              </h2>
              <p
                className="text-lg text-indigo-100 max-w-md"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {isAr
                  ? "استمتع بالوصول إلى آلاف المنتجات، عروض حصرية، وخدمة استثنائية."
                  : "Access thousands of products, exclusive deals, and exceptional service at your fingertips."}
              </p>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-8 animate-slide-in-left delay-300">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span
                  className="text-sm text-indigo-100"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {isAr ? "آمن وموثوق" : "Secure & Trusted"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span
                  className="text-sm text-indigo-100"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {isAr ? "خدمة 24/7" : "24/7 Support"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Sign In Form */}
        <div
          className={`w-full lg:w-1/2 relative flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950 ${
            isAr ? "lg:order-1" : "lg:order-2"
          }`}
        >
          {/* Subtle background accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-[200px] opacity-5 dark:opacity-10" />

          <div
            className={`w-full max-w-md relative z-10 ${isAr ? "rtl" : "ltr"}`}
          >
            {/* Mobile logo (shown only on mobile) */}
            <div className="lg:hidden mb-8 animate-fade-in-up">
              <h1
                className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white"
                style={{ fontFamily: "'Crimson Pro', serif" }}
              >
                {isAr ? "جاهز" : "JAHEZ"}
              </h1>
              <div className="mt-2 h-1 w-16 bg-linear-to-r from-indigo-600 dark:from-indigo-400 to-transparent" />
            </div>

            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none bg-transparent border-none",
                  headerTitle: `${isAr ? "text-right" : "text-left"} !text-slate-900 dark:!text-white`,
                  headerSubtitle: `${isAr ? "text-right" : "text-left"} !text-slate-600 dark:!text-slate-400`,
                  socialButtonsBlockButton:
                    "!rounded-xl !border !border-slate-300 dark:!border-slate-700 !bg-white dark:!bg-slate-800 hover:!bg-slate-50 dark:hover:!bg-slate-750 !transition-all !duration-200 !text-slate-900 dark:!text-white hover:!border-indigo-500 dark:hover:!border-indigo-400",
                  formFieldInput:
                    "!rounded-xl !border-slate-300 dark:!border-slate-700 !bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-white placeholder:!text-slate-500 dark:placeholder:!text-slate-400 focus:!border-indigo-600 dark:focus:!border-indigo-400 focus:!ring-2 focus:!ring-indigo-600/20 dark:focus:!ring-indigo-400/20 !transition-all",
                  formButtonPrimary:
                    "!rounded-xl !bg-linear-to-r !from-indigo-600 !to-indigo-500 hover:!from-indigo-500 hover:!to-indigo-600 dark:!from-indigo-500 dark:!to-indigo-400 dark:hover:!from-indigo-400 dark:hover:!to-indigo-500 !transition-all !duration-300 !text-white !font-semibold !shadow-lg !shadow-indigo-600/30 dark:!shadow-indigo-500/30 hover:!shadow-indigo-600/50 dark:hover:!shadow-indigo-500/50",
                  footerActionText: "!text-slate-600 dark:!text-slate-400",
                  footerActionLink:
                    "!text-indigo-600 dark:!text-indigo-400 hover:!text-indigo-500 dark:hover:!text-indigo-300 !font-medium !transition-colors",
                  dividerLine: "!bg-slate-300 dark:!bg-slate-700",
                  dividerText: "!text-slate-500 dark:!text-slate-400",
                  formFieldLabel:
                    "!text-slate-700 dark:!text-slate-300 !font-medium",
                  identityPreviewText: "!text-slate-900 dark:!text-white",
                  identityPreviewEditButton:
                    "!text-indigo-600 dark:!text-indigo-400 hover:!text-indigo-500 dark:hover:!text-indigo-300",
                  formResendCodeLink:
                    "!text-indigo-600 dark:!text-indigo-400 hover:!text-indigo-500 dark:hover:!text-indigo-300",
                  formFieldInputShowPasswordButton:
                    "!text-slate-500 dark:!text-slate-400 hover:!text-slate-900 dark:hover:!text-white",
                  otpCodeFieldInput:
                    "!border-slate-300 dark:!border-slate-700 !bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-white focus:!border-indigo-600 dark:focus:!border-indigo-400",
                  formFieldErrorText: "!text-red-600 dark:!text-red-400",
                  alertText: "!text-slate-700 dark:!text-slate-300",
                  alert:
                    "!bg-slate-50 dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700",
                },
                variables: {
                  colorPrimary: "#4f46e5",
                  colorText: "#0f172a",
                  colorBackground: "transparent",
                  colorInputBackground: "#ffffff",
                  colorInputText: "#0f172a",
                  colorTextOnPrimaryBackground: "#ffffff",
                  borderRadius: "0.75rem",
                  fontFamily: "'DM Sans', sans-serif",
                },
                layout: {
                  socialButtonsPlacement: "bottom",
                  shimmer: false,
                },
              }}
              routing="path"
              path={`/${locale}/sign-in`}
              signUpUrl={`/${locale}/sign-up`}
              fallbackRedirectUrl={`/${locale}`}
            />
          </div>
        </div>
      </div>
    </>
  );
}
