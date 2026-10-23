/** starter: stable entity ids (the layoutId namespace) and canvas coordinates (880 x 380). */
export const E = {
  topic: 'starter-topic',
  detail: 'starter-detail',
  link: 'starter-link',
  result: 'starter-result',
} as const

export const AT = {
  topic: { x: 60, y: 140, w: 200, h: 90 },
  detail: { x: 340, y: 140, w: 200, h: 90 },
  result: { x: 620, y: 140, w: 200, h: 90 },
} as const
