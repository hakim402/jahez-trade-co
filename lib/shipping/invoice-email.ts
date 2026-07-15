// lib/shipping/invoice-email.ts
//
// Emails an invoice (PDF attached + HTML body) to a client or guest client.
// Reuses the same Gmail/nodemailer transport pattern as
// app/[locale]/(pages)/contact/actions.ts.

import nodemailer from "nodemailer";

function createTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
  });
}

export interface InvoiceEmailParams {
  to: string;
  clientName: string;
  invoiceNumber: string;
  totalAmount: string; // pre-formatted, e.g. "1,250.00 USD"
  trackingCode?: string | null;
  trackingUrl?: string | null;
  pdfBuffer: Buffer;
  locale?: "en" | "ar";
}

function buildInvoiceEmailHtml(params: InvoiceEmailParams): string {
  const isAr = params.locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  return `
<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${dir}">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7b57fc 0%,#2b1cff 100%);padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${isAr ? "فاتورتك جاهزة" : "Your Invoice is Ready"}</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">JAHEZ Trade Co.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0 0 16px;font-size:14px;color:#1a1a2e;">
              ${isAr ? `مرحباً ${params.clientName}،` : `Hello ${params.clientName},`}
            </p>
            <p style="margin:0 0 20px;font-size:14px;color:#4a4a58;line-height:1.6;">
              ${
                isAr
                  ? "مرفق فاتورتك بصيغة PDF. يمكنك أيضاً مراجعة التفاصيل أدناه."
                  : "Please find your invoice attached as a PDF. You can also review the summary below."
              }
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fb;border-radius:12px;overflow:hidden;margin-bottom:20px;">
              <tr style="border-bottom:1px solid #ebebef;">
                <td style="padding:11px 16px;font-size:12px;color:#888;font-weight:600;width:140px;">${isAr ? "رقم الفاتورة" : "Invoice #"}</td>
                <td style="padding:11px 16px;font-size:13px;color:#1a1a2e;font-weight:600;">${params.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding:11px 16px;font-size:12px;color:#888;font-weight:600;">${isAr ? "الإجمالي" : "Total"}</td>
                <td style="padding:11px 16px;font-size:15px;color:#7b57fc;font-weight:700;">${params.totalAmount}</td>
              </tr>
            </table>
            ${
              params.trackingCode
                ? `<div style="background:#f0edff;border-radius:12px;padding:16px;margin-bottom:20px;">
                    <p style="margin:0 0 6px;font-size:12px;color:#7b57fc;font-weight:700;">${isAr ? "تتبع شحنتك" : "Track your shipment"}</p>
                    <p style="margin:0 0 10px;font-size:13px;color:#4a4a58;">${isAr ? "رمز التتبع" : "Tracking code"}: <b>${params.trackingCode}</b></p>
                    ${
                      params.trackingUrl
                        ? `<a href="${params.trackingUrl}" style="display:inline-block;background:#7b57fc;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 18px;border-radius:8px;">${isAr ? "تتبع الآن" : "Track Now"}</a>`
                        : ""
                    }
                  </div>`
                : ""
            }
            <p style="margin:0 0 24px;font-size:13px;color:#8b8b9a;">${isAr ? "شكراً لثقتكم بنا 🙏" : "Thank you for your business 🙏"}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#fafafb;text-align:center;">
            <p style="margin:0;font-size:11px;color:#a0a0ab;">JAHEZ Trade Co. — jahez.online</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendInvoiceEmail(
  params: InvoiceEmailParams,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const transport = createTransport();
    await transport.sendMail({
      from: `"JAHEZ Trade Co." <${process.env.GMAIL_USER}>`,
      to: params.to,
      subject: `Invoice ${params.invoiceNumber} — JAHEZ Trade Co.`,
      html: buildInvoiceEmailHtml(params),
      attachments: [
        {
          filename: `${params.invoiceNumber}.pdf`,
          content: params.pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
    return { success: true };
  } catch (err: any) {
    console.error("[Invoice Email] Send failed:", err?.message ?? err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}
