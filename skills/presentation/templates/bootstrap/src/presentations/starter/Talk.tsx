import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps.ts'

export default function Talk() {
  return <Presentation steps={STEPS} title={"Starter presentation"} initialMode="browse" />
}
