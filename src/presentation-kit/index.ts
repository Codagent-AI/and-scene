export { Presentation, type PresentationProps } from './Presentation'
export { Stage } from './Stage'
export { usePresentationNav, clampIndex, actionForKey, actionForSwipe } from './usePresentationNav'
export { useFitScale, computeFitScale } from './useFitScale'
export * from './constants'
export type {
  AnyStep,
  AttributionOptions,
  CanvasSize,
  PresentationMode,
  SceneProps,
  Step,
  StepMeta,
} from './types'
export { Toc } from './chrome/Toc'
export { buildToc, stepMarker, type TocEntry } from './chrome/helpers'
export { Entity, type EntityProps } from './nodes/Entity'
export { Box, type BoxProps } from './nodes/Box'
export { Label } from './nodes/Label'
export { Arrow, type ArrowProps } from './nodes/Arrow'
export { Frame } from './nodes/Frame'
export { Emphasis } from './nodes/Emphasis'
export { SymbolChip, type SymbolChipProps } from './nodes/SymbolChip'
export { Appear } from './nodes/Appear'
export { SceneLayer } from './nodes/SceneLayer'
