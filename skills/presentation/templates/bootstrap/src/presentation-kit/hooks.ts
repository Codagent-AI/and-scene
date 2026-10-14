/**
 * Stable DOM hooks for tests, the headless verification driver, the screenshot
 * helper, and presentation-owned CSS. Renaming any value is a breaking change.
 */
export const HOOK = {
  root: 'data-presentation-root',
  mode: 'data-presentation-mode',
  stepCount: 'data-step-count',
  stepIndex: 'data-step-index',
  header: 'data-presentation-header',
  brand: 'data-presentation-brand',
  marker: 'data-presentation-marker',
  title: 'data-presentation-title',
  modeToggle: 'data-presentation-mode-toggle',
  footer: 'data-presentation-footer',
  caption: 'data-presentation-caption',
  progress: 'data-presentation-progress',
  progressItem: 'data-presentation-progress-item',
  prev: 'data-presentation-prev',
  next: 'data-presentation-next',
  toc: 'data-presentation-toc',
  tocEntry: 'data-presentation-toc-entry',
  stage: 'data-presentation-stage',
  canvas: 'data-presentation-canvas',
  sceneLayer: 'data-presentation-scene-layer',
  attribution: 'data-presentation-attribution',
  node: 'data-presentation-node',
  nodeId: 'data-presentation-id',
  emphasis: 'data-presentation-emphasis',
  active: 'data-presentation-active',
} as const

export type HookName = (typeof HOOK)[keyof typeof HOOK]

/** Builds a presence (or explicit-value) data attribute for spreading onto JSX. */
export function hookAttrs(name: HookName, value = ''): Record<string, string> {
  return { [name]: value }
}
