// Fixture presentations for INT-002. The plain variant has no presentation CSS; the polished
// variant styles the active chrome and the attribution. Both contain the same deliberate
// overlaps: an unmarked collision on step 1 and an allowed overlap inside a marked frame on step 2.

const SCENE = `import { Box, Frame, Label, SceneLayer, type SceneProps } from '../../presentation-kit'

export function Scene({ payload }: SceneProps<{ step: number }>) {
  if (payload.step === 1) {
    return (
      <SceneLayer name="fixture">
        <Label data-presentation-entity="collide-a" style={{ left: 100, top: 100, width: 200, height: 40 }}>alpha text</Label>
        <Label data-presentation-entity="collide-b" style={{ left: 160, top: 110, width: 200, height: 40 }}>beta text</Label>
      </SceneLayer>
    )
  }
  if (payload.step === 2) {
    return (
      <SceneLayer name="fixture">
        <Frame data-presentation-allow-overlap="" style={{ left: 100, top: 80, width: 300, height: 200 }}>
          <Label style={{ left: 10, top: 10, width: 200, height: 30 }}>inside a</Label>
          <Label style={{ left: 20, top: 20, width: 200, height: 30 }}>inside b</Label>
        </Frame>
      </SceneLayer>
    )
  }
  return (
    <SceneLayer name="fixture">
      <Box style={{ left: 40, top: 60, width: 120, height: 60 }}>plain one</Box>
      <Box style={{ left: 300, top: 60, width: 120, height: 60 }}>plain two</Box>
    </SceneLayer>
  )
}
`

const STEPS = `import type { Step } from '../../presentation-kit'
import { Scene } from './Scene'

const payloads = [1, 2, 3]
export const STEPS: readonly Step<{ step: number }>[] = payloads.map((step) => ({
  id: \`step-\${step}\`,
  // Two eras, so the table of contents has an inactive entry to compare with the active one.
  era: step < 3 ? 'one' : 'two',
  title: \`Fixture step \${step}\`,
  caption: \`Caption for fixture step \${step}.\`,
  Scene,
  groupKey: 'fixture',
  payload: { step },
}))
`

const talk = (css: string) => `import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
${css}
export default function Talk() {
  return <Presentation steps={STEPS} title="Fixture" initialMode="browse" />
}
`

const POLISHED_CSS = `[data-presentation-progress][data-presentation-active="true"] { background: #c7a755; transform: scale(1.5); }
[data-presentation-progress] { width: 10px; height: 10px; border: 1px solid #666; background: transparent; }
[data-presentation-attribution] { font-size: 14px; color: #c7a755; }
[data-presentation-label] { font-size: 14px; }
[data-presentation-progress-list], [data-presentation-controls] { gap: 14px; margin-top: 10px; }
[data-presentation-controls] button { margin-right: 10px; }
[data-presentation-toc-entry][aria-current="step"] { color: #c7a755; font-weight: 700; }`

const register = (slugs: string[]) => `import type { PresentationEntry } from '../registry'

export const PRESENTATIONS: readonly PresentationEntry[] = [
${slugs
  .map((slug) => `  { slug: '${slug}', title: '${slug}', load: () => import('./${slug}/Talk') },`)
  .join('\n')}
]
`

/** Files written into the scratch app (relative to its root) for the two fixture presentations. */
export const FIXTURE_FILES: Record<string, string> = {
  'src/presentations/index.ts': register(['fixture-plain', 'fixture-polished']),
  'src/presentations/fixture-plain/Scene.tsx': SCENE,
  'src/presentations/fixture-plain/steps.ts': STEPS,
  'src/presentations/fixture-plain/Talk.tsx': talk(''),
  'src/presentations/fixture-polished/Scene.tsx': SCENE,
  'src/presentations/fixture-polished/steps.ts': STEPS,
  'src/presentations/fixture-polished/presentation.css': POLISHED_CSS,
  'src/presentations/fixture-polished/Talk.tsx': talk("import './presentation.css'"),
}
