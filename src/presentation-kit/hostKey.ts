/** Key shared by grouped steps so their scene instance persists between navigations. */
export function hostKey(step: { id: string; groupKey?: string }): string {
  return step.groupKey !== undefined ? `group:${step.groupKey}` : `step:${step.id}`
}
