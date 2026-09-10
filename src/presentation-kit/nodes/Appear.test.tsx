// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { type ComponentProps } from 'react'
import { afterEach, expect, it, vi } from 'vitest'

let receivedProps: ComponentProps<'div'> & { initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown }

vi.mock('motion/react', () => ({
  motion: {
    div: (props: typeof receivedProps) => {
      receivedProps = props
      return <div />
    },
  },
}))

import { Appear } from './Appear'

afterEach(() => {
  receivedProps = {}
})

it('allows callers to override Appear animation defaults', () => {
  const transition = { duration: 1 }
  render(<Appear initial={{ opacity: 0.5 }} animate={{ opacity: 0.75 }} exit={{ opacity: 0.25 }} transition={transition} />)

  expect(receivedProps.initial).toEqual({ opacity: 0.5 })
  expect(receivedProps.animate).toEqual({ opacity: 0.75 })
  expect(receivedProps.exit).toEqual({ opacity: 0.25 })
  expect(receivedProps.transition).toBe(transition)
})
