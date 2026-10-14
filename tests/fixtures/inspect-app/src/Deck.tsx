import { Box, Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../../../src/presentation-kit'
import type { VariantSlug } from './variants'

interface FixturePayload {
  label: string
  // Two text labels that overlap on purpose: unmarked, or wrapped in an allow-overlap subtree.
  collide: boolean
  allowOverlap: boolean
}

function FixtureScene({ payload }: SceneProps<FixturePayload>) {
  const labels = (
    <>
      <Label x={60} y={170} width={260} height={30}>
        Overlapping label one
      </Label>
      <Label x={90} y={180} width={260} height={30}>
        Second label collides
      </Label>
    </>
  )
  return (
    <SceneLayer>
      <Box x={40} y={40} width={300} height={90}>
        {payload.label}
      </Box>
      {payload.collide ? (
        payload.allowOverlap ? (
          <div data-presentation-allow-overlap="" style={{ position: 'absolute', left: 0, top: 0, width: 880, height: 380 }}>
            {labels}
          </div>
        ) : (
          labels
        )
      ) : null}
    </SceneLayer>
  )
}

const BEATS = [
  { era: 'Intro', title: 'Opening beat', caption: 'The first step explains the idea.' },
  { era: 'Intro', title: 'Second beat', caption: 'The second step builds on it.' },
  { era: 'Body', title: 'Third beat', caption: 'The body starts here.' },
  { era: 'Body', title: 'Final beat', caption: 'The last step wraps up.' },
]

export function Deck({ variant }: { variant: VariantSlug }) {
  // Only the collision variants put text on top of text, and only on the second step.
  const collides = variant === 'collision' || variant === 'allowed-overlap'
  const steps: Step<FixturePayload>[] = BEATS.map((beat, index) => ({
    id: `beat-${index}`,
    ...beat,
    scene: FixtureScene,
    payload: {
      label: `Beat ${index + 1}`,
      collide: collides && index === 1,
      allowOverlap: variant === 'allowed-overlap',
    },
  }))
  const classes = ['deck', `deck-${variant}`]
  if (variant === 'indistinct') classes.push('is-indistinct')
  if (variant === 'plain-attribution') classes.push('is-plain-attribution')
  return (
    <div className={classes.join(' ')}>
      <Presentation steps={steps} title={`Inspection fixture: ${variant}`} />
    </div>
  )
}
