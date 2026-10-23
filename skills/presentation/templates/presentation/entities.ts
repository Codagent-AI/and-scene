// __TITLE__: this presentation's layoutId namespace. Give every entity one id
// and keep its coordinates stable so it morphs in place between steps.
export const E = {
  idea: '__SLUG__-idea',
  detail: '__SLUG__-detail',
  link: '__SLUG__-link',
} as const

export type EntityId = (typeof E)[keyof typeof E]
