// ═══════════════════════════════════════════════════════════════════════════
// FILE 2: app/[locale]/(pages)/products/_components/request-product-button.tsx
// ═══════════════════════════════════════════════════════════════════════════
"use client"

import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { motion } from "motion/react"
import { ShoppingCart, LogIn, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RequestProductButtonProps {
  productId: string
  productName: string
  isAr: boolean
}

export function RequestProductButton({ productId, productName, isAr }: RequestProductButtonProps) {
  const { isSignedIn } = useAuth()
  const router         = useRouter()
  const params         = useParams()
  const locale         = params.locale as string

  const handleClick = () => {
    if (!isSignedIn) {
      // Redirect to sign-in with callbackUrl back to this product
      router.push(`/${locale}/sign-in?redirect_url=/${locale}/products/${productId}`)
      return
    }
    // Pre-fill the new request form with the product ID
    router.push(`/${locale}/dashboard/requests/new?productId=${productId}&source=trending`)
  }

  return (
    <div className="flex flex-col gap-3">
      <motion.div whileTap={{ scale: 0.97 }}>
        <Button
          onClick={handleClick}
          size="lg"
          className="w-full h-12 bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 rounded-xl text-sm font-semibold gap-2 shadow-md shadow-[#7b57fc]/20 transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          {isAr ? "اطلب هذا المنتج" : "Request This Product"}
          <ArrowRight className="w-4 h-4 ml-auto" />
        </Button>
      </motion.div>

      {!isSignedIn && (
        <p className="text-center text-xs text-muted-foreground">
          {isAr ? (
            <>يلزم <span className="text-[#7b57fc] cursor-pointer hover:underline" onClick={handleClick}>تسجيل الدخول</span> لإرسال الطلب</>
          ) : (
            <><span className="text-[#7b57fc] cursor-pointer hover:underline" onClick={handleClick}>Sign in</span> required to submit a request</>
          )}
        </p>
      )}
    </div>
  )
}