import type { SceneProps } from '../../presentation-kit'

export type StepModel = { label: string }

export function Scene({ payload }: SceneProps<StepModel>) {
  return <section className="scene">
    <p className="scene-label">{payload.label}</p>
  </section>
}
