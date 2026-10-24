import { Presentation } from '__KIT__'
import './style.css'
import { STEPS } from './steps.ts'

export default function Talk() {
  return <Presentation steps={STEPS} title={__TITLE_JSON__} initialMode="browse" />
}
