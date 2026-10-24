import { defineStep, type AnyStep, type SceneProps } from '../../src/presentation-kit'

export function Blank(_props: SceneProps<undefined>) { // eslint-disable-line @typescript-eslint/no-unused-vars
  return <div data-testid="scene" />
}

export const makeSteps = (n: number, era = (i: number) => `era-${Math.floor(i / 2)}`): AnyStep[] =>
  Array.from({ length: n }, (_, i) =>
    defineStep({
      id: `s${i}`,
      era: era(i),
      title: `Title ${i}`,
      caption: `Caption ${i}`,
      Scene: Blank,
      payload: undefined,
    }),
  )

export function setViewport(width: number, height = 900) {
  Object.assign(window, { innerWidth: width, innerHeight: height })
  window.dispatchEvent(new Event('resize'))
}
