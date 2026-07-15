"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Search, User, UserPlus, X, Loader2, Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { searchClients, searchGuestClients, createGuestClient } from "../actions";
import type { GuestClientInput } from "../actions";

export interface SelectedClient {
  kind: "user" | "guest";
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
}

export function ClientPicker({
  value,
  onChange,
}: {
  value: SelectedClient | null;
  onChange: (client: SelectedClient | null) => void;
}) {
  const [tab, setTab] = useState<"existing" | "guest" | "new">("existing");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SelectedClient[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [isCreating, startCreate] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newGuest, setNewGuest] = useState<GuestClientInput>({
    fullName: "",
    email: "",
    phone: "",
    whatsappPhone: "",
    company: "",
    country: "",
    notes: "",
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        if (tab === "existing") {
          const res = await searchClients(query);
          if (res.success) {
            setResults(
              res.data.map((u) => ({
                kind: "user" as const,
                id: u.id,
                displayName: u.fullName || u.email,
                email: u.email,
                phone: u.phone,
              })),
            );
          }
        } else if (tab === "guest") {
          const res = await searchGuestClients(query);
          if (res.success) {
            setResults(
              res.data.map((g) => ({
                kind: "guest" as const,
                id: g.id,
                displayName: g.fullName,
                email: g.email,
                phone: g.phone,
              })),
            );
          }
        }
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, tab]);

  async function handleCreateGuest() {
    if (!newGuest.fullName.trim()) return;
    setCreateError(null);
    startCreate(async () => {
      const res = await createGuestClient(newGuest);
      if (res.success) {
        onChange({
          kind: "guest",
          id: res.data.id,
          displayName: newGuest.fullName,
          email: newGuest.email || null,
          phone: newGuest.phone || null,
        });
        setNewGuest({ fullName: "", email: "", phone: "", whatsappPhone: "", company: "", country: "", notes: "" });
        setCreateError(null);
      } else {
        setCreateError(res.error || "Failed to create guest client");
      }
    });
  }

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-[#7b57fc]/30 bg-[#7b57fc]/5 px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7b57fc]/15 text-[#7b57fc]">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{value.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {value.kind === "user" ? "Registered client" : "Guest client (no account)"}
              {value.email ? ` · ${value.email}` : ""}
            </p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setResults([]); setQuery(""); setCreateError(null); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="existing">Registered</TabsTrigger>
          <TabsTrigger value="guest">Guest Clients</TabsTrigger>
          <TabsTrigger value="new">
            <UserPlus className="mr-1 h-3.5 w-3.5" /> New Guest
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="mt-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <ResultsList results={results} isSearching={isSearching} onSelect={onChange} query={query} />
        </TabsContent>

        <TabsContent value="guest" className="mt-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search guest clients…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <ResultsList results={results} isSearching={isSearching} onSelect={onChange} query={query} />
        </TabsContent>

        <TabsContent value="new" className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Register a client who doesn&apos;t have a JAHEZ account yet. They&apos;ll receive their invoice and
            tracking link by email/WhatsApp directly.
          </p>
          {createError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{createError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={newGuest.fullName} onChange={(e) => setNewGuest({ ...newGuest, fullName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={newGuest.email ?? ""} onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone / WhatsApp</Label>
              <Input value={newGuest.phone ?? ""} onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value, whatsappPhone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={newGuest.company ?? ""} onChange={(e) => setNewGuest({ ...newGuest, company: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input value={newGuest.country ?? ""} onChange={(e) => setNewGuest({ ...newGuest, country: e.target.value })} />
            </div>
          </div>
          <Button
            type="button"
            onClick={handleCreateGuest}
            disabled={!newGuest.fullName.trim() || isCreating}
            className="w-full bg-[#7b57fc] hover:bg-[#6845e8]"
          >
            {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Register Client
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResultsList({
  results,
  isSearching,
  onSelect,
  query,
}: {
  results: SelectedClient[];
  isSearching: boolean;
  onSelect: (c: SelectedClient) => void;
  query: string;
}) {
  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }
  if (query.trim().length >= 2 && results.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No matches found.</p>;
  }
  return (
    <div className="max-h-56 space-y-1 overflow-y-auto">
      {results.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onSelect(r)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left text-sm transition hover:border-[#7b57fc]/30 hover:bg-[#7b57fc]/5",
          )}
        >
          <div>
            <p className="font-medium text-foreground">{r.displayName}</p>
            <p className="text-xs text-muted-foreground">{[r.email, r.phone].filter(Boolean).join(" · ")}</p>
          </div>
          <Check className="h-4 w-4 text-transparent" />
        </button>
      ))}
    </div>
  );
}