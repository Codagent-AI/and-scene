export type Anchor = 'build' | 'kit' | 'index'
export interface AnchorReport {
  dir: string
  build: boolean
  kit: boolean
  index: boolean
  missing: Anchor[]
  indexPath: string
}
export interface TargetResolution {
  kind: 'empty' | 'existing-app' | 'monorepo' | 'standalone'
  appDir: string
  relativeAppDir: string
  indexPath: string
  anchors: Record<Anchor, boolean>
  missing: Anchor[]
  action: 'skip-scaffold' | 'full-scaffold' | 'partial-scaffold'
  requiresConfirmation: boolean
  signals: string[]
  reason: string
}
export interface ApplyResult {
  appDir: string
  written: string[]
  merged: string[]
  needsInstall: boolean
}
export const BOOTSTRAP_DIR: string
export const PRESENTATION_TEMPLATE_DIR: string
export const ANCHORS: Anchor[]
export const ANCHOR_FILES: Record<Anchor, string[]>
export function detectAnchors(dir: string): AnchorReport
export function monorepoSignals(dir: string): string[]
export function resolveTarget(dir: string, options?: { stopAt?: string }): TargetResolution
export function scaffoldPlan(missing: Anchor[], templateDir?: string): string[]
export function applyScaffold(
  appDir: string,
  options?: { templateDir?: string; missing?: Anchor[]; name?: string },
): ApplyResult
export function slugify(text: string): string
