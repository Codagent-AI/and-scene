import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Fixture presentations for the inspection helper. Each slug is one controlled variant:
 * a collision, an allowed overlap, a styled or unstyled attribution, and so on. The variant
 * name also selects the stylesheet rules through a data attribute on the wrapper.
 */
export const VARIANTS = [
  'clean',
  'collision',
  'allowed',
  'mixed',
  'indistinct',
  'attribution-small',
  'attribution-default',
  'attribution-missing',
  'slow',
  'combined',
] as const

export type Variant = (typeof VARIANTS)[number]

const FIXTURE_TSX = `import type { ComponentType } from 'react'
import { Presentation, Box, Label, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import './fixture.css'

export interface FixturePayload {
  variant: string
  labels: Array<{ id: string; text: string; x: number; y: number; marked?: boolean }>
  mover: number
}

function FixtureScene({ payload }: SceneProps<FixturePayload>) {
  const plain = payload.labels.filter((label) => !label.marked)
  const marked = payload.labels.filter((label) => label.marked)
  return (
    <SceneLayer>
      {plain.map((label) => (
        <Label key={label.id} id={label.id} geometry={{ x: label.x, y: label.y, w: 120, h: 30 }}>
          {label.text}
        </Label>
      ))}
      {marked.length > 0 ? (
        <div data-presentation-allow-overlap="" style={{ position: 'absolute', inset: 0 }}>
          {marked.map((label) => (
            <Label key={label.id} id={label.id} geometry={{ x: label.x, y: label.y, w: 120, h: 30 }}>
              {label.text}
            </Label>
          ))}
        </div>
      ) : null}
      <Box id="mover" geometry={{ x: payload.mover, y: 280, w: 80, h: 40 }} />
    </SceneLayer>
  )
}

const overlapping = [
  { id: 'a', text: 'AAAA', x: 100, y: 100 },
  { id: 'b', text: 'BBBB', x: 110, y: 104 },
]

const steps = (variant: string, layers: FixturePayload['labels'][]): Step<FixturePayload>[] =>
  layers.map((labels, i) => ({
    id: \`\${variant}-\${i}\`,
    era: \`fixture era \${i + 1}\`,
    title: \`Step \${i + 1}\`,
    caption: 'Fixture caption for inspection.',
    Scene: FixtureScene as ComponentType<SceneProps<FixturePayload>>,
    payload: { variant, labels, mover: i === 1 ? 600 : 0 },
  }))

export function FixtureTalk({ variant }: { variant: string }) {
  const first = firstStepLabels(variant)
  const layers: FixturePayload['labels'][] = [
    first,
    [{ id: 'c', text: 'CCCC', x: 500, y: 60 }],
    [{ id: 'd', text: 'DDDD', x: 500, y: 200 }],
  ]
  // Wrapper flags select which styling the variant keeps: active chrome, and the attribution look.
  const distinct = variant !== 'indistinct' && variant !== 'combined' ? '' : undefined
  const browserLink = variant === 'attribution-default' ? '' : undefined
  return (
    <div data-fixture={variant} data-distinct={distinct} data-browser-link={browserLink}>
      <Presentation title={\`fixture \${variant}\`} steps={steps(variant, layers)} initialMode="browse" />
    </div>
  )
}

/** The first step's labels: a collision, an allowed overlap, a mixed overlap, or none. */
function firstStepLabels(variant: string): FixturePayload['labels'] {
  if (variant === 'collision' || variant === 'combined') return overlapping
  if (variant === 'allowed') {
    return overlapping.map((label) => ({ ...label, marked: true }))
  }
  if (variant === 'mixed') {
    return [
      { id: 'a', text: 'AAAA', x: 100, y: 100, marked: true },
      { id: 'b', text: 'BBBB', x: 110, y: 104 },
    ]
  }
  return [{ id: 'a', text: 'AAAA', x: 100, y: 100 }]
}
`

const FIXTURE_CSS = `
/* Base styling: distinct active chrome and a legible attribution. Variants opt out with wrapper flags. */
[data-fixture] [data-presentation-progress-dot] { width: 8px; height: 8px; background: #ccc; }
[data-fixture][data-distinct] [data-presentation-progress-dot][data-presentation-active='true'] { width: 16px; height: 16px; background: #d00; }
[data-fixture] [data-presentation-toc-entry] { background: #fff; color: #111; }
[data-fixture][data-distinct] [data-presentation-toc-entry][data-presentation-active='true'] { background: #00c; color: #fff; }
[data-fixture]:not([data-browser-link]) [data-presentation-attribution] { font-size: 13px; color: #222; text-decoration: none; }
[data-fixture='attribution-small'] [data-presentation-attribution] { font-size: 9px !important; }
[data-fixture='attribution-missing'] [data-presentation-attribution] { display: none !important; }
`

/** One Talk.tsx per variant, registered under the slug fixture-<variant>. */
export function fixtureRegistry(variants: readonly string[]): string {
  const entries = variants.map(
    (variant) =>
      `  { slug: 'fixture-${variant}', title: 'fixture ${variant}', load: () => import('./fixture-${variant}/Talk') },`,
  )
  return `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: PresentationEntry[] = [
  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') },
${entries.join('\n')}
]
`
}

/** Writes the fixture presentations into an app that already has the kit. */
export function writeFixtures(appDir: string) {
  mkdirSync(join(appDir, 'src/presentations/fixture'), { recursive: true })
  writeFileSync(join(appDir, 'src/presentations/fixture/Fixture.tsx'), FIXTURE_TSX)
  writeFileSync(join(appDir, 'src/presentations/fixture/fixture.css'), FIXTURE_CSS)
  for (const variant of VARIANTS) {
    mkdirSync(join(appDir, `src/presentations/fixture-${variant}`), { recursive: true })
    writeFileSync(
      join(appDir, `src/presentations/fixture-${variant}/Talk.tsx`),
      `import { FixtureTalk } from '../fixture/Fixture'\n\nexport default function Talk() {\n  return <FixtureTalk variant="${variant}" />\n}\n`,
    )
  }
  writeFileSync(join(appDir, 'src/presentations/index.ts'), fixtureRegistry(VARIANTS))
}
