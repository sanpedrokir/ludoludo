import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/getUser'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getSessionUser()
  if (!session) redirect('/signin')

  return <ProfileClient profile={session.profile} />
}
