// Types for the pure helpers exported by inspect-presentation.mjs, so TypeScript tests can import them.

export interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

export interface Viewport {
  width: number
  height: number
}

export interface ParsedArgs {
  slug: string | undefined
  root: string | undefined
  baseUrl: string | undefined
  out: string | undefined
  viewport: Viewport
  settleMs: number
  rebuild: boolean
  noBuild: boolean
  help: boolean
}

export interface AttributionMetrics {
  color: string
  textDecorationLine: string
  fontSizePx: number
  tapHeightPx: number
  defaults: { color: string; textDecorationLine: string; fontSizePx: number }
}

export declare const DEFAULT_SETTLE_MS: number
export declare const MIN_FONT_SIZE_PX: number
export declare const MIN_TAP_SIZE_PX: number
export declare const MIN_OVERLAP_PX: number
export declare const OVERLAP_MARKER: string
export declare const ATTRIBUTION_HOOK: string
export declare const ACTIVE_STYLE_PROPERTIES: readonly string[]

export declare class UsageError extends Error {}
export declare class HelperFailure extends Error {
  phase: string
}

export declare function parseViewport(text: string | undefined): Viewport
export declare function parseArgs(argv: readonly string[], env?: Record<string, string | undefined>): ParsedArgs
export declare function intersection(a: Box, b: Box): Box | null
export declare function overlapsSignificantly(a: Box, b: Box): boolean
export declare function indistinctFrom(activeSignature: string, inactiveSignatures: readonly string[]): boolean
export declare function attributionFindings(metrics: AttributionMetrics): string[]
export declare function isBuildStale(sourceMtimes: readonly number[], distMtime: number | null): boolean
export declare function formatWarning(input: { kind: string; index: number; stepCount: number; detail: string }): string
export declare function diagnosticsToFindings(diagnostics: unknown): { kind: string; detail: string }[]
export declare function sourceMtimes(root: string): number[]
