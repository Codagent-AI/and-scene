import { motion } from 'motion/react';
import { Presentation } from '../../../src/presentation-kit/Presentation';
import type { SceneProps, Step } from '../../../src/presentation-kit/types';
import './fixture.css';
function Scene({ payload }: SceneProps<number>) {
  return <div style={{ position: 'absolute', inset: 0 }}>
    <span data-presentation-entity="collision-a" style={{ position: 'absolute', left: 50, top: 80 }}>Collision alpha</span>
    <span data-presentation-entity="collision-b" {...(payload !== 0 ? { 'data-presentation-allow-overlap': true } : {})} style={{ position: 'absolute', left: 80, top: 80 }}>Collision beta</span>
    {payload === 2 && <motion.span data-presentation-entity="newcomer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .45, duration: .25 }} style={{ position: 'absolute', left: 50, top: 150 }}>Settled newcomer</motion.span>}
  </div>;
}
const steps: Step<number>[] = [0, 1, 2].map(index => ({ id: `fixture-${index + 1}`, era: ['Short', 'A longer era', 'Last'][index], title: `Fixture ${index + 1}`, caption: 'Fixture caption.', Scene, payload: index, groupKey: 'fixture' }));
export function Clean() {
  return <Presentation className="fixture clean" steps={steps.map(step => ({ ...step, payload: 2 }))} initialMode="browse" />;
}
export default function Defective() {
  return <Presentation className="fixture defective" steps={steps} initialMode="browse" />;
}
