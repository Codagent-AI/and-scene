import { Presentation } from '../../presentation-kit'
import type { Step } from '../../presentation-kit'

function Scene() {
  return <div data-example-scene="" style={{ position: 'relative', width: '100%', height: '100%' }}>
    <div style={{ position: 'absolute', left: 320, top: 140 }}>Your presentation starts here</div>
  </div>
}

const steps: readonly Step[] = [{ id: 'welcome', era: 'Start', title: 'A scene begins', caption: 'Replace this example with your own evolving scene.', Scene, payload: undefined }]

export default function ExamplePresentation() {
  return <Presentation steps={steps} title="Example presentation" />
}
