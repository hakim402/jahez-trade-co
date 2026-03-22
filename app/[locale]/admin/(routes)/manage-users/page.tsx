// app/[locale]/admin/(routes)/manage-users/page.tsx

import { AdminHeader } from "../../_components/AdminHeader";
import { ManageUsersClient } from "./_components/ManageUsersClient";
import { getUsers } from "./actions";
import { Users, UserCheck, UserX, ShieldCheck } from "lucide-react";

export const metadata = { title: "Users — Admin" };

export default async function UsersPage() {
  const result = await getUsers({
    take: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  if (!result.success) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <AdminHeader />
        <div className="flex items-center justify-center flex-1">
          <p className="text-sm text-muted-foreground">{result.error}</p>
        </div>
      </div>
    );
  }

  const { users, total } = result.data;

  // Quick stats derived from first page — good enough for the KPI strip
  const activeCount = users.filter((u) => u.isActive && !u.isDeleted).length;
  const suspendedCount = users.filter(
    (u) => !u.isActive && !u.isDeleted,
  ).length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  const kpis = [
    {
      label: "Total Users",
      value: total,
      icon: Users,
      gradient: "from-violet-500 to-[#7b57fc]",
      glow: "shadow-violet-500/20",
    },
    {
      label: "Active",
      value: activeCount,
      icon: UserCheck,
      gradient: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-500/20",
    },
    {
      label: "Suspended",
      value: suspendedCount,
      icon: UserX,
      gradient: "from-red-400 to-rose-500",
      glow: "shadow-red-500/20",
    },
    {
      label: "Admins",
      value: adminCount,
      icon: ShieldCheck,
      gradient: "from-amber-400 to-orange-500",
      glow: "shadow-amber-500/20",
    },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AdminHeader />

      <div className="flex flex-col flex-1 overflow-hidden px-4 md:px-6 lg:px-8 pt-6 pb-4 gap-5 max-w-screen-2xl mx-auto w-full">

        {/* ── KPI strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          {kpis.map(({ label, value, icon: Icon, gradient, glow }) => (
            <div
              key={label}
              className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden p-4 flex items-center gap-3.5 hover:border-border transition-all duration-300"
            >
              <div
                className={`absolute -top-4 -right-4 h-16 w-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br ${gradient}`}
              />
              <div
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${gradient} shadow-md ${glow}`}
              >
                <Icon size={17} className="text-white" />
              </div>
              <div className="relative min-w-0">
                <p className="text-xs text-muted-foreground font-medium truncate">
                  {label}
                </p>
                <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
                  {value.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Users table — fills remaining height ─────────────────── */}
        <div className="flex-1 min-h-0">
          <ManageUsersClient initialData={result.data} />
        </div>
      </div>
    </div>
  );
}
