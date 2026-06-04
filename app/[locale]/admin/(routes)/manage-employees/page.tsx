// app/[locale]/admin/(routes)/manage-employees/page.tsx

import { AdminHeader } from "../../_components/AdminHeader";
import { ManageEmployeesClient } from "./_components/ManageEmployeesClient";
import { getEmployees } from "./actions";
import { Users2, Eye, EyeOff, LayoutGrid } from "lucide-react";

export const metadata = { title: "Employees — Admin" };

export default async function EmployeesPage() {
  const result = await getEmployees({
    take: 20,
    sortBy: "displayOrder",
    sortOrder: "asc",
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

  const { employees, total } = result.data;

  const publishedCount = employees.filter((e) => e.status === "PUBLISHED").length;
  const draftCount = employees.filter((e) => e.status === "DRAFT").length;
  const activeCount = employees.filter((e) => e.user.isActive).length;

  const kpis = [
    {
      label: "Total Employees",
      value: total,
      icon: Users2,
      gradient: "from-violet-500 to-[#7b57fc]",
      glow: "shadow-violet-500/20",
    },
    {
      label: "Published",
      value: publishedCount,
      icon: Eye,
      gradient: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-500/20",
    },
    {
      label: "Drafts",
      value: draftCount,
      icon: EyeOff,
      gradient: "from-amber-400 to-orange-500",
      glow: "shadow-amber-500/20",
    },
    {
      label: "Active Users",
      value: activeCount,
      icon: LayoutGrid,
      gradient: "from-blue-400 to-cyan-500",
      glow: "shadow-blue-500/20",
    },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AdminHeader />

      <div className="flex flex-col flex-1 overflow-hidden px-4 md:px-6 lg:px-8 pt-6 pb-4 gap-5 max-w-screen-2xl mx-auto w-full">
        {/* ── KPI strip ──────────────────────────────────────────────────── */}
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

        {/* ── Employee table — fills remaining height ─────────────────────── */}
        <div className="flex-1 min-h-0">
          <ManageEmployeesClient initialData={result.data} />
        </div>
      </div>
    </div>
  );
}