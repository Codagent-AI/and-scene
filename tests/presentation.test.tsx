import { act, fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { Presentation } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
import { fitScale } from '../src/presentation-kit/useFitScale'
import { attributionUrl } from '../src/presentation-kit/chrome/Footer'

function Diagram({ payload }: SceneProps<number>) {
  return <span>Diagram {payload}</span>
}

const steps: Step<number>[] = [
  { id: 'one', era: 'Start', title: 'First', caption: 'Caption one', Scene: Diagram, payload: 1, groupKey: 'demo' },
  { id: 'two', era: 'Start', title: 'Second', caption: 'Caption two', Scene: Diagram, payload: 2, groupKey: 'demo' },
  { id: 'three', era: 'Finish', title: 'Third', caption: 'Caption three', Scene: Diagram, payload: 3, groupKey: 'demo' },
  { id: 'four', era: 'Finish', title: 'Fourth', caption: 'Caption four', Scene: Diagram, payload: 4, groupKey: 'demo' },
]
const key = (value: string, target: Document | HTMLElement = document) => fireEvent.keyDown(target, { key: value })
const root = () => screen.getByRole('main')
const index = () => Number(root().getAttribute('data-step-index'))

test('typed scene step, caption, canvas and numbering follow the ordered data', () => {
  const view = render(<Presentation title="Fixture" steps={steps} />)
  expect(root().getAttribute('data-presentation-step-id')).toBe('one')
  expect(root().getAttribute('data-presentation-era-name')).toBe('Start')
  expect(screen.getByText('Diagram 1')).toBeTruthy()
  expect(screen.getByText('Caption one')).toBeTruthy()
  expect(screen.getByText('1 / 4')).toBeTruthy()
  const canvas = root().querySelector<HTMLElement>('[data-presentation-canvas]')!
  expect([canvas.style.width, canvas.style.height]).toEqual(['880px', '380px'])

  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  expect(index()).toBe(1)
  expect(screen.getByText('Caption two')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
  expect(index()).toBe(0)
  expect(screen.getByText('Caption one')).toBeTruthy()

  const inserted = { ...steps[3], id: 'inserted', title: 'Inserted', payload: 5 }
  view.rerender(<Presentation title="Fixture" steps={[inserted, steps[2], steps[0]]} />)
  expect(root().getAttribute('data-presentation-step-id')).toBe('inserted')
  expect(screen.getByText('Diagram 5')).toBeTruthy()
  expect(screen.getByText('1 / 3')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Step 2: Third' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Step 2: Second' })).toBeNull()
})

test('attribution links to the repository and header branding is opt-in', () => {
  const view = render(<Presentation title="Fixture" steps={steps} />)
  const link = screen.getByRole('link', { name: 'made by and-scene' })
  expect(link.getAttribute('href')).toBe(attributionUrl)
  expect(attributionUrl).toBe('https://github.com/Codagent-AI/and-scene')
  expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
  expect(link.closest('footer')).toBeTruthy()
  expect(screen.queryByRole('banner')!.querySelector('a')).toBeNull()
  view.rerender(<Presentation title="Fixture" steps={steps} brand={<a href="/">Home</a>} />)
  expect(screen.getByRole('link', { name: 'Home' }).closest('header')).toBeTruthy()
})

