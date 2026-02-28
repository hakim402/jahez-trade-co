// app/[locale]/dashboard/_components/Overview/ProfileCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface ProfileCardProps {
  profile: {
    fullName: string | null;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  };
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const initials = profile.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email.slice(0, 2).toUpperCase();

  return (
    <Card className="group bg-background/80 backdrop-blur-sm border border-border/50 hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full orb-brand opacity-20" />
            <Avatar className="relative h-16 w-16 border-2 border-white dark:border-neutral-800">
              <AvatarImage src={profile.avatarUrl || ''} />
              <AvatarFallback className="bg-brand/10 text-brand">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-semibold">{profile.fullName || 'No name'}</p>
            <p className="text-sm text-muted-foreground">Member since {formatDate(profile.createdAt)}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-brand" />
            <span className="text-muted-foreground">{profile.email}</span>
          </div>
          {profile.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand" />
              <span className="text-muted-foreground">{profile.phone}</span>
            </div>
          )}
        </div>

        <Button asChild variant="outline" size="sm" className="w-full border-brand text-brand hover:bg-brand/5">
          <Link href="/dashboard/profile">Edit Profile</Link>
        </Button>
      </CardContent>
      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand group-hover:w-full transition-all duration-300" />
    </Card>
  );
}