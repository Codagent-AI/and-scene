import { Presentation, Appear, Box, SceneLayer, type SceneProps, type Step } from '../../presentation-kit/index.ts'
import { useEffect } from 'react'
import '../_shared/active.css'
import '../_shared/attribution.css'

interface Beat {
  beat: number
}

declare global {
  interface Window {
    __mounts?: number
  }
}

/** One grouped scene: A persists and morphs, B departs, C is a newcomer. */
function MorphScene({ payload }: SceneProps<Beat>) {
  useEffect(() => {
    window.__mounts = (window.__mounts ?? 0) + 1
  }, [])
  const second = payload.beat >= 2
  return (
    <SceneLayer>
      <Box
        id="morph-a"
        style={second ? { left: 500, top: 200, width: 240, height: 100 } : { left: 60, top: 60, width: 120, height: 60 }}
      >
        <span data-testid="a-label">{second ? 'two' : 'one'}</span>
      </Box>
      <Appear when={!second} id="morph-b">
        <Box id="morph-b-box" style={{ left: 300, top: 60, width: 120, height: 60 }}>
          leaving
        </Box>
      </Appear>
      <Appear when={second} id="morph-c">
        <Box id="morph-c-box" style={{ left: 60, top: 250, width: 120, height: 60 }}>
          entering
        </Box>
      </Appear>
    </SceneLayer>
  )
}

const steps: Step<Beat>[] = [1, 2].map((beat) => ({
  id: `m${beat}`,
  era: 'morph',
  title: `Morph ${beat}`,
  caption: `Caption ${beat}`,
  Scene: MorphScene,
  groupKey: 'g',
  payload: { beat },
}))

export default function Talk() {
  return <Presentation steps={steps} title="morph" />
}
