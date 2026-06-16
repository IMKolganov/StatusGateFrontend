import type { ReactNode } from 'react'
import { PublicFooter } from './PublicFooter'
import { PublicHeader } from './PublicHeader'
import '../pages/public.css'

type PublicLayoutProps = {
  children: ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="public-page">
      <PublicHeader />
      <main className="public-main">{children}</main>
      <PublicFooter />
    </div>
  )
}
