import React from "react";
import Header from "./_components/Header/header";
import Hero from "./_components/Hero/hero";

function Dashboard() {
  return (
    <section className="min-h-screen]">
      <Header />
      <div className="p-10">
       <Hero />
      </div>
    </section>
  );
}

export default Dashboard;
