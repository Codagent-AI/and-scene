import type { PresentationMode } from './types'

export type NavAction = 'next' | 'prev' | 'toggle-mode' | null
export function stepNumber(index: number): number { return index + 1 }
export function clampIndex(index: number, total: number): number {
  return Math.max(0, Math.min(Math.max(0, total - 1), index))
}
export function keyToAction(key: string, target?: EventTarget | null, modifiers: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean } = {}): NavAction {
  if (modifiers.ctrlKey || modifiers.metaKey || modifiers.altKey) return null
  const control = target as (EventTarget & { tagName?: string; isContentEditable?: boolean }) | null | undefined
  if (control && (control.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(control.tagName ?? ''))) return null
  if (['ArrowRight', ' ', 'PageDown'].includes(key)) return 'next'
  if (['ArrowLeft', 'PageUp'].includes(key)) return 'prev'
  if (key.toLowerCase() === 'p') return 'toggle-mode'
  return null
}
export function swipeToAction(deltaX: number, threshold = 48): NavAction {
  return deltaX <= -threshold ? 'next' : deltaX >= threshold ? 'prev' : null
}
export function resolveRoute(pathname: string, slugs: readonly string[]): string | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return slug && slugs.includes(slug) ? slug : null
}
export function resolveGroup<T>(steps: readonly { groupKey?: string; Scene: T }[], index: number): { key: string; scene: T; start: number; end: number } | null {
  const active = steps[index]
  if (!active?.groupKey) return null
  let start = index
  let end = index
  while (start > 0 && steps[start - 1].groupKey === active.groupKey && steps[start - 1].Scene === active.Scene) start--
  while (end + 1 < steps.length && steps[end + 1].groupKey === active.groupKey && steps[end + 1].Scene === active.Scene) end++
  return { key: active.groupKey, scene: active.Scene, start, end }
}
export function modeFrom(value: PresentationMode): PresentationMode { return value }
