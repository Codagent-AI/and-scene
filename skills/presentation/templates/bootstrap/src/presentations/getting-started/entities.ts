/** This presentation's layoutId namespace. Keep ids stable: the same id in two steps morphs in place. */
const ns = (name: string) => `topic/${name}`

export const E = {
  idea: ns('idea'),
  ideaLabel: ns('idea-label'),
  detail: ns('detail'),
  link: ns('link'),
  result: ns('result'),
} as const
