"use client";

// app/[locale]/(auth)/sign-in/[[...sign-in]]/SignInClient.tsx

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { motion } from "motion/react";

interface SignInClientProps {
  locale: string;
  isAr: boolean;
}

export function SignInClient({ locale, isAr }: SignInClientProps) {
  // Business translations
  const content = {
    en: {
      brand: "JAHEZ",
      tagline: "China Sourcing & Global Trade",
      welcome: "Welcome Back",
      subtitle: "Access your sourcing dashboard, track shipments, and manage imports from China to the USA, UAE, Dubai & Yemen.",
      features: [
        { label: "Verified Suppliers", icon: "✓" },
        { label: "Quality Control", icon: "✓" },
        { label: "Global Shipping", icon: "✓" },
      ],
      trustText: "Trusted by businesses across 4 continents",
      noAccount: "Don't have an account?",
      signUp: "Sign Up",
    },
    ar: {
      brand: "جاهز",
      tagline: "التوريد من الصين والتجارة العالمية",
      welcome: "مرحباً بعودتك",
      subtitle: "لوحة تحكم التوريد، تتبع الشحنات، وإدارة الواردات من الصين إلى الولايات المتحدة والإمارات ودبي واليمن.",
      features: [
        { label: "موردون معتمدون", icon: "✓" },
        { label: "مراقبة الجودة", icon: "✓" },
        { label: "شحن عالمي", icon: "✓" },
      ],
      trustText: "موثوق من قبل شركات في 4 قارات",
      noAccount: "ليس لديك حساب؟",
      signUp: "إنشاء حساب",
    },
  };

  const t = content[isAr ? "ar" : "en"];
  const isRtl = isAr;

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap");

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

        .grain-overlay {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.4;
        }

        .feature-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          font-weight: 700;
          font-size: 14px;
        }

        .dark .feature-icon {
          background: rgba(129, 140, 248, 0.2);
          color: #a5b4fc;
        }
      `}</style>

      {/* ─── SPLIT SCREEN LAYOUT ────────────────── */}
      <div className="relative flex min-h-[calc(100vh-80px)]">
        {/* ─── LEFT PANEL: BRAND & TRADE ────────── */}
        <div
          className={`hidden lg:flex lg:w-1/2 relative overflow-hidden ${
            isRtl ? "lg:order-2" : "lg:order-1"
          }`}
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-linear-to-br from-indigo-950 via-indigo-900 to-slate-950 dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950">
            <div className="grain-overlay" />

            {/* Global Trade Pattern - Grid with dots representing global connectivity */}
            <div className="absolute inset-0 opacity-10 dark:opacity-5">
              <svg
                width="100%"
                height="100%"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="tradeGrid"
                    width="80"
                    height="80"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="40" cy="40" r="1.5" fill="white" opacity="0.3" />
                    <path
                      d="M 0 40 L 80 40 M 40 0 L 40 80"
                      stroke="white"
                      strokeWidth="0.3"
                      opacity="0.1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#tradeGrid)" />
              </svg>
            </div>

            {/* Floating Globe / Trade Abstract */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[150px] opacity-20 dark:opacity-15 animate-float" />
            <div
              className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-400 rounded-full blur-[120px] opacity-15 dark:opacity-10 animate-float delay-300"
              style={{ animationDelay: "2s" }}
            />

            {/* Shipping Container Icons (Decorative) */}
            <div className="absolute bottom-20 left-10 flex gap-2 opacity-20">
              <div className="w-8 h-12 bg-indigo-400/30 rounded-sm border border-indigo-400/20" />
              <div className="w-8 h-14 bg-indigo-400/20 rounded-sm border border-indigo-400/20 mt-2" />
              <div className="w-8 h-10 bg-indigo-400/30 rounded-sm border border-indigo-400/20" />
            </div>

            <div className="absolute top-20 right-10 flex gap-2 opacity-10">
              <div className="w-6 h-10 bg-white/20 rounded-sm border border-white/10" />
              <div className="w-6 h-12 bg-white/10 rounded-sm border border-white/10 mt-2" />
              <div className="w-6 h-8 bg-white/20 rounded-sm border border-white/10" />
            </div>
          </div>

          {/* ─── LEFT CONTENT ────────────────────── */}
          <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-1"
            >
              <h1
                className="text-5xl xl:text-6xl font-bold tracking-tight"
                style={{ fontFamily: "'Crimson Pro', serif" }}
              >
                {t.brand}
              </h1>
              <p
                className="text-indigo-300 text-sm tracking-wider uppercase"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {t.tagline}
              </p>
              <div className="mt-2 h-1 w-20 bg-linear-to-r from-indigo-400 to-transparent" />
            </motion.div>

            {/* Main Message */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="space-y-4"
            >
              <h2
                className="text-4xl xl:text-5xl font-semibold leading-tight max-w-lg"
                style={{ fontFamily: "'Crimson Pro', serif" }}
              >
                {t.welcome}
              </h2>
              <p
                className="text-base text-indigo-100 max-w-md leading-relaxed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {t.subtitle}
              </p>

              {/* Feature List */}
              <div className="flex flex-col gap-2 pt-4">
                {t.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="feature-icon">{feature.icon}</span>
                    <span
                      className="text-sm text-indigo-100"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Trust Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col gap-3"
            >
              <p
                className="text-xs text-indigo-300 tracking-wider uppercase"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {t.trustText}
              </p>
              {/* Country flags */}
              <div className="flex gap-4 items-center">
                {["CN", "US", "AE", "YE"].map((code) => (
                  <span
                    key={code}
                    className="text-2xl opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <span className={`fi fi-${code.toLowerCase()}`} />
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─── RIGHT PANEL: SIGN IN FORM ────────── */}
        <div
          className={`w-full lg:w-1/2 relative flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950 ${
            isRtl ? "lg:order-1" : "lg:order-2"
          }`}
        >
          {/* Subtle background accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-[200px] opacity-5 dark:opacity-10" />

          <div
            className={`w-full max-w-md relative z-10 ${isRtl ? "rtl" : "ltr"}`}
          >
            {/* Mobile logo (shown only on mobile) */}
            <div className="lg:hidden mb-8 text-center">
              <h1
                className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
                style={{ fontFamily: "'Crimson Pro', serif" }}
              >
                {t.brand}
              </h1>
              <p
                className="text-xs text-indigo-600 dark:text-indigo-400 tracking-wider uppercase mt-1"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {t.tagline}
              </p>
              <div className="mt-2 h-0.5 w-12 mx-auto bg-linear-to-r from-indigo-600 to-transparent" />
            </div>

            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none bg-transparent border-none p-0",
                  headerTitle: `${isRtl ? "text-right" : "text-left"} !text-2xl !font-bold !text-slate-900 dark:!text-white`,
                  headerSubtitle: `${isRtl ? "text-right" : "text-left"} !text-slate-600 dark:!text-slate-400 !text-sm !mt-1`,
                  socialButtonsBlockButton:
                    "!rounded-xl !border !border-slate-300 dark:!border-slate-700 !bg-white dark:!bg-slate-800 hover:!bg-slate-50 dark:hover:!bg-slate-750 !transition-all !duration-200 !text-slate-900 dark:!text-white hover:!border-indigo-500 dark:hover:!border-indigo-400 !font-medium",
                  socialButtonsBlockButtonText: "!text-sm",
                  formFieldInput:
                    "!rounded-xl !border-slate-300 dark:!border-slate-700 !bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-white placeholder:!text-slate-500 dark:placeholder:!text-slate-400 focus:!border-indigo-600 dark:focus:!border-indigo-400 focus:!ring-2 focus:!ring-indigo-600/20 dark:focus:!ring-indigo-400/20 !transition-all !h-11",
                  formButtonPrimary:
                    "!rounded-xl !bg-indigo-600 hover:!bg-indigo-500 dark:!bg-indigo-500 dark:hover:!bg-indigo-400 !transition-all !duration-300 !text-white !font-semibold !shadow-lg !shadow-indigo-600/25 dark:!shadow-indigo-500/25 hover:!shadow-indigo-600/40 dark:hover:!shadow-indigo-500/40 !h-11",
                  footerActionText: "!text-slate-600 dark:!text-slate-400 !text-sm",
                  footerActionLink:
                    "!text-indigo-600 dark:!text-indigo-400 hover:!text-indigo-500 dark:hover:!text-indigo-300 !font-medium !transition-colors !text-sm",
                  dividerLine: "!bg-slate-300 dark:!bg-slate-700",
                  dividerText: "!text-slate-500 dark:!text-slate-400 !text-xs !uppercase !tracking-wider",
                  formFieldLabel:
                    "!text-slate-700 dark:!text-slate-300 !font-medium !text-sm",
                  identityPreviewText: "!text-slate-900 dark:!text-white",
                  identityPreviewEditButton:
                    "!text-indigo-600 dark:!text-indigo-400 hover:!text-indigo-500 dark:hover:!text-indigo-300",
                  formResendCodeLink:
                    "!text-indigo-600 dark:!text-indigo-400 hover:!text-indigo-500 dark:hover:!text-indigo-300 !font-medium",
                  formFieldInputShowPasswordButton:
                    "!text-slate-500 dark:!text-slate-400 hover:!text-slate-900 dark:hover:!text-white",
                  otpCodeFieldInput:
                    "!border-slate-300 dark:!border-slate-700 !bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-white focus:!border-indigo-600 dark:focus:!border-indigo-400 !rounded-xl !h-12",
                  formFieldErrorText: "!text-red-600 dark:!text-red-400 !text-sm !mt-1",
                  alertText: "!text-slate-700 dark:!text-slate-300",
                  alert:
                    "!bg-slate-50 dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !rounded-xl",
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