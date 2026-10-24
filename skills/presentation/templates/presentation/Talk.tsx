import { Presentation } from '../../presentation-kit/index.ts'
import './style.css'
import { STEPS } from './steps.ts'

export default function Talk() {
  return <Presentation steps={STEPS} title="__TITLE__" initialMode="browse" />
}
