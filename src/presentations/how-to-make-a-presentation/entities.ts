import type { EntityId } from './state'

/** This presentation's layoutId namespace: every sample entity morphs under its own prefix. */
const NAMESPACE = 'how-to'

export function layoutIdFor(id: EntityId): string {
  return `${NAMESPACE}:${id}`
}
