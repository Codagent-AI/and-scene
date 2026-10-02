import { Presentation, SceneLayer, Box, type Step } from '../../presentation-kit'
import './style.css'

function StarterScene({ payload }: { payload: { label: string } }) {
  return <SceneLayer><Box id="starter:topic" className="starter-topic">{payload.label}</Box></SceneLayer>
}
const steps: readonly Step<{ label: string }>[] = [
  { id: 'welcome', era: 'Welcome', title: 'Your first scene', caption: 'Replace this starter with your evolving presentation.', Scene: StarterScene, payload: { label: 'Your topic' }, groupKey: 'starter' },
]
export default function Talk() { return <Presentation steps={steps} title="Your presentation" /> }
