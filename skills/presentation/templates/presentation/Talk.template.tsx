/**
 * TEMPLATE — rename to Talk.tsx inside the new presentation's folder. Import
 * every step (in order) and compose them with the kit's <Presentation />.
 * Import presentation-owned CSS here so styling stays scoped to this folder.
 */
import { Presentation } from '../../presentation-kit'
import type { AnyStep } from '../../presentation-kit/types'
import './presentation.css'
// import { exampleStep } from './steps/Step.template'

const STEPS: AnyStep[] = [
  // exampleStep,
]

export default function Talk() {
  return <Presentation steps={STEPS} title="TODO: presentation title" initialMode="browse" />
}
