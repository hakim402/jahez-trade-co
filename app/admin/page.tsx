import React from "react";
import AdminHeader from "./_components/Header/AdminHeader";
import AdminHero from "./_components/Hero/AdminHero";

export default function AdminDashboard() {
  return (
    <section className="min-h-screen]">
      <AdminHeader />
      <div className="p-10">
       <AdminHero />
      </div>
    </section>
  );
}

