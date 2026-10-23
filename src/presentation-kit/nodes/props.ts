import type { CSSProperties } from 'react'
import { EASE, LAYOUT_T } from '../constants.ts'

/** Identity and styling hooks every node primitive accepts. */
export interface NodeProps {
  /** Stable entity id; also used as the shared `layoutId` so the entity morphs across steps. */
  id?: string
  className?: string
  style?: CSSProperties
  [dataAttribute: `data-${string}`]: string | number | boolean | undefined
}

/** Picks the data-* attributes out of rest props so they reach the DOM. */
export function dataProps(props: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith('data-')))
}

export const entityAttrs = (hook: string, id: string | undefined) => ({
  [`data-presentation-${hook}`]: '',
  ...(id ? { 'data-presentation-entity': id } : {}),
})

/** Shared-layout props: the entity morphs in place between steps through its stable id. */
export const morphProps = (id: string | undefined) => ({
  layout: true,
  layoutId: id,
  transition: { layout: { duration: LAYOUT_T, ease: EASE } },
})
