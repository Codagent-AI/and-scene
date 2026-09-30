import type { ReactNode } from 'react'

export interface HeaderProps {
  /** Order-derived step marker, e.g. "03". */
  marker: string
  /** The active step's one-line presenter title. Shown in both modes. */
  title: string
  /** Host-provided top-left brand. The kit renders no default brand here. */
  brand?: ReactNode
}

/** Marker/brand row. Shows the active step's marker and one-line title in every mode. */
export function Header({ marker, title, brand }: HeaderProps) {
  return (
    <header className="sk-header" data-scene-kit="header">
      <div className="sk-header__brand" data-scene-kit="brand-slot">
        {brand ?? null}
      </div>
      <span className="sk-header__marker" data-scene-kit="marker">
        {marker}
      </span>
      <h1 className="sk-header__title" data-scene-kit="header-title">
        {title}
      </h1>
    </header>
  )
}
