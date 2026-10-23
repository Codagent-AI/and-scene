/** This presentation's layoutId namespace: an entity keeps one id for the whole talk. */
export const ID = {
  topic: '__NAME__-topic',
  detail: '__NAME__-detail',
  link: '__NAME__-link',
} as const

export interface EntitySpec {
  id: string
  kind: 'box' | 'label' | 'arrow'
  className: string
  x?: number
  y?: number
  width?: number
  height?: number
  text?: string
  from?: readonly [number, number]
  to?: readonly [number, number]
}

export const topic: EntitySpec = {
  id: ID.topic, kind: 'box', className: '__NAME__-topic', x: 60, y: 140, width: 220, height: 80, text: 'Topic',
}
export const detail: EntitySpec = {
  id: ID.detail, kind: 'box', className: '__NAME__-detail', x: 600, y: 140, width: 220, height: 80, text: 'Detail',
}
export const link: EntitySpec = {
  id: ID.link, kind: 'arrow', className: '__NAME__-link', from: [290, 180], to: [590, 180],
}
