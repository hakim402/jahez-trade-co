// app/[locale]/admin/(routes)/integrations/page.tsx

import { getTrack17Settings } from "./actions";
import { IntegrationsClient } from "./_components/IntegrationsClient";

export default async function AdminIntegrationsPage() {
  const result = await getTrack17Settings();
  const settings = result.success
    ? result.data
    : { apiKeyMasked: "", hasApiKey: false, webhookSecretMasked: "", hasWebhookSecret: false, enabled: false };

  return <IntegrationsClient settings={settings} />;
}
