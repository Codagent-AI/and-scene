import type { Transition } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'

const MORPH: Transition = { duration: LAYOUT_T, ease: EASE }

/** Props shared by every entity primitive: layout identity, morph timing, and hooks. */
export function entityProps(id: string, node: string, kind?: string, transition?: Transition) {
  return {
    layout: true,
    layoutId: id,
    transition: transition ?? MORPH,
    'data-presentation-node': node,
    'data-presentation-entity': id,
    'data-presentation-kind': kind,
  } as const
}
