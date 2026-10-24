import { Presentation } from '../../../src/presentation-kit'
import { STEPS } from './steps'

/** Host text fixed over the header chrome: a text/chrome collision without an allow-overlap marker. */
export default function Collide() {
  return (
    <>
      <Presentation steps={STEPS.slice(0, 1)} title="Collide fixture" />
      <p style={{ position: 'fixed', top: 4, left: 4, margin: 0 }}>host text over chrome</p>
    </>
  )
}
