import type { Step } from './types'
export function sceneHostKey<T>(steps: readonly Step<T>[], index: number): string {
  const sharesScene = (at: number) => at > 0 && Boolean(steps[at].groupKey) && steps[at - 1].Scene === steps[at].Scene && steps[at - 1].groupKey === steps[at].groupKey
  let start = index
  while (sharesScene(start)) start--
  return steps[start].id
}
