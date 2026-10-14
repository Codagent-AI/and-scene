// Each slug is one registered-style test presentation the helper inspects at /<slug>.
export const VARIANT_SLUGS = [
  'clean',
  'collision',
  'allowed-overlap',
  'indistinct',
  'plain-attribution',
] as const

export type VariantSlug = (typeof VARIANT_SLUGS)[number]
