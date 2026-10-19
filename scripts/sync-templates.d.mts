export const MIRRORS: ReadonlyArray<{ path: string; tree: boolean }>
export interface SyncPlan {
  copy: Array<{ rel: string; from: string }>
  remove: Array<{ rel: string; path: string }>
  drift: string[]
}
export function planSync(source?: string, target?: string): SyncPlan
export function syncTemplates(options?: { check?: boolean; source?: string; target?: string }): SyncPlan
