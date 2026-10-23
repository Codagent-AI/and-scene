import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps/steps.ts'
import './talk.css'

export default function Talk() {
  return <Presentation className="__SLUG__" steps={STEPS} title=__TITLE_JSON__ initialMode="browse" />
}
