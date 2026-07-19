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
  MessageCircle,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  saveTrack17Settings,
  checkTrack17Quota,
  saveTwilioSettings,
  saveEmailSettings,
  testEmailConnection,
} from "../actions";

// ── Types ─────────────────────────────────────────────────────────────────

interface Track17Settings {
  apiKeyMasked: string; hasApiKey: boolean;
  webhookSecretMasked: string; hasWebhookSecret: boolean;
  enabled: boolean;
}

interface TwilioSettings {
  accountSidMasked: string; hasAccountSid: boolean;
  authTokenMasked: string; hasAuthToken: boolean;
  whatsappFrom: string; hasWhatsappFrom: boolean;
  enabled: boolean;
}

interface EmailSettings {
  provider: string; host: string; port: string; user: string;
  passMasked: string; hasPass: boolean;
  fromName: string; fromAddress: string; enabled: boolean;
}

interface Props {
  track17: Track17Settings;
  twilio: TwilioSettings;
  email: EmailSettings;
  loadErrors: string[] | null;
}

// ── 17TRACK Tab ───────────────────────────────────────────────────────────

function Track17Tab({ settings }: { settings: Track17Settings }) {
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
    <div className="space-y-5">
      {/* Status badge */}
      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs">
          {settings.hasApiKey ? (
            <><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /><span>API key connected ({settings.apiKeyMasked})</span></>
          ) : (
            <><XCircle className="h-3.5 w-3.5 text-amber-500" /><span>No API key configured yet</span></>
          )}
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {/* API Key */}
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

      {/* Webhook */}
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

      {/* Buttons */}
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

      {/* Quota display */}
      {quota && (
        <div className="rounded-lg bg-[#7b57fc]/5 p-3 text-sm space-y-1">
          <p>Total quota: <b>{quota.total.toLocaleString()}</b></p>
          <p>Used: <b>{quota.used.toLocaleString()}</b></p>
          <p>Remaining: <b className="text-emerald-600">{quota.remaining.toLocaleString()}</b></p>
        </div>
      )}
    </div>
  );
}

// ── Twilio Tab ────────────────────────────────────────────────────────────

