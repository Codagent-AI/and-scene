import type { ReactNode } from 'react'

export function Link({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href}>{children}</a>
}
