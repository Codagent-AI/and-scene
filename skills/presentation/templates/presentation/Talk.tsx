import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps.ts'
import './talk.css'

export default function Talk() {
  return <Presentation className="p-__SLUG__" steps={STEPS} title="__TITLE__" initialMode="browse" />
}
