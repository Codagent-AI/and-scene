import type { ReactNode } from 'react'
import type { PresentationMode } from '../types'

export interface HeaderProps {
  mode: PresentationMode
  marker: string
  title: string
  /** Host-supplied top-left brand slot. The kit renders no default here. */
  brand?: ReactNode
}

/**
 * Marker/title row shown in both modes. Present mode relies on this row as
 * the sole title surface (caption/ToC/nav are hidden by the footer/ToC in
 * that mode); browse mode pairs it with the footer's multi-line caption.
 */
export function Header({ mode, marker, title, brand }: HeaderProps) {
  return (
    <header data-presentation-header="true" data-presentation-mode={mode}>
      {brand ? <div data-presentation-brand="true">{brand}</div> : null}
      <span data-presentation-marker="true">{marker}</span>
      <h1 data-presentation-title="true">{title}</h1>
    </header>
  )
}
