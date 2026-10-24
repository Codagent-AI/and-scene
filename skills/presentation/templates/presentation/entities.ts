// This presentation's layoutId namespace. An entity keeps the same id in every
// step it appears in, so it morphs in place instead of re-entering.
export const E = {
  topic: '__SLUG__/topic',
  detail: '__SLUG__/detail',
  link: '__SLUG__/link',
  note: '__SLUG__/note',
} as const
