import type { ReactNode } from 'react'

export interface HeaderProps {
  /** Host-provided branding for the top-left slot. Empty by default. */
  brand?: ReactNode
  era: string
}

export function Header({ brand, era }: HeaderProps) {
  return (
    <header
      data-presentation-header=""
      style={{
        position: 'absolute',
        top: 0,
        left: 16,
        right: 16,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div data-presentation-brand="">{brand}</div>
      <div data-presentation-era="">{era}</div>
    </header>
  )
}
