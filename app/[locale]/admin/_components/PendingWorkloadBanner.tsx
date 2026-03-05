// app/[locale]/admin/_components/PendingWorkloadBanner.tsx

import Link from 'next/link';
import { AlertCircle, Clock, FileCheck, Video } from 'lucide-react';
import type { PendingWorkload } from '../actions';

interface Props {
  workload: PendingWorkload;
}

const total = (w: PendingWorkload) =>
  w.requestsPendingReview +
  w.quotesAwaitingApproval +
  w.bookingsPendingConfirmation +
  w.bookingsProposed;

export function PendingWorkloadBanner({ workload }: Props) {
  const count = total(workload);
  if (count === 0) return null;

  const items = [
    {
      label: 'Requests to review',
      count: workload.requestsPendingReview,
      href: '/admin/product-requests?status=IN_REVIEW',
      icon: AlertCircle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Quotes awaiting approval',
      count: workload.quotesAwaitingApproval,
      href: '/admin/product-requests?tab=quotes&status=SENT',
      icon: FileCheck,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Booking confirmations',
      count: workload.bookingsPendingConfirmation,
      href: '/admin/video-bookings?status=REQUESTED',
      icon: Video,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Proposed bookings',
      count: workload.bookingsProposed,
      href: '/admin/video-bookings?status=PROPOSED',
      icon: Clock,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
  ].filter((i) => i.count > 0);

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle size={16} className="text-amber-400" />
        <span className="text-sm font-semibold text-amber-400">
          {count} item{count !== 1 ? 's' : ''} need your attention
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-opacity hover:opacity-80 ${item.bg}`}
          >
            <item.icon size={14} className={item.color} />
            <span className={item.color}>{item.count} {item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}