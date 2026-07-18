// lib/shipping/invoice-pdf.ts
//
// Professional branded invoice PDF — bilingual (EN or AR), with logo,
// QR code for shipment tracking, product images, barcode, and notes.
//
// Arabic text support:
//   - `bidi-js` reorders Arabic text into visual LTR drawing order.
//   - PDFKit's built-in fontkit (v2.0.4) handles glyph shaping (initial/medial/final
//     forms) automatically from the NotoSansArabic font's GSUB table.
//   - arabic-reshaper is NOT used — it conflicts with fontkit's native shaping.
//
// The layout is ALWAYS left-to-right (LTR). When Arabic is selected,
// only the text content changes; the page structure remains identical.
//
// Turbopack workaround: patches fs.readFileSync for pdfkit .afm/.icc files.

import fs from "fs"
import path from "path"
import https from "https"
import http from "http"
import PDFDocument from "pdfkit"
import QRCode from "qrcode"
// eslint-disable-next-line @typescript-eslint/no-require-imports
import bidiFactory from "bidi-js"
import { generateBarcodeDataUri } from "./barcode"
import { SHIPMENT_STATUS_LABELS } from "./status-map"

const bidi = bidiFactory()

/* ── Turbopack __dirname fix ──────────────────────────────────────── */
const _origReadFileSync = fs.readFileSync
const _origExistsSync = fs.existsSync

function _findPdfkitDataDir(): string | null {
  const root = /*turbopackIgnore: true*/ process.cwd()
  const c1 = path.join(root, "node_modules", "pdfkit", "js", "data")
  if (_origExistsSync.call(fs, path.join(c1, "Helvetica.afm"))) return c1
  let dir = root
  while (true) {
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
    const c = path.join(dir, "node_modules", "pdfkit", "js", "data")
    if (_origExistsSync.call(fs, path.join(c, "Helvetica.afm"))) return c
  }
  try {
    const r = require.resolve(/*turbopackIgnore: true*/ "pdfkit")
    const c = path.join(path.dirname(r), "data")
    if (_origExistsSync.call(fs, path.join(c, "Helvetica.afm"))) return c
  } catch { /* ignore */ }
  return null
}

const _pdfkitDataDir = _findPdfkitDataDir()
let _pdfkitPatched = false
function ensurePdfkitPatched() {
  if (_pdfkitPatched || !_pdfkitDataDir) return
  _pdfkitPatched = true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(fs as any).readFileSync = function patchedReadFileSync(fp: string, ...args: any[]) {
    if (typeof fp === "string" && (fp.endsWith(".afm") || fp.endsWith(".icc"))) {
      const corrected = path.join(_pdfkitDataDir!, path.basename(fp))
      if (_origExistsSync.call(fs, corrected)) return _origReadFileSync.call(fs, corrected, ...args)
    }
    return _origReadFileSync.call(fs, fp, ...args)
  }
}

/* ── Brand colours ───────────────────────────────────────────────── */
const C = {
  primary: "#4338CA",      // indigo-700
  primaryDark: "#312E81",  // indigo-900
  primaryMid: "#4F46E5",   // indigo-600
  primaryLight: "#6366F1", // indigo-500
  primarySoft: "#E0E7FF",  // indigo-100
  primaryGhost: "#EEF2FF", // indigo-50
  gold: "#B45309",         // amber-700
  goldSoft: "#FEF3C7",
  ink: "#111827",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  white: "#FFFFFF",
  green: "#047857",
  greenLight: "#D1FAE5",
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  rowAlt: "#F7F7FD",
}

type Lang = "en" | "ar"

const L = {
  invoice:       { en: "INVOICE",           ar: "فاتورة" },
  billTo:        { en: "Bill To",           ar: "فاتورة إلى" },
  issued:        { en: "Issue Date",        ar: "تاريخ الإصدار" },
  dueDate:       { en: "Due Date",          ar: "تاريخ الاستحقاق" },
  shipment:      { en: "Shipment Details",  ar: "تفاصيل الشحنة" },
  description:   { en: "Description",       ar: "الوصف" },
  qty:           { en: "Qty",               ar: "الكمية" },
  unitPrice:     { en: "Unit Price",        ar: "سعر الوحدة" },
  total:         { en: "Total",             ar: "المجموع" },
  subtotal:      { en: "Subtotal",          ar: "المجموع الفرعي" },
  tax:           { en: "Tax",               ar: "الضريبة" },
  discount:      { en: "Discount",          ar: "الخصم" },
  totalDue:      { en: "Total Due",         ar: "المجموع المستحق" },
  notes:         { en: "Notes",             ar: "ملاحظات" },
  scanToTrack:   { en: "Scan to track",     ar: "امسح لتتبع الشحنة" },
  completed:     { en: "Completed",         ar: "مكتمل" },
  inProgress:    { en: "In Progress",       ar: "قيد التنفيذ" },
  thankYou:      { en: "Thank you for your business!", ar: "شكراً لتعاملكم معنا!" },
  generated:     { en: "This invoice was generated automatically.", ar: "تم إنشاء هذه الفاتورة تلقائياً." },
  paymentTerms:  { en: "Payment is due by the date above.", ar: "يستحق الدفع بحلول التاريخ المحدد أعلاه." },
  productImages: { en: "Product Images",    ar: "صور المنتجات" },
  invoiceNo:     { en: "Invoice No.",       ar: "رقم الفاتورة" },
  status:        { en: "Status",            ar: "الحالة" },
  route:         { en: "Route",             ar: "المسار" },
  carrier:       { en: "Carrier",           ar: "شركة الشحن" },
}

function t(key: keyof typeof L, lang: Lang) { return L[key][lang] }
const otherLang = (l: Lang): Lang => (l === "en" ? "ar" : "en")

/**
 * Prepare Arabic (or mixed) text for PDFKit:
 *   1. Reorder the string into visual (left-to-right-drawing) order using bidi-js.
 *   2. PDFKit's fontkit then applies GSUB shaping (initial/medial/final forms) automatically.
 * Latin letters, digits, and punctuation pass through untouched.
 */
function toVisual(text: string, lang: Lang): string {
  if (lang !== "ar" || !text) return text
  try {
    const result = bidi.getEmbeddingLevels(text)
    return bidi.getReorderedString(text, result)
  } catch { return text }
}

/* ── Types ────────────────────────────────────────────────────────── */
export interface InvoicePdfItem {
  description: string
  descriptionAr?: string | null
  quantity: number
  unitPrice: number
  lineTotal?: number
}

export interface InvoicePdfData {
  invoiceNumber: string
  issuedAt: Date
  dueDate?: Date | null
  currency: string
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  clientCompany?: string | null
  items: InvoicePdfItem[]
  subtotal: number
  taxAmount: number
  discount: number
  totalAmount: number
  notes?: string | null
  trackingCode?: string | null
  originCountry?: string | null
  destinationCountry?: string | null
  freightType?: string | null
  carrierName?: string | null
  carrierTrackingNumber?: string | null
  shipmentStatus?: string | null
  shipmentImages?: string[]
  trackingUrl?: string | null
  companyName?: string
  companyEmail?: string
  companyPhone?: string
  lang?: Lang
}

/* ── Helpers ──────────────────────────────────────────────────────── */
function money(n: number | null | undefined, cur: string) {
  const safe = typeof n === "number" && Number.isFinite(n) ? n : 0
  return `${safe.toFixed(2)} ${cur}`
}

function isCompleted(s?: string | null) {
  return s === "DELIVERED" || s === "CANCELED" || s === "RETURNED"
}

function formatDate(d: Date | undefined | null): string {
  if (!d) return ""
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

async function resolveImage(urlOrPath: string): Promise<Buffer | null> {
  try {
    if (urlOrPath.startsWith("/uploads/") || urlOrPath.startsWith("uploads/")) {
      const p = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", urlOrPath.replace(/^\//, ""))
      if (_origExistsSync.call(fs, p)) return _origReadFileSync.call(fs, p) as Buffer
    }
    if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
      return await new Promise<Buffer>((resolve, reject) => {
        const mod = urlOrPath.startsWith("https") ? https : http
        mod.get(urlOrPath, (res) => {
          const ch: Buffer[] = []; res.on("data", (c: Buffer) => ch.push(c))
          res.on("end", () => resolve(Buffer.concat(ch))); res.on("error", reject)
        }).on("error", reject)
      })
    }
    if (_origExistsSync.call(fs, urlOrPath)) return _origReadFileSync.call(fs, urlOrPath) as Buffer
  } catch { /* non-fatal */ }
  return null
}

