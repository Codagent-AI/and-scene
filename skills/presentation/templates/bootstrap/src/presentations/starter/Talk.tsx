import { Presentation, type Step, Box, Label, SceneLayer } from '../../presentation-kit'
import './style.css'

function StarterScene() {
  return <SceneLayer className="starter-scene">
    <Box id="starter:topic" className="starter-topic"><Label id="starter:topic-label">Your topic</Label></Box>
  </SceneLayer>
}

const steps: Step<null>[] = [{
  id: 'opening', era: 'Opening', title: 'Start with a topic',
  caption: 'Replace this starter beat with the opening of your story.',
  scene: StarterScene, payload: null,
}]

export default function Talk() {
  return <Presentation steps={steps} title="Starter presentation" initialMode="browse" />
}
