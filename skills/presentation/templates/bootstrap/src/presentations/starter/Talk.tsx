import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps/index.ts'

// Intentionally unstyled: a presentation adds its own CSS next to this file.
export default function Talk() {
  return <Presentation steps={STEPS} title="Starter Presentation" initialMode="browse" />
}
