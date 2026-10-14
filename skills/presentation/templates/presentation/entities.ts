// This presentation's layoutId namespace. Each id names one entity for the whole
// talk: a persisting entity keeps its id from the step it appears in onward, and
// no two entities share one. Ids are prefixed so they cannot collide with another
// presentation's layout ids.
const NS = '{{SLUG}}'

export const ENTITY = {
  subject: `${NS}:subject`,
  note: `${NS}:note`,
} as const
