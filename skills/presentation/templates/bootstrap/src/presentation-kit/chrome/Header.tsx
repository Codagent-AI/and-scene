import type { ReactNode } from 'react'
import type { ChromeHooks } from './forward'

export interface HeaderProps extends ChromeHooks {
  /** Host-provided branding for the top-left slot. Empty by default. */
  brand?: ReactNode
  era: string
}

export function Header({ brand, era, style, ...rest }: HeaderProps) {
  return (
    <header
      {...rest}
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
        ...style,
      }}
    >
      <div data-presentation-brand="">{brand}</div>
      <div data-presentation-era="">{era}</div>
    </header>
  )
}
