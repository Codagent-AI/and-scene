// layoutId namespace for this presentation: ids are prefixed with the slug so they
// cannot collide with another presentation's entities.
const ns = (name: string) => `starter/${name}`

export const E = {
  idea: ns('idea'),
  detail: ns('detail'),
  link: ns('link'),
} as const
