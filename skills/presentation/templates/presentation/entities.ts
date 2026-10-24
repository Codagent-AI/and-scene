import type { LucideIcon } from 'lucide-react'
import { Circle } from 'lucide-react'

/**
 * This presentation's layoutId namespace. Give every entity one stable id for the
 * whole presentation: the same id on two steps morphs in place between them.
 * `beat` is the first step (1-based) the entity appears in; coordinates are in the
 * 880 × 380 design canvas.
 */
export interface EntityDef {
  id: string
  beat: number
  x: number
  y: number
  w: number
  h: number
  text?: string
  icon?: LucideIcon
}

export const ENTITIES: EntityDef[] = [
  { id: 'first', beat: 1, x: 80, y: 140, w: 200, h: 80, text: 'First idea', icon: Circle },
  { id: 'second', beat: 2, x: 600, y: 140, w: 200, h: 80, text: 'Second idea', icon: Circle },
]
