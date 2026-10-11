import { Scene } from '../Scene'

export const steps = [
  { id: 'start', era: 'Start', title: 'A scene begins', caption: 'A minimal, unstyled route that verifies the scene kit.', diagram: { scene: Scene, groupKey: 'starter', payload: { label: 'Your topic' } } },
  { id: 'next', era: 'Next', title: 'The scene evolves', caption: 'Stable entity identifiers let content persist across steps.', diagram: { scene: Scene, groupKey: 'starter', payload: { label: 'A new idea' } } },
] as const
