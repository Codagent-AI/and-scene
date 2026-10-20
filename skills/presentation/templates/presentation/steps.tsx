import { Appear, Arrow, Box, Label, SceneLayer, type SceneProps, type Step } from '../../presentation-kit/index.ts'
import { E } from './entities.ts'

/** Replace these steps with the presentation's own. Each step names a state of one evolving scene. */
export interface Payload {
  /** Number of steps whose entities are on screen (1-based). */
  upTo: number
}

const ENTITIES = [
  () => [
    <Appear key={E.idea}>
      <Box id={E.idea} rect={{ x: 60, y: 140, w: 200, h: 100 }}>
        <Label id={E.ideaLabel}>idea</Label>
      </Box>
    </Appear>,
  ],
  () => [
    <Appear key={E.detail}>
      <Box id={E.detail} rect={{ x: 340, y: 140, w: 200, h: 100 }}>
        detail
      </Box>
    </Appear>,
    <Appear key={E.link}>
      <Arrow id={E.link} from={{ x: 260, y: 190 }} to={{ x: 340, y: 190 }} />
    </Appear>,
  ],
  () => [
    <Appear key={E.result}>
      <Box id={E.result} rect={{ x: 620, y: 140, w: 200, h: 100 }}>
        result
      </Box>
    </Appear>,
  ],
]

/** One persistent scene: entities accumulate, so everything already on screen stays put. */
function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer>{ENTITIES.slice(0, payload.upTo).flatMap((entities) => entities())}</SceneLayer>
}

const META = [
  { id: 'idea', era: 'start', title: 'Start with the idea', caption: 'Introduce the topic with a single entity.' },
  { id: 'detail', era: 'start', title: 'Add the detail', caption: 'Bring in the next entity and connect it to the first.' },
  { id: 'result', era: 'finish', title: 'Land the result', caption: 'Finish the story without redrawing what is already there.' },
]

export const STEPS: Step<Payload>[] = META.map((meta, i) => ({ ...meta, groupKey: 'main', Scene, payload: { upTo: i + 1 } }))
