import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getUserProfile } from './_components/actions'
import ProfileForm from './_components/ProfieForm'
import Header from './_components/Header/header'

export default async function DashboardPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  // Ensure user exists in local DB
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) redirect('/sign-in')

  const profile = await getUserProfile()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Header />
      <h1 className="text-3xl font-bold">My Profile</h1>
      <ProfileForm profile={profile} />
    </div>
  )
}