function TwilioTab({ settings }: { settings: TwilioSettings }) {
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [whatsappFrom, setWhatsappFrom] = useState("");
  const [enabled, setEnabled] = useState(settings.enabled);
  const [isSaving, startSave] = useTransition();

  function handleSave() {
    startSave(async () => {
      const res = await saveTwilioSettings({
        accountSid: accountSid.trim() || undefined,
        authToken: authToken.trim() || undefined,
        whatsappFrom: whatsappFrom.trim() || undefined,
        enabled,
      });
      if (res.success) {
        toast.success("Twilio settings saved");
        setAccountSid("");
        setAuthToken("");
        setWhatsappFrom("");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Status */}
      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs">
          {settings.hasAccountSid ? (
            <><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /><span>Twilio connected ({settings.accountSidMasked})</span></>
          ) : (
            <><XCircle className="h-3.5 w-3.5 text-amber-500" /><span>No Twilio credentials configured yet</span></>
          )}
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {/* Account SID */}
      <div className="space-y-1.5">
        <Label>Account SID</Label>
        <Input
          type="password"
          placeholder={settings.hasAccountSid ? "Enter new SID to replace current" : "Twilio Account SID"}
          value={accountSid}
          onChange={(e) => setAccountSid(e.target.value)}
        />
      </div>

      {/* Auth Token */}
      <div className="space-y-1.5">
        <Label>Auth Token</Label>
        <Input
          type="password"
          placeholder={settings.hasAuthToken ? `Currently set (${settings.authTokenMasked})` : "Twilio Auth Token"}
          value={authToken}
          onChange={(e) => setAuthToken(e.target.value)}
        />
      </div>

      {/* WhatsApp From */}
      <div className="space-y-1.5">
        <Label>WhatsApp From Number</Label>
        <Input
          placeholder={settings.hasWhatsappFrom ? settings.whatsappFrom : "+14155238886"}
          value={whatsappFrom}
          onChange={(e) => setWhatsappFrom(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Twilio-provided WhatsApp number (sandbox or approved sender)
        </p>
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full bg-[#7b57fc] hover:bg-[#6845e8]">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Settings
      </Button>
    </div>
  );
}

// ── Email Tab ─────────────────────────────────────────────────────────────

function EmailTab({ settings }: { settings: EmailSettings }) {
  const [provider, setProvider] = useState(settings.provider as "gmail" | "smtp" | "none");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [enabled, setEnabled] = useState(settings.enabled);
  const [isSaving, startSave] = useTransition();
  const [isTesting, startTest] = useTransition();

  function handleSave() {
    startSave(async () => {
      const res = await saveEmailSettings({
        provider,
        host: host.trim() || undefined,
        port: port.trim() || undefined,
        user: user.trim() || undefined,
        pass: pass.trim() || undefined,
        fromName: fromName.trim() || undefined,
        fromAddress: fromAddress.trim() || undefined,
        enabled,
      });
      if (res.success) {
        toast.success("Email settings saved");
        setHost(""); setPort(""); setUser(""); setPass(""); setFromName(""); setFromAddress("");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleTest() {
    startTest(async () => {
      const res = await testEmailConnection();
      if (res.success) toast.success("Test email sent! Check your inbox.");
      else toast.error(res.error);
    });
  }

  const isSmtp = provider === "smtp";

  return (
    <div className="space-y-5">
      {/* Status */}
      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs">
          {settings.provider !== "none" ? (
            <><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>{settings.provider === "gmail" ? "Gmail (OAuth2)" : `SMTP configured (${settings.host || "custom"})`}</span></>
          ) : (
            <><XCircle className="h-3.5 w-3.5 text-amber-500" /><span>No email provider configured</span></>
          )}
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {/* Provider selector */}
      <div className="space-y-1.5">
        <Label>Email Provider</Label>
        <div className="flex gap-2">
          {(["none", "gmail", "smtp"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                provider === p
                  ? "border-[#7b57fc]/40 bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/30"
                  : "border-border/50 bg-background text-muted-foreground hover:border-border"
              }`}
            >
              {p === "none" ? "None" : p === "gmail" ? "Gmail" : "SMTP"}
            </button>
          ))}
        </div>
      </div>

      {/* SMTP fields (conditional) */}
      {isSmtp && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>SMTP Host</Label>
              <Input
                placeholder={settings.host || "smtp.hostinger.com"}
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>SMTP Port</Label>
              <Input
                placeholder={settings.port || "465"}
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>SMTP Username</Label>
              <Input
                placeholder={settings.user || "info@yourdomain.com"}
                value={user}
                onChange={(e) => setUser(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>SMTP Password</Label>
              <Input
                type="password"
                placeholder={settings.hasPass ? `Currently set (${settings.passMasked})` : "Your SMTP password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {/* From fields (all providers) */}
      {provider !== "none" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>From Name</Label>
            <Input
              placeholder={settings.fromName || "Jahez Trade Co."}
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>From Address</Label>
            <Input
              type="email"
              placeholder={settings.fromAddress || "info@jahez.online"}
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-[#7b57fc] hover:bg-[#6845e8]">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
        {provider !== "none" && (
          <Button variant="outline" onClick={handleTest} disabled={isTesting}>
            {isTesting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing…</> : "Test Connection"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Provider header ───────────────────────────────────────────────────────

function ProviderHeader({ icon: Icon, color, title, description }: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────

export function IntegrationsClient({ track17, twilio, email, loadErrors }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/shipments" className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Shipments
        </Link>
        <h1 className="text-2xl font-bold text-foreground">API Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect third-party providers to enable automated tracking, WhatsApp messaging, and email notifications.
        </p>
      </div>

      {loadErrors && loadErrors.length > 0 && (
        <div className="space-y-1.5">
          {loadErrors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="17track" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="17track" className="gap-1.5">
            <KeyRound className="h-3.5 w-3.5" /> 17TRACK
          </TabsTrigger>
          <TabsTrigger value="twilio" className="gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" /> Twilio
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="17track">
          <Card className="rounded-2xl border-border/50 max-w-xl p-6">
            <ProviderHeader
              icon={KeyRound}
              color="bg-[#7b57fc]"
              title="17TRACK"
              description="Multi-carrier tracking — 3400+ carriers worldwide, free quota included."
            />
            <Track17Tab settings={track17} />
          </Card>
        </TabsContent>

        <TabsContent value="twilio">
          <Card className="rounded-2xl border-border/50 max-w-xl p-6">
            <ProviderHeader
              icon={MessageCircle}
              color="bg-emerald-500"
              title="Twilio (WhatsApp)"
              description="Send WhatsApp notifications to admins and clients. Requires a Twilio account."
            />
            <TwilioTab settings={twilio} />
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card className="rounded-2xl border-border/50 max-w-xl p-6">
            <ProviderHeader
              icon={Mail}
              color="bg-sky-500"
              title="Email Provider"
              description="Send email notifications via Gmail API or SMTP (Hostinger, Brevo, SendGrid)."
            />
            <EmailTab settings={email} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
