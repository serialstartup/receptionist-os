import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur-md lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            HopperLine
          </h1>
        </Link>
        <div>
          <a
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            href="#"
          >
            Help
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center p-6">
        {children}
      </main>
    </div>
  )
}
