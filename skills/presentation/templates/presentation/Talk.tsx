import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './__SLUG__.css'

/** __TITLE__ */
export default function Talk() {
  return <Presentation steps={STEPS} title="__TITLE__" initialMode="browse" className="__SLUG__-talk" />
}
