// Test-only spy over `motion/react`: wraps the real components so tests can read the props each
// motion element was rendered with (layoutId, layout, transition, initial/animate/exit) and track
// AnimatePresence children and LayoutGroup mounts. Real components still render and animate.
// Used through vi.mock in the kit's component tests; never imported by the application.
import {
  Children,
  createElement,
  forwardRef,
  isValidElement,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react'

type MotionModule = typeof import('motion/react')
type Props = Record<string, unknown>

export interface RenderRecord {
  tag: string
  /** Stable per mounted instance. */
  instance: number
  props: Props
}

export interface PresenceRecord {
  instance: number
  /** Keys of the direct children AnimatePresence was given on this render. */
  childKeys: string[]
}

export interface GroupRecord {
  instance: number
  event: 'mount' | 'unmount'
}

export const motionLog = {
  renders: [] as RenderRecord[],
  presence: [] as PresenceRecord[],
  groups: [] as GroupRecord[],
}

let nextInstance = 1

export function resetMotionLog(): void {
  motionLog.renders.length = 0
  motionLog.presence.length = 0
  motionLog.groups.length = 0
}

/** Latest render of the motion element carrying this kit `data-presentation-id`. */
export function latestById(id: string): RenderRecord | undefined {
  return [...motionLog.renders].reverse().find((r) => r.props['data-presentation-id'] === id)
}

/** Latest render of the motion element whose className matches (used for Appear wrappers). */
export function latestByClass(className: string): RenderRecord | undefined {
  return [...motionLog.renders].reverse().find((r) => r.props.className === className)
}

/** React escapes keys inside Children.toArray (`=` to `=0`, `:` to `=2`, prefix `.$`); undo it. */
function unescapeKey(key: string): string {
  return key.replace(/^\.\$/, '').replace(/=([02])/g, (_m, code: string) => (code === '0' ? '=' : ':'))
}

function childKeys(children: ReactNode): string[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement(child) && child.key !== null ? [unescapeKey(String(child.key))] : [],
  )
}

export function spyOnMotion(actual: MotionModule): MotionModule {
  const tagComponents = new Map<string, ComponentType<Props>>()
  const realMotion = actual.motion as unknown as Record<string, ComponentType<Props>>

  const motion = new Proxy({} as Record<string, ComponentType<Props>>, {
    get(_target, tag) {
      if (typeof tag !== 'string') return undefined
      let spied = tagComponents.get(tag)
      if (!spied) {
        const Real = realMotion[tag]
        spied = forwardRef<unknown, Props>(function SpiedMotion(props, ref) {
          const [instance] = useState(() => nextInstance++)
          motionLog.renders.push({ tag, instance, props })
          return createElement(Real, { ...props, ref })
        })
        tagComponents.set(tag, spied)
      }
      return spied
    },
  }) as unknown as MotionModule['motion']

  function SpiedAnimatePresence(props: Props & { children?: ReactNode }) {
    const [instance] = useState(() => nextInstance++)
    motionLog.presence.push({ instance, childKeys: childKeys(props.children) })
    return createElement(actual.AnimatePresence, props)
  }

  function SpiedLayoutGroup(props: Props & { children?: ReactNode }) {
    const [instance] = useState(() => nextInstance++)
    useEffect(() => {
      motionLog.groups.push({ instance, event: 'mount' })
      return () => {
        motionLog.groups.push({ instance, event: 'unmount' })
      }
    }, [instance])
    return createElement(actual.LayoutGroup, props)
  }

  return {
    ...actual,
    motion,
    AnimatePresence: SpiedAnimatePresence as unknown as MotionModule['AnimatePresence'],
    LayoutGroup: SpiedLayoutGroup as unknown as MotionModule['LayoutGroup'],
  }
}
