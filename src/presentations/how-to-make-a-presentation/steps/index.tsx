import { AnimatePresence } from 'motion/react'
import { MessageCircle, Sparkles, Check, Blocks, User } from 'lucide-react'
import { Appear, Box, Label, Arrow, Frame, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import metadata from '../metadata.json'
import { entity, geometry, visibleEntities, type EntityName } from '../entities'
const content = {
  you: <><User size={18} /><strong>you</strong></>, prompt: <><MessageCircle size={14} /><span>A topic worth sharing</span></>,
  skill: <><Sparkles size={18} /><strong>the skill</strong></>, conversation: <span>←────────────────→</span>, question: <span>one question at a time</span>,
  tray: null, card1: <><small>01 / THE START</small><strong>A clear idea</strong><span>title · caption · visual</span></>,
  card2: <><small>02 / THE NEXT BEAT</small><strong>A new connection</strong><span>title · caption · visual</span></>,
  card3: <><small>03 / THE PAYOFF</small><strong>It comes together</strong><span>title · caption · visual</span></>,
  link1: <span>morph →</span>, link2: <span>morph →</span>, link3: <span>→</span>, ghost: <span>…</span>, depth: <span>your depth: partial ↔ full</span>,
  kit: <><Blocks size={17} /><span>shared scene kit · shapes + motion</span></>,
  verify: <><Check size={22} /><strong>verified</strong><span>build + render</span></>,
  modify: <><svg viewBox="0 0 450 99" data-modify-from="conversation" data-modify-to="card2" aria-label="Modify arc from conversation to edited card"><defs><marker id="modify-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" /></marker></defs><path className="modify-curve" d="M390 0 C390 80 0 50 0 99" markerEnd="url(#modify-arrow)" /></svg><span>modify in place</span></>, reveal: <span>This is one. Made with and-scene.</span>,
}
function SceneEntity({ name, beat }: { name: EntityName; beat: number }) {
  const Node = name === 'reveal' ? Frame : name.startsWith('link') || name === 'conversation' || name === 'modify' ? Arrow : ['question', 'depth'].includes(name) ? Label : Box
  return <Node entityId={entity(name)} className={`entity ${name}${name === 'card2' && beat >= 8 ? ' edited' : ''}`} style={geometry(name)} data-scene-name={name}>{content[name]}{name === 'card2' && beat >= 8 && <span className="edited-label">edited</span>}</Node>
}
export function StoryScene({ payload }: SceneProps<number>) {
  return <SceneLayer><AnimatePresence>{visibleEntities(payload).map(name => <Appear key={name} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}><SceneEntity name={name} beat={payload} /></Appear>)}</AnimatePresence></SceneLayer>
}
export const STEPS: Step<number>[] = metadata.map((meta, index) => ({ ...meta, Scene: StoryScene, payload: index + 1, groupKey: 'conversation' }))
