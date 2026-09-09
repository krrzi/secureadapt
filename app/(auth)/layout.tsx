import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 to-brand-800 flex flex-col justify-center py-12">
      {children}
    </div>
  )
}
