import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { motion } from 'motion/react'
import {
  Appear,
  Box,
  defineStep,
  Presence,
  Presentation,
  SceneLayer,
  type SceneProps,
  type SceneStep,
} from '../../../src/presentation-kit'

// Scene with persisting (A), departing (B) and entering (C) entities.
interface Beat {
  beat: number
}

function Persisting({ payload }: SceneProps<Beat>) {
  const { beat } = payload
  return (
    <SceneLayer>
      <Presence>
        <Appear key="A">
          <Box
            id="A"
            className={beat >= 1 ? 'emphasis' : undefined}
            x={beat === 0 ? 40 : 520}
            y={beat === 0 ? 40 : 220}
            w={beat === 0 ? 120 : 200}
            h={beat === 0 ? 60 : 90}
          >
            {beat === 0 ? 'A first' : 'A second'}
          </Box>
        </Appear>
        {beat === 0 ? (
          <Appear key="B">
            <Box id="B" x={300} y={40} w={120} h={60}>
              B
            </Box>
          </Appear>
        ) : null}
        {beat >= 1 ? (
          <Appear key="C">
            <Box id="C" x={60} y={260} w={120} h={60}>
              C
            </Box>
          </Appear>
        ) : null}
      </Presence>
    </SceneLayer>
  )
}

function SceneOne() {
  return (
    <SceneLayer>
      <Box id="S" x={40} y={40} w={100} h={50}>S</Box>
      <Box id="D" x={300} y={40} w={100} h={50}>D</Box>
    </SceneLayer>
  )
}

function SceneTwo() {
  return (
    <SceneLayer>
      <Box id="S" x={500} y={250} w={160} h={80}>S</Box>
      <Appear>
        <Box id="N" x={60} y={250} w={100} h={50}>N</Box>
      </Appear>
    </SceneLayer>
  )
}

function Overlap({ payload }: SceneProps<Beat>) {
  return (
    <SceneLayer>
      <Box id="under" x={100} y={100} w={200} h={120} data-presentation-allow-overlap="">under</Box>
      <Box id="over" x={payload.beat === 0 ? 220 : 180} y={150} w={200} h={120} data-presentation-allow-overlap="">over</Box>
    </SceneLayer>
  )
}

function Raw({ payload }: SceneProps<Beat>) {
  return (
    <SceneLayer>
      <motion.div
        layout
        layoutId="raw"
        data-presentation-entity="raw"
        transition={{ layout: { duration: 0.5 } }}
        style={{ position: 'absolute', left: payload.beat === 0 ? 30 : 600, top: payload.beat === 0 ? 30 : 250, width: 80, height: 40 }}
      >
        raw
      </motion.div>
    </SceneLayer>
  )
}

const meta = (i: number) => ({ id: `s${i}`, era: i < 2 ? 'one' : 'two', title: `Step ${i + 1}`, caption: `Caption ${i + 1}` })

const fixtures: Record<string, { steps: SceneStep[]; mode?: 'browse' | 'present' }> = {
  grouped: {
    steps: [0, 1, 2].map((beat) =>
      defineStep({ ...meta(beat), Scene: Persisting, groupKey: 'g', payload: { beat } }),
    ),
    mode: 'browse',
  },
  ungrouped: {
    steps: [
      defineStep({ ...meta(0), Scene: SceneOne, payload: undefined }),
      defineStep({ ...meta(1), Scene: SceneTwo, payload: undefined }),
    ],
    mode: 'browse',
  },
  overlap: {
    steps: [0, 1].map((beat) => defineStep({ ...meta(beat), Scene: Overlap, groupKey: 'o', payload: { beat } })),
    mode: 'browse',
  },
  raw: {
    steps: [0, 1].map((beat) => defineStep({ ...meta(beat), Scene: Raw, groupKey: 'r', payload: { beat } })),
    mode: 'browse',
  },
}

const name = new URLSearchParams(location.search).get('fixture') ?? 'grouped'
const fixture = fixtures[name]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Presentation steps={fixture.steps} title={name} initialMode={fixture.mode} />
  </StrictMode>,
)
