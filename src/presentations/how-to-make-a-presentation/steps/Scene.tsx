import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Check, Layers, UserRound, Sparkles } from 'lucide-react'
import {
  Appear,
  Arrow,
  Box,
  Frame,
  SceneLayer,
} from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { stateAt } from '../entities'
import { ENTER_DELAY, ENTER_T } from '../../../presentation-kit/constants'

function VerifyChecks() {
  const [passed, setPassed] = useState(false)
  useEffect(() => {
    const timer = setTimeout(
      () => setPassed(true),
      (ENTER_DELAY + ENTER_T) * 1000 + 350,
    )
    return () => clearTimeout(timer)
  }, [])
  return (
    <>
      <strong>verify</strong>
      <span data-check-state={passed ? 'passed' : 'checking'}>
        {passed && <Check size={13} />} build{passed ? ' ✓' : ' …'}
      </span>
      <span>render{passed ? ' ✓' : ' …'}</span>
    </>
  )
}
export function ReferenceScene({ payload: beat }: SceneProps<number>) {
  return (
    <SceneLayer>
      <AnimatePresence>
        {stateAt(beat).map((entity) => {
          const { id, kind, text, x, y, width, height } = entity
          const style = {
            position: 'absolute' as const,
            left: x,
            top: y,
            width,
            height,
          }
          const Node =
            kind === 'frame'
              ? Frame
              : ['arrow', 'link'].includes(kind)
                ? Arrow
                : Box
          let content = <>{text}</>
          if (kind === 'card')
            content = (
              <>
                <strong>{text}</strong>
                <span>title · caption · visual</span>
                <span className="mini-diagram">
                  <i />
                  <b>→</b>
                  <i />
                </span>
                {beat >= 8 && id.endsWith('card-3') && (
                  <em data-edited="true">edited</em>
                )}
              </>
            )
          if (kind === 'link')
            content = (
              <>
                <span>→</span>
                <small>{text}</small>
              </>
            )
          if (kind === 'person')
            content = (
              <>
                <UserRound size={20} />
                <strong>{text}</strong>
              </>
            )
          if (kind === 'skill')
            content = (
              <>
                <Sparkles size={19} />
                <strong>{text}</strong>
              </>
            )
          if (kind === 'socket')
            content = (
              <>
                <Layers size={15} />
                {text}
              </>
            )
          if (kind === 'verify') content = <VerifyChecks />
          if (kind === 'modify')
            content = (
              <>
                <span>{text}</span>
                <svg
                  width="186"
                  height="66"
                  viewBox="0 0 186 66"
                  aria-hidden="true"
                >
                  <path
                    d="M 155 0 Q 185 40 26 61 M 26 61 L 38 49 M 26 61 L 43 64"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </>
            )
          return (
            <Appear
              key={id}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            >
              <Node entityId={id} className={`entity ${kind}`} style={style}>
                {content}
              </Node>
            </Appear>
          )
        })}
      </AnimatePresence>
    </SceneLayer>
  )
}
