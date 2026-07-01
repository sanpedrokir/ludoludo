import LudoIcon from '@/components/LudoIcon'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col flex-1 items-center justify-center px-6 py-16">
      <div className="mb-6">
        <LudoIcon size={56} />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
