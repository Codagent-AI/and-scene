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
        left: 0,
        right: 0,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        padding: '0 16px',
      }}
    >
      <div data-presentation-brand="">{brand}</div>
      <div data-presentation-era="">{era}</div>
    </header>
  )
}
