import { Presentation } from '../../presentation-kit/Presentation'
import type { Step } from '../../presentation-kit/types'
import { STEP } from './steps/01-introduction'

const steps: Step<{ label: string }>[] = [STEP]
export default function Talk() { return <Presentation steps={steps} title="Starter presentation" /> }
