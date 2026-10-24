import { Presentation } from '__KIT__'
import { STEPS } from './steps/index.ts'
import './style.css'

export default function Talk() {
  return <Presentation className="__SLUG__" steps={STEPS} title={__TITLE_JSON__} initialMode="browse" />
}
