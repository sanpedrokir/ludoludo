import CreateRoomForm from './CreateRoomForm'

export default async function CreateRoomPage({ searchParams }: { searchParams: Promise<{ stake?: string }> }) {
  const { stake } = await searchParams
  return <CreateRoomForm defaultStake={stake === 'true'} />
}
