import { Presentation } from '__KIT__'
import './talk.css'
import { STEPS } from './steps/index.ts'

export default function Talk() {
  return <Presentation steps={STEPS} title={__TITLE_JSON__} initialMode="browse" />
}
