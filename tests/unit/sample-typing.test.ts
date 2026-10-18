import { describe, expect, it } from 'vitest'
import { read, ROOT } from './helpers'

describe('sample type safety at the Presentation boundary', () => {
  it.each(['Talk.tsx', 'steps.ts'])('%s has no casts, any, or suppression directives', (file) => {
    const src = read(ROOT, 'src/presentations/how-to-make-a-presentation', file)
    expect(src).not.toMatch(/\bas\s+(any|unknown|never|[A-Z]\w*(<|\b))/)
    expect(src).not.toMatch(/:\s*any\b|<any>|@ts-(ignore|expect-error|nocheck)/)
  })

  it('passes the typed step array straight to Presentation', () => {
    expect(read(ROOT, 'src/presentations/how-to-make-a-presentation/steps.ts')).toMatch(/STEPS: Step<ScenePayload>\[\]/)
    expect(read(ROOT, 'src/presentations/how-to-make-a-presentation/Talk.tsx')).toMatch(/steps=\{STEPS\}/)
  })
})