/** Uppercase eyebrow label with a touch of tracking. */
function eyebrow(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  lang: Lang,
  fontFn: (bold?: boolean) => string,
  x: number,
  y: number,
  w: number,
  align: "left" | "right" | "center",
) {
  doc.font(fontFn(true)).fontSize(7.5).fillColor(C.textTertiary)
    .text(toVisual(text.toUpperCase(), lang), x, y, {
      width: w,
      align,
      characterSpacing: 0.6,
    })
}

/* ── Main ─────────────────────────────────────────────────────────── */
export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  ensurePdfkitPatched()
  const lang: Lang = data.lang ?? "en"
  const doc = new PDFDocument({ size: "A4", margin: 0 })
  const chunks: Buffer[] = []
  doc.on("data", (c: Buffer) => chunks.push(c))
  const done = new Promise<Buffer>((resolve) => { doc.on("end", () => resolve(Buffer.concat(chunks))) })

  const W = doc.page.width
  const H = doc.page.height
  const ML = 42
  const MR = 42
  const PW = W - ML - MR
  // Layout is ALWAYS LTR – no RTL mirroring.
  const isRTL = false

  // ── Register Arabic fonts ──────────────────────────────────────
  const fontDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "fonts")
  const arabicRegPath = path.join(fontDir, "NotoSansArabic-Regular.ttf")
  const arabicBoldPath = path.join(fontDir, "NotoSansArabic-SemiBold.ttf")

  let hasArabic = false
  if (_origExistsSync.call(fs, arabicRegPath) && _origExistsSync.call(fs, arabicBoldPath)) {
    try {
      doc.registerFont("ArabicFont", arabicRegPath)
      doc.registerFont("ArabicFont-Bold", arabicBoldPath)
      hasArabic = true
    } catch (err) {
      console.error("[InvoicePDF] Failed to register Arabic fonts:", err)
    }
  } else {
    console.warn("[InvoicePDF] Arabic font files not found at:", fontDir)
  }

  const f = (bold = false) => {
    if (lang === "ar" && hasArabic) return bold ? "ArabicFont-Bold" : "ArabicFont"
    return bold ? "Helvetica-Bold" : "Helvetica"
  }

  // LTR alignments
  const leftAlign = "left" as const
  const rightAlign = "right" as const
  const centerAlign = "center" as const

  // Load logo
  let logoBuf: Buffer | null = null
  const logoPath = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "logo", "jahez.jpg")
  if (_origExistsSync.call(fs, logoPath)) {
    try { logoBuf = _origReadFileSync.call(fs, logoPath) as Buffer } catch { /* ignore */ }
  }

  // ═══════════════════════════════════════════════════════════════════
  // HEADER — deep indigo band, logo on left, title on right
  // ═══════════════════════════════════════════════════════════════════
  const headerH = 108
  doc.rect(0, 0, W, headerH).fill(C.primaryDark)
  // Accent circle
  doc.save()
  doc.rect(0, 0, W, headerH - 16).clip()
  doc.circle(W, headerH * 0.1, 140).fillOpacity(0.55).fill(C.primaryMid).fillOpacity(1)
  doc.restore()
  doc.rect(0, 0, W, headerH - 16).fillOpacity(0.9).fill(C.primary).fillOpacity(1)
  doc.rect(0, headerH - 16, W, 12).fill(C.primaryDark)
  doc.rect(0, headerH - 4, W, 4).fill(C.gold)

  // Logo + company name (left)
  const logoBadge = 46
  const nameGap = 10
  const maxNameW = 230
  const logoSide = ML
  const nameBoxX = logoSide + logoBadge + nameGap
  const nameBoxW = Math.min(maxNameW, ML + PW - nameBoxX - 4)

  doc.roundedRect(logoSide - 6, 18, logoBadge, logoBadge, 10).fill(C.white)
  if (logoBuf) {
    try {
      doc.image(logoBuf, logoSide, 20, { height: 42, width: 42, cover: [42, 42] })
    } catch { /* skip */ }
  }

  doc.fillColor(C.white).fontSize(16).font(f(true))
    .text(toVisual(data.companyName ?? "JAHEZ TRADE CO.", lang), nameBoxX, 22, { width: nameBoxW, align: leftAlign })

  const contactLine = [data.companyEmail, data.companyPhone].filter(Boolean).join("   •   ")
  if (contactLine) {
    doc.fontSize(8).font(f()).fillColor(C.primarySoft)
      .text(contactLine, nameBoxX, 44, { width: nameBoxW, align: leftAlign })
  }

  // Invoice title (right)
  const titleSide = ML + PW
  doc.fillColor(C.white).fontSize(26).font(f(true))
    .text(toVisual(t("invoice", lang), lang), titleSide, 18, { align: rightAlign, width: 220, characterSpacing: 1 })

  const pillW = 190
  const pillX = ML + PW - pillW
  doc.roundedRect(pillX, 50, pillW, 20, 10).fillOpacity(0.16).fill(C.white).fillOpacity(1)
  doc.fontSize(9).fillColor(C.white).font(f(true))
    .text(`${t("invoiceNo", lang)}: ${data.invoiceNumber}`, pillX, 56, { align: centerAlign, width: pillW })

  doc.fontSize(8).fillColor(C.primarySoft)
    .text(t("invoice", otherLang(lang)), titleSide, 82, { align: rightAlign, width: 220 })

  let Y = headerH + 22

  // ═══════════════════════════════════════════════════════════════════
  // BILL TO + META — two-column info block
  // ═══════════════════════════════════════════════════════════════════
  const colW = PW / 2 - 10
  const col1X = ML           // bill to
  const col2X = ML + colW + 20 // meta

  const infoCardH = 92
  doc.roundedRect(ML, Y, PW, infoCardH, 8).fill(C.borderLight)
  const dividerX = col2X - 10
  doc.moveTo(dividerX, Y + 14).lineTo(dividerX, Y + infoCardH - 14).strokeColor(C.border).lineWidth(1).stroke()

  const padY = Y + 16

  // Bill To section
  eyebrow(doc, t("billTo", lang), lang, f, col1X + 16, padY, colW - 16, leftAlign)
  doc.fontSize(13).fillColor(C.ink).font(f(true))
    .text(toVisual(data.clientName, lang), col1X + 16, padY + 14, { width: colW - 16, align: leftAlign })

  let detailY = padY + 34
  doc.font(f()).fontSize(9).fillColor(C.textSecondary)
  if (data.clientCompany) {
    doc.text(toVisual(data.clientCompany, lang), col1X + 16, detailY, { width: colW - 16, align: leftAlign }); detailY += 13
  }
  if (data.clientEmail) {
    doc.text(data.clientEmail, col1X + 16, detailY, { width: colW - 16, align: leftAlign }); detailY += 13
  }
  if (data.clientPhone) {
    doc.text(data.clientPhone, col1X + 16, detailY, { width: colW - 16, align: leftAlign }); detailY += 13
  }

  // Meta section
  eyebrow(doc, t("issued", lang), lang, f, col2X + 4, padY, colW / 2 - 8, leftAlign)
  doc.fontSize(11.5).fillColor(C.ink).font(f(true))
    .text(formatDate(data.issuedAt), col2X + 4, padY + 14, { width: colW / 2 - 8, align: leftAlign })

  if (data.dueDate) {
    const dueX = col2X + colW / 2 + 4
    eyebrow(doc, t("dueDate", lang), lang, f, dueX, padY, colW / 2 - 8, leftAlign)
    doc.fontSize(11.5).fillColor(C.primaryMid).font(f(true))
      .text(formatDate(data.dueDate), dueX, padY + 14, { width: colW / 2 - 8, align: leftAlign })
  }

  Y = Y + infoCardH + 20

  // ═══════════════════════════════════════════════════════════════════
  // SHIPMENT INFO — card with status badge and QR on right
  // ═══════════════════════════════════════════════════════════════════
  if (data.trackingCode) {
    const boxH = data.shipmentStatus ? 82 : 70
    doc.roundedRect(ML, Y, PW, boxH, 8).fill(C.primaryGhost)
    doc.roundedRect(ML, Y, PW, boxH, 8).lineWidth(1).strokeColor(C.primarySoft).stroke()

    // Indigo accent bar (left)
    doc.roundedRect(ML, Y + 10, 4, boxH - 20, 2).fill(C.primaryMid)

    const infoX = ML + 18
    const infoW = PW - 112 // leave room for QR

    eyebrow(doc, t("shipment", lang), lang, f, infoX, Y + 12, infoW, leftAlign)

    doc.fillColor(C.primary).fontSize(15).font(f(true))
      .text(data.trackingCode, infoX, Y + 25, { width: infoW, align: leftAlign })

    // Route line
    const routeParts: string[] = []
    if (data.originCountry && data.destinationCountry) {
      routeParts.push(`${toVisual(data.originCountry, lang)}  ->  ${toVisual(data.destinationCountry, lang)}`)
    }
    if (data.freightType) routeParts.push(toVisual(data.freightType, lang))
    if (data.carrierName) routeParts.push(toVisual(data.carrierName, lang))

    if (routeParts.length > 0) {
      doc.font(f()).fontSize(8.5).fillColor(C.textSecondary)
        .text(routeParts.join("   •   "), infoX, Y + 45, { width: infoW, align: leftAlign })
    }

    // Status badge (left, under route)
    if (data.shipmentStatus) {
      const si = SHIPMENT_STATUS_LABELS[data.shipmentStatus as keyof typeof SHIPMENT_STATUS_LABELS]
      const statusLabel = si?.[lang] ?? data.shipmentStatus
      const shapedLabel = toVisual(statusLabel, lang)
      const isComp = isCompleted(data.shipmentStatus)
      const badgeBg = isComp ? C.greenLight : C.primarySoft
      const badgeColor = isComp ? C.green : C.primary

      const badgeFontSize = 8
      const badgePadX = 12
      const dotR = 2.5
      const dotGap = 6
      const badgeH = 18
      doc.font(f(true)).fontSize(badgeFontSize)
      const labelW = doc.widthOfString(shapedLabel)
      const badgeW = Math.min(infoW, Math.max(90, labelW + badgePadX * 2 + dotR * 2 + dotGap))
      const badgeX = infoX
      const badgeY = Y + boxH - 24

      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2).fill(badgeBg)

      const dotCx = badgeX + badgePadX + dotR
      doc.circle(dotCx, badgeY + badgeH / 2, dotR).fill(badgeColor)

      const textX = badgeX + badgePadX + dotR * 2 + dotGap
      const textW = badgeW - badgePadX * 2 - dotR * 2 - dotGap
      doc.fillColor(badgeColor).font(f(true)).fontSize(badgeFontSize)
        .text(shapedLabel, textX, badgeY + (badgeH - badgeFontSize) / 2 - 1, {
          width: textW,
          align: leftAlign,
        })
    }

    // QR code (right side)
    const qrUrl = data.trackingUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://jahez.online"}/en/track/${data.trackingCode}`
    try {
      const qrBuf = await QRCode.toBuffer(qrUrl, {
        width: 58,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: C.primaryDark, light: "#FFFFFF" },
      })
      const qrX = ML + PW - 74
      const qrY = Y + (boxH - 58) / 2 - 4
      doc.roundedRect(qrX - 4, qrY - 4, 66, 66, 6).fill(C.white)
      doc.image(qrBuf, qrX, qrY, { width: 58, height: 58 })
      doc.fontSize(6).fillColor(C.textTertiary).font(f())
        .text(toVisual(t("scanToTrack", lang), lang), qrX - 10, qrY + 62, { width: 78, align: centerAlign })
    } catch { /* non-fatal */ }

    Y += boxH + 18
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRODUCT IMAGES — thumbnails row (left-aligned)
  // ═══════════════════════════════════════════════════════════════════
  if (data.shipmentImages && data.shipmentImages.length > 0) {
    eyebrow(doc, t("productImages", lang), lang, f, ML, Y, PW, leftAlign)

    const imgY = Y + 13
    const imgSz = 46
    const imgGap = 7
    const maxImgs = Math.min(data.shipmentImages.length, 6)
    const bufs = await Promise.all(data.shipmentImages.slice(0, maxImgs).map(resolveImage))

    let imgX = ML
    for (const buf of bufs) {
      doc.roundedRect(imgX, imgY, imgSz, imgSz, 6).fill(C.borderLight)
      doc.roundedRect(imgX, imgY, imgSz, imgSz, 6).lineWidth(1).strokeColor(C.border).stroke()
      if (buf) {
        try {
          doc.image(buf, imgX + 1.5, imgY + 1.5, { width: imgSz - 3, height: imgSz - 3, cover: [imgSz - 3, imgSz - 3] })
        } catch { /* skip */ }
      }
      imgX += imgSz + imgGap
    }
    Y = imgY + imgSz + 20
  }

  // ═══════════════════════════════════════════════════════════════════
  // ITEMS TABLE — columns: Description, Qty, Unit Price, Total
  // ═══════════════════════════════════════════════════════════════════
  const tableTop = Y

  const descW = 250
  const qtyW = 45
  const priceW = 80
  const totalW = 85
  const padX = 12

  const col = {
    desc:  ML + padX,
    qty:   ML + padX + descW,
    price: ML + padX + descW + qtyW,
    total: ML + padX + descW + qtyW + priceW,
  }

  const colAligns = {
    desc: leftAlign,
    qty: centerAlign,
    price: rightAlign,
    total: rightAlign,
  }

  // Table header
  doc.roundedRect(ML, tableTop, PW, 30, 4).fill(C.primaryDark)
  doc.rect(ML, tableTop + 15, PW, 15).fill(C.primaryDark)
  doc.fillColor(C.white).fontSize(8.5).font(f(true))

  const headers = [
    { key: t("description", lang), x: col.desc, w: descW, align: colAligns.desc },
    { key: t("qty", lang), x: col.qty, w: qtyW, align: colAligns.qty },
    { key: t("unitPrice", lang), x: col.price, w: priceW, align: colAligns.price },
    { key: t("total", lang), x: col.total, w: totalW, align: colAligns.total },
  ]

  headers.forEach((h) => {
    doc.text(toVisual(h.key.toUpperCase(), lang), h.x, tableTop + 10, {
      width: h.w,
      align: h.align,
      characterSpacing: 0.4,
    })
  })

  // Rows
  let rowY = tableTop + 30
  data.items.forEach((item, idx) => {
    const rowH = 28
    if (idx % 2 === 1) {
      doc.rect(ML, rowY, PW, rowH).fill(C.rowAlt)
    }
    doc.moveTo(ML + padX, rowY + rowH).lineTo(ML + PW - padX, rowY + rowH)
      .strokeColor(C.border).lineWidth(0.5).stroke()

    const desc = lang === "ar" && item.descriptionAr ? item.descriptionAr : item.description
    const lineTotal = item.lineTotal ?? item.quantity * item.unitPrice

    doc.font(f()).fontSize(9.5).fillColor(C.textPrimary)

    const rowData = [
      { val: desc, x: col.desc, w: descW, align: colAligns.desc, bold: false, color: C.textPrimary },
      { val: String(item.quantity), x: col.qty, w: qtyW, align: colAligns.qty, bold: false, color: C.textPrimary },
      { val: money(item.unitPrice, data.currency), x: col.price, w: priceW, align: colAligns.price, bold: false, color: C.textPrimary },
      { val: money(lineTotal, data.currency), x: col.total, w: totalW, align: colAligns.total, bold: true, color: C.primaryDark },
    ]

    rowData.forEach((cell) => {
      doc.font(cell.bold ? f(true) : f()).fillColor(cell.color)
        .text(toVisual(cell.val, lang), cell.x, rowY + 8, { width: cell.w, align: cell.align })
    })
    rowY += rowH
  })

  doc.roundedRect(ML, tableTop, PW, rowY - tableTop, 4)
    .lineWidth(1).strokeColor(C.border).stroke()

  Y = rowY + 20

  // ═══════════════════════════════════════════════════════════════════
  // TOTALS — right-aligned summary block
  // ═══════════════════════════════════════════════════════════════════
  const sumW = 240
  const sumX = ML + PW - sumW
  const sumH = 96

  doc.roundedRect(sumX, Y, sumW, sumH, 8).fill(C.borderLight)
  doc.roundedRect(sumX, Y, sumW, sumH, 8).lineWidth(1).strokeColor(C.border).stroke()

  const rowX = sumX + 16
  const rowW = sumW - 32

  let sumY = Y + 14
  const printRow = (label: string, value: string, bold = false) => {
    doc.font(bold ? f(true) : f()).fontSize(bold ? 11.5 : 9.5)
      .fillColor(bold ? C.ink : C.textSecondary)
      .text(toVisual(label, lang), rowX, sumY, { width: rowW, align: leftAlign })
    doc.fillColor(bold ? C.primaryDark : C.textPrimary)
      .text(value, rowX, sumY, { width: rowW, align: rightAlign })
    sumY += bold ? 22 : 17
  }

  printRow(t("subtotal", lang), money(data.subtotal, data.currency))
  if (data.taxAmount) printRow(t("tax", lang), money(data.taxAmount, data.currency))
  if (data.discount) printRow(t("discount", lang), `-${money(data.discount, data.currency)}`)

  sumY += 2
  doc.moveTo(sumX + 16, sumY - 2).lineTo(sumX + sumW - 16, sumY - 2)
    .strokeColor(C.primaryMid).lineWidth(1).stroke()
  sumY += 8

  const totalStripH = 26
  doc.roundedRect(sumX + 10, sumY - 5, sumW - 20, totalStripH, 6).fill(C.primaryDark)
  doc.font(f(true)).fontSize(11).fillColor(C.primarySoft)
    .text(toVisual(t("totalDue", lang), lang), rowX, sumY + 2, { width: rowW, align: leftAlign })
  doc.font(f(true)).fontSize(13).fillColor(C.white)
    .text(money(data.totalAmount, data.currency), rowX, sumY + 1, { width: rowW, align: rightAlign })

  Y = Y + sumH + 18

  // ═══════════════════════════════════════════════════════════════════
  // NOTES — subtle card
  // ═══════════════════════════════════════════════════════════════════
  if (data.notes) {
    const notesH = 48
    doc.roundedRect(ML, Y, PW, notesH, 6).fill(C.borderLight)
    doc.roundedRect(ML, Y, 4, notesH, 2).fill(C.gold)
    eyebrow(doc, t("notes", lang), lang, f, ML + 16, Y + 9, PW - 30, leftAlign)
    doc.font(f()).fontSize(9.5).fillColor(C.textPrimary)
      .text(toVisual(data.notes, lang), ML + 16, Y + 23, { width: PW - 30, align: leftAlign })
    Y += notesH + 16
  }

  // ═══════════════════════════════════════════════════════════════════
  // FOOTER — barcode (left), thank you (center/right)
  // ═══════════════════════════════════════════════════════════════════
  const footerH = 74
  const footerY = H - footerH
  doc.moveTo(ML, footerY).lineTo(ML + PW, footerY).strokeColor(C.border).lineWidth(1).stroke()
  doc.rect(0, H - 4, W, 4).fill(C.primaryDark)

  // Barcode (left)
  if (data.trackingCode) {
    try {
      const barcodeUri = await generateBarcodeDataUri(data.trackingCode)
      const base64 = barcodeUri.split(",")[1]
      const buf = Buffer.from(base64, "base64")
      doc.image(buf, ML, footerY + 12, { width: 130 })
    } catch { /* non-fatal */ }
  }

  // Thank you text (center)
  const ftTextX = data.trackingCode ? ML + 150 : ML
  const ftTextW = data.trackingCode ? PW - 150 : PW
  const ftAlign = centerAlign

  doc.fontSize(11).fillColor(C.primary).font(f(true))
    .text(toVisual(t("thankYou", lang), lang), ftTextX, footerY + 14, { width: ftTextW, align: ftAlign })
  doc.fontSize(7.5).fillColor(C.textTertiary).font(f())
    .text(toVisual(t("generated", lang), lang), ftTextX, footerY + 32, { width: ftTextW, align: ftAlign })
  doc.fontSize(7.5).fillColor(C.textTertiary)
    .text(toVisual(t("paymentTerms", lang), lang), ftTextX, footerY + 46, { width: ftTextW, align: ftAlign })

  doc.end()
  return done
}