test('initial modes, responsive chrome and toggling preserve position', () => {
  const view = render(<Presentation title="Fixture" steps={steps} initialMode="present" />)
  expect(root().getAttribute('data-presentation-mode')).toBe('present')
  expect(screen.getByRole('heading', { name: 'First' })).toBeTruthy()
  expect(screen.getByText('1 / 4')).toBeTruthy()
  expect(screen.queryByText('Caption one')).toBeNull()
  expect(screen.queryByRole('navigation')).toBeNull()

  key('ArrowRight')
  key('p')
  expect(root().getAttribute('data-presentation-mode')).toBe('browse')
  expect(index()).toBe(1)
  expect(screen.getByRole('heading', { name: 'Second' })).toBeTruthy()
  expect(screen.getByText('Caption two')).toBeTruthy()
  expect(screen.getByRole('navigation', { name: 'Table of contents' })).toBeTruthy()
  expect(screen.getByRole('navigation', { name: 'Step navigation' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Previous' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy()
  key('P')
  expect(index()).toBe(1)
  expect(root().getAttribute('data-presentation-mode')).toBe('present')
  view.unmount()

  vi.spyOn(window, 'matchMedia').mockImplementation(media => ({
    media, matches: false, addEventListener() {}, removeEventListener() {},
  }) as MediaQueryList)
  render(<Presentation title="Fixture" steps={steps} initialMode="browse" />)
  expect(root().getAttribute('data-presentation-mode')).toBe('browse')
  expect(screen.queryByRole('navigation', { name: 'Table of contents' })).toBeNull()
  expect(screen.getByRole('navigation', { name: 'Step navigation' })).toBeTruthy()
})

test('key, touch and button navigation clamps and leaves focused controls alone', () => {
  render(<Presentation title="Fixture" steps={steps} />)
  expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true)
  key('ArrowLeft')
  expect(index()).toBe(0)
  for (const [position, value] of ['ArrowRight', ' ', 'PageDown'].entries()) {
    key(value)
    expect(index()).toBe(position + 1)
  }
  key('ArrowRight')
  expect(index()).toBe(3)
  expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true)
  for (const [position, value] of ['ArrowLeft', 'PageUp'].entries()) {
    key(value)
    expect(index()).toBe(2 - position)
  }

  const next = screen.getByRole('button', { name: 'Next' })
  next.focus()
  expect(key(' ', next)).toBe(true)
  expect(key('ArrowRight', next)).toBe(true)
  expect(index()).toBe(1)
  fireEvent.click(next)
  expect(index()).toBe(2)

  const swipe = (x: number, y: number) => {
    fireEvent.touchStart(root(), { touches: [{ clientX: 150, clientY: 100 }] })
    fireEvent.touchEnd(root(), { changedTouches: [{ clientX: x, clientY: y }] })
  }
  swipe(40, 105)
  expect(index()).toBe(3)
  swipe(40, 105)
  expect(index()).toBe(3)
  swipe(220, 100)
  expect(index()).toBe(2)
  swipe(220, 220)
  expect(index()).toBe(2)
})

test('progress and era jumps update current semantics and styling hooks', () => {
  render(<Presentation title="Fixture" steps={steps} />)
  const last = screen.getByRole('button', { name: 'Step 4: Fourth' })
  const finish = screen.getByRole('button', { name: 'Finish' })
  const start = screen.getByRole('button', { name: 'Start' })
  fireEvent.click(last)
  expect(index()).toBe(3)
  for (const control of [last, finish]) {
    expect(control.getAttribute('aria-current')).toBe('step')
    expect(control.hasAttribute('data-presentation-active')).toBe(true)
  }
  expect(start.hasAttribute('aria-current')).toBe(false)
  fireEvent.click(finish)
  expect(index()).toBe(2)
  expect(last.hasAttribute('data-presentation-active')).toBe(false)
  fireEvent.click(start)
  expect(index()).toBe(0)
})

test('fit geometry scales uniformly without reflow or step-dependent changes', () => {
  expect(fitScale(904, 396, 880, 380, 'browse')).toBe(1)
  expect(fitScale(904, 388, 880, 380, 'present')).toBe(1)
  expect(fitScale(904, 388, 880, 380, 'browse')).toBeLessThan(1)
  expect(fitScale(464, 800, 880, 380, 'browse')).toBe(0.5)
  expect(fitScale(0, 0, 880, 380, 'present')).toBe(0)

  let measure = () => {}
  let viewportWidth = 904
  let viewportHeight = 400
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => viewportWidth)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => viewportHeight)
  vi.spyOn(window, 'ResizeObserver').mockImplementation(function (callback: ResizeObserverCallback) {
    measure = () => callback([], {} as ResizeObserver)
    return { observe() {}, disconnect() {}, unobserve() {} }
  })
  const view = render(<Presentation title="Fixture" steps={steps} />)
  const canvas = root().querySelector<HTMLElement>('[data-presentation-canvas]')!
  expect(canvas.style.transform).toBe('scale(1)')
  key('ArrowRight')
  expect(canvas.style.transform).toBe('scale(1)')
  viewportWidth = 464
  viewportHeight = 400
  act(measure)
  expect(canvas.style.transform).toBe('scale(0.5)')
  expect([canvas.style.width, canvas.style.height]).toEqual(['880px', '380px'])
  view.rerender(<Presentation title="Fixture" steps={steps} width={440} height={190} />)
  expect([canvas.style.width, canvas.style.height, canvas.style.transform]).toEqual(['440px', '190px', 'scale(1)'])
})
