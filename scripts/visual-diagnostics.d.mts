export interface VisualDiagnostics {
  overlaps: string[]
  indistinct: string[]
  polishedAttribution: boolean
}
export function inspectVisualComposition(): VisualDiagnostics
