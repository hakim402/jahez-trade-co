// app/[locale]/admin/(routes)/integrations/page.tsx

import type { Metadata } from "next";
import { getTrack17Settings } from "./actions";
import { IntegrationsClient } from "./_components/IntegrationsClient";
import { AdminHeader } from "../../_components/AdminHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Integrations | Admin" };

export default async function AdminIntegrationsPage() {
  const result = await getTrack17Settings();
  const settings = result.success
    ? result.data
    : { apiKeyMasked: "", hasApiKey: false, webhookSecretMasked: "", hasWebhookSecret: false, enabled: false };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-h-screen">
      <AdminHeader />
      <IntegrationsClient settings={settings} loadError={!result.success ? result.error : null} />
    </div>
  );
}
