// Compiled by `tsc -b` (npm run build). `@ts-expect-error` lines fail the build if the
// expected type error disappears, so each negative case is asserted.
import { Heart, type LucideIcon } from 'lucide-react'
import { Box, Presentation, SymbolChip, type SceneProps, type Step } from '../../src/presentation-kit/index.ts'

// M-01: a valid Step compiles; omitting any required field does not.
export function Plain({ index }: SceneProps) {
  return <i data-index={index} />
}
export const valid: Step = { id: 'a', era: 'e', title: 't', caption: 'c', Scene: Plain, payload: undefined }
// @ts-expect-error id is required
export const noId: Step = { era: 'e', title: 't', caption: 'c', Scene: Plain, payload: undefined }
// @ts-expect-error era is required
export const noEra: Step = { id: 'a', title: 't', caption: 'c', Scene: Plain, payload: undefined }
// @ts-expect-error title is required
export const noTitle: Step = { id: 'a', era: 'e', caption: 'c', Scene: Plain, payload: undefined }
// @ts-expect-error caption is required
export const noCaption: Step = { id: 'a', era: 'e', title: 't', Scene: Plain, payload: undefined }
// @ts-expect-error the diagram state (Scene) is required
export const noScene: Step = { id: 'a', era: 'e', title: 't', caption: 'c', payload: undefined }

// M-03 / C-05: a typed, topic-agnostic grouped payload reaches <Presentation> with no casts.
interface Orbit {
  radius: number
  label: string
}
function OrbitScene({ payload }: SceneProps<Orbit>) {
  return <Box id={`planet-${payload.label}`} w={payload.radius} h={payload.radius} />
}
const orbitSteps: Step<Orbit>[] = [
  { id: 'near', era: 'inner', title: 'Near', caption: 'Close in.', groupKey: 'orbit', Scene: OrbitScene, payload: { radius: 10, label: 'a' } },
  { id: 'far', era: 'outer', title: 'Far', caption: 'Far out.', groupKey: 'orbit', Scene: OrbitScene, payload: { radius: 90, label: 'b' } },
]
export const typed = <Presentation steps={orbitSteps} title="Orbits" />

const wrongPayload: Step<Orbit>[] = [
  // @ts-expect-error payload must match the Scene's payload type
  { id: 'x', era: 'e', title: 't', caption: 'c', Scene: OrbitScene, payload: { radius: 'wide' } },
]
export const rejected = <Presentation steps={wrongPayload} />

// C-04: glyphs are passed as components; omitting them is fine.
const glyph: LucideIcon = Heart
export const withGlyph = (
  <>
    <Box id="g" icon={glyph} label="loved" />
    <SymbolChip id="c" icon={Heart} symbol="♥" />
    <Box id="plain" label="no glyph" />
  </>
)
