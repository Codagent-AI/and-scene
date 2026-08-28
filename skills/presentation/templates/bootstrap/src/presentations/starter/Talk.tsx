import { Box, Label, Presentation, SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
import './presentation.css'

type StarterPayload = { message: string }

function StarterScene({ payload }: SceneProps<StarterPayload>) {
  return <SceneLayer className="starter-scene"><Box className="starter-card" layoutId="starter:card"><Label layoutId="starter:label">{payload.message}</Label></Box></SceneLayer>
}

const steps: readonly Step<StarterPayload>[] = [{
  id: 'welcome', era: 'start', title: 'A presentation starts as a scene', caption: 'Replace this starter with your own evolving diagram.', Scene: StarterScene, payload: { message: 'Your scene goes here.' }, groupKey: 'starter',
}]

export default function Talk() { return <Presentation initialMode="browse" steps={steps} title="Starter presentation" /> }
