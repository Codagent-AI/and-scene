export interface CanonicalStepMeta {
  era: string
  title: string
  caption: string
}

export const CANONICAL_STEPS: CanonicalStepMeta[]

export function extractStepMeta(source: string): CanonicalStepMeta | null

export function validateCanonicalOrder(
  stepMetas: CanonicalStepMeta[],
): { ok: true } | { ok: false; message: string }
