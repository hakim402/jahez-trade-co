"use client";

import dynamic from "next/dynamic";

// Dynamically import UserButton with SSR disabled
const UserButton = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.UserButton),
  { ssr: false }
);

export default function UserButtonClient({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  return <UserButton afterSignOutUrl={afterSignOutUrl} />;
}