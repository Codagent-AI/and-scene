/** This presentation's layoutId namespace. Entities that persist between steps reuse the same id. */
const ns = (name: string) => `__SLUG__-${name}`

export const ID = {
  topic: ns('topic'),
  idea: ns('idea'),
  link: ns('link'),
  result: ns('result'),
} as const
