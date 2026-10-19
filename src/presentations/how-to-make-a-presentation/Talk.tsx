import { Box, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'

function Scene({ stepIndex }: SceneProps) {
  return (
    <SceneLayer>
      <Box id="you" x={40} y={40} w={120} h={60} label="you" emphasis={stepIndex > 0} />
    </SceneLayer>
  )
}

const STEPS: Step[] = [
  { id: 'a', era: 'the ask', title: 'You have a topic', caption: 'x', Scene, groupKey: 'main' },
  { id: 'b', era: 'the ask', title: 'The skill interviews you', caption: 'y', Scene, groupKey: 'main' },
]

export default function Talk() {
  return <Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />
}
