import type { Step } from './types'

export function sceneKey<TPayload>(steps: readonly Step<TPayload>[], index: number) {
  const active = steps[index]
  if (!active.groupKey) return active.id

  let start = index
  while (start > 0 &&
    steps[start - 1].groupKey === active.groupKey &&
    steps[start - 1].Scene === active.Scene) {
    start -= 1
  }
  return steps[start].id
}
