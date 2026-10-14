// TEST-ONLY fixture for the screenshot helper (INT-002). It is registered only when
// the app is built with VITE_INSPECT_FIXTURE=1 (see src/presentations/index.ts), so it
// never ships in the production registry. It intentionally applies NO chrome CSS:
// default active chrome is indistinct and the default attribution link is unpolished.
import { motion } from 'motion/react'
import { Presentation } from '../../presentation-kit'
import type { Step } from '../../presentation-kit'

const spot = { position: 'absolute', left: 300, top: 140 } as const

const steps: Step[] = [
  {
    id: 'clean',
    era: 'fixture',
    title: 'Clean',
    caption: 'No collisions.',
    Scene: () => <span style={{ position: 'absolute', left: 40, top: 40 }}>clean scene</span>,
  },
  {
    id: 'collision',
    era: 'fixture',
    title: 'Collision',
    caption: 'Two unmarked texts share a spot.',
    Scene: () => (
      <>
        <span style={spot}>unmarked collision alpha</span>
        <span style={{ ...spot, top: 146 }}>unmarked collision beta</span>
      </>
    ),
  },
  {
    id: 'allowed',
    era: 'fixture',
    title: 'Allowed',
    caption: 'Marked overlap is readable and intentional.',
    Scene: () => (
      <div data-presentation-allow-overlap="">
        <span style={spot}>allowed overlap alpha</span>
        <span style={{ ...spot, top: 146 }}>allowed overlap beta</span>
      </div>
    ),
  },
  {
    id: 'delayed',
    era: 'fixture',
    title: 'Delayed',
    caption: 'An entity slides in late.',
    Scene: () => (
      <motion.span
        style={{ position: 'absolute', left: 40, top: 200 }}
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        delayed settled
      </motion.span>
    ),
  },
]

export default function Fixture() {
  return <Presentation steps={steps} title="Inspect fixture" initialMode="browse" />
}
