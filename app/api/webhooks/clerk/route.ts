import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET missing')
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, phone_numbers } = evt.data

    const email = email_addresses?.[0]?.email_address
    const fullName = [first_name, last_name].filter(Boolean).join(' ')
    const phone = phone_numbers?.[0]?.phone_number

    await prisma.user.upsert({
      where: { clerkId: id },
      update: {
        email,
        fullName,
        avatarUrl: image_url,
        phone,
      },
      create: {
        clerkId: id,
        email,
        fullName,
        avatarUrl: image_url,
        phone,
        role: 'CLIENT', // default role – can be changed later by admin
      },
    })
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data
    await prisma.user.delete({ where: { clerkId: id } }).catch(() => {
      // ignore if already deleted
    })
  }

  return new Response('Webhook processed', { status: 200 })
}