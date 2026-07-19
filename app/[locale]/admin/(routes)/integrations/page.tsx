// app/[locale]/admin/(routes)/integrations/page.tsx

import type { Metadata } from "next";
import { getTrack17Settings, getTwilioSettings, getEmailSettings } from "./actions";
import { IntegrationsClient } from "./_components/IntegrationsClient";
import { AdminHeader } from "../../_components/AdminHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Integrations | Admin" };

export default async function AdminIntegrationsPage() {
  const [track17Res, twilioRes, emailRes] = await Promise.all([
    getTrack17Settings(),
    getTwilioSettings(),
    getEmailSettings(),
  ]);

  const track17 = track17Res.success
    ? track17Res.data
    : { apiKeyMasked: "", hasApiKey: false, webhookSecretMasked: "", hasWebhookSecret: false, enabled: false };

  const twilio = twilioRes.success
    ? twilioRes.data
    : { accountSidMasked: "", hasAccountSid: false, authTokenMasked: "", hasAuthToken: false, whatsappFrom: "", hasWhatsappFrom: false, enabled: false };

  const email = emailRes.success
    ? emailRes.data
    : { provider: "none", host: "", port: "", user: "", passMasked: "", hasPass: false, fromName: "", fromAddress: "", enabled: false };

  const loadErrors = [
    !track17Res.success && track17Res.error,
    !twilioRes.success && twilioRes.error,
    !emailRes.success && emailRes.error,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-h-screen">
      <AdminHeader />
      <IntegrationsClient
        track17={track17}
        twilio={twilio}
        email={email}
        loadErrors={loadErrors.length > 0 ? loadErrors : null}
      />
    </div>
  );
}
