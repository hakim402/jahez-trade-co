'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateUserProfile } from './actions'
import { formatDate } from '@/lib/utils'

interface ProfileFormProps {
  profile: {
    id: string
    email: string
    fullName: string | null
    phone: string | null
    avatarUrl: string | null
    role: string
    createdAt: Date
    stripeCustomerId: string | null
    _count: {
      requests: number
      bookings: number
      payments: number
    }
  }
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(profile.fullName || '')
  const [phone, setPhone] = useState(profile.phone || '')

  // Get initials for avatar fallback
  const initials = profile.fullName
    ? profile.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile.email.slice(0, 2).toUpperCase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.set('fullName', fullName)
    formData.set('phone', phone)

    const result = await updateUserProfile(formData)
    if (result.success) {
      toast.success('Profile updated successfully')
      setIsEditing(false)
      router.refresh()
    } else {
      toast.error('Failed to update profile')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Profile Information</CardTitle>
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 890"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Avatar and basic info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatarUrl || ''} alt={profile.fullName || 'User'} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold">{profile.fullName || 'No name set'}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-sm">{profile.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Full Name</Label>
                <p className="text-sm">{profile.fullName || '—'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="text-sm">{profile.phone || '—'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <p className="text-sm">{profile.role}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Member Since</Label>
                <p className="text-sm">{formatDate(profile.createdAt)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Stripe Customer ID</Label>
                <p className="text-sm font-mono">{profile.stripeCustomerId || '—'}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Activity Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-2xl font-bold">{profile._count.requests}</p>
                  <p className="text-xs text-muted-foreground">Requests</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-2xl font-bold">{profile._count.bookings}</p>
                  <p className="text-xs text-muted-foreground">Bookings</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-2xl font-bold">{profile._count.payments}</p>
                  <p className="text-xs text-muted-foreground">Payments</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}