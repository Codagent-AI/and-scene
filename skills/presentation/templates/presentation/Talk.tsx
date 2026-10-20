import { Presentation } from '../../presentation-kit/Presentation.tsx'
import './talk.css'
import { STEPS } from './steps/index.ts'

export default function Talk() {
  return <Presentation steps={STEPS} title="__TITLE__" initialMode="browse" />
}
