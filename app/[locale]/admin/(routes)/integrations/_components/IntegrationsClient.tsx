// app/[locale]/admin/(routes)/integrations/_components/IntegrationsClient.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  ShieldCheck,
  Gauge,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveTrack17Settings, checkTrack17Quota } from "../actions";

interface Settings {
  apiKeyMasked: string;
  hasApiKey: boolean;
  webhookSecretMasked: string;
  hasWebhookSecret: boolean;
  enabled: boolean;
}

export function IntegrationsClient({ settings, loadError }: { settings: Settings; loadError?: string | null }) {
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [enabled, setEnabled] = useState(settings.enabled);
  const [isSaving, startSave] = useTransition();
  const [isChecking, startCheck] = useTransition();
  const [quota, setQuota] = useState<{ total: number; used: number; remaining: number } | null>(null);

  function handleSave() {
    startSave(async () => {
      const res = await saveTrack17Settings({
        apiKey: apiKey.trim() || undefined,
        webhookSecret: webhookSecret.trim() || undefined,
        enabled,
      });
      if (res.success) {
        toast.success("Integration settings saved");
        setApiKey("");
        setWebhookSecret("");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleCheckQuota() {
    startCheck(async () => {
      const res = await checkTrack17Quota();
      if (res.success) setQuota(res.data);
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/shipments" className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Shipments
        </Link>
        <h1 className="text-2xl font-bold text-foreground">API Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect a real-time tracking provider so shipments update automatically instead of relying only on manual entries.
        </p>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <Card className="rounded-2xl border-border/50 max-w-xl space-y-5 p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7b57fc]/10">
            <KeyRound className="h-4.5 w-4.5 text-[#7b57fc]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">17TRACK</h2>
            <p className="text-xs text-muted-foreground">Multi-carrier tracking — 3400+ carriers worldwide, free quota included.</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>{settings.hasApiKey ? `API key connected (${settings.apiKeyMasked})` : "No API key configured yet"}</span>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-1.5">
          <Label>API Token</Label>
          <Input
            type="password"
            placeholder={settings.hasApiKey ? "Enter a new key to replace the current one" : "Paste your 17TRACK API key"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Get a free key from{" "}
            <a href="https://api.17track.net" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[#7b57fc] hover:underline">
              api.17track.net <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Webhook Secret (optional)</Label>
          <Input
            type="password"
            placeholder={settings.hasWebhookSecret ? `Currently set (${settings.webhookSecretMasked})` : "Defaults to your API key if left blank"}
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Used to verify push notifications sent to <code className="rounded bg-muted px-1">/api/webhooks/17track</code>
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-[#7b57fc] hover:bg-[#6845e8]">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
          <Button variant="outline" onClick={handleCheckQuota} disabled={isChecking || !settings.hasApiKey}>
            {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gauge className="mr-2 h-4 w-4" />}
            Check Quota
          </Button>
        </div>

        {quota && (
          <div className="rounded-lg bg-[#7b57fc]/5 p-3 text-sm">
            <p>Total quota: <b>{quota.total}</b></p>
            <p>Used: <b>{quota.used}</b></p>
            <p>Remaining: <b>{quota.remaining}</b></p>
          </div>
        )}
      </Card>
    </div>
  );
}
