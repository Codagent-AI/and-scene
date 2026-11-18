import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { visibleEntities } from '../entities'

/** A reading companion outside the scaled canvas; coordinates never reflow. */
export function SceneReader({ beat }: { beat: number }) {
  const [narrow, setNarrow] = useState(() => window.innerWidth <= 600)
  useEffect(() => {
    const resize = () => setNarrow(window.innerWidth <= 600)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  if (!narrow) return null
  const labels = visibleEntities(beat).filter(entity => entity.text)
  return createPortal(<aside className="sample-scene-reader" data-sample-scene-reader="" aria-label={`Scene reading key for step ${beat}`} tabIndex={0}
    style={{ fontSize: 14 }}
    onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) event.stopPropagation() }}
    onTouchStart={event => event.stopPropagation()} onTouchEnd={event => event.stopPropagation()}>
    <p>Scene reading key <span>· scroll for all labels</span></p>
    <ul>{labels.map(entity => <li key={entity.id} data-sample-reader-entity={entity.id}>
      {entity.kind === 'card' ? `${entity.text} — title, caption, visual` : entity.kind === 'connection' ? 'you ↔ the skill' : entity.kind === 'verify' ? '✓ verify — build + render, all steps pass' : entity.text}
    </li>)}</ul>
  </aside>, document.body)
}
