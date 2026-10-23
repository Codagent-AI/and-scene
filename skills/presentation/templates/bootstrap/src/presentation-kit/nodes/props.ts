import type { CSSProperties } from 'react'

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
