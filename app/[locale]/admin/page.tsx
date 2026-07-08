// app/[locale]/admin/page.tsx

import AdminDashboard from "./_components/AdminDashboard";

// ─── FORCE DYNAMIC RENDERING ──────────────────
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function page() {
  return <AdminDashboard />;
}