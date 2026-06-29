export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col flex-1 items-center justify-center px-6 py-16">
      <div className="text-4xl mb-6">🎲</div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
