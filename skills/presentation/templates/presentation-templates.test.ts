import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const templatesDir = __dirname

function read(relative: string): string {
  return readFileSync(path.join(templatesDir, relative), 'utf8')
}

describe('presentation templates', () => {
  // SKILL.md §3 documents presentation.css as "imported by Talk.tsx", and the
  // CSS template carries the narrow-viewport rule `npm run verify` gates on. A
  // Talk template that never imports it produces an unstyled presentation that
  // fails the skill's own self-verify step.
  it('imports the presentation stylesheet from Talk.tsx', () => {
    expect(read('presentation/Talk.tsx.template')).toContain("import './presentation.css'")
  })

  // Step templates materialize at src/presentations/<slug>/steps/, three levels
  // below src/, so kit imports need three levels of ascent. Talk.tsx and
  // entities.ts sit one level higher and need two.
  it('resolves presentation-kit imports from the depth each template lands at', () => {
    for (const relative of [
      'presentation/steps/Step.tsx.template',
      'presentation/steps/index.ts.template',
      'step/Step.tsx.template',
    ]) {
      const source = read(relative)
      const kitImports = [...source.matchAll(/from '(\.\.\/[^']*presentation-kit\/[^']*)'/g)].map((m) => m[1])
      expect(kitImports.length, `${relative} should import from the scene kit`).toBeGreaterThan(0)
      for (const specifier of kitImports) {
        expect(specifier, `${relative} imports ${specifier}`).toMatch(/^\.\.\/\.\.\/\.\.\/presentation-kit\//)
      }
    }
  })

  it('keeps Talk.tsx kit imports at the presentation-directory depth', () => {
    const kitImports = [...read('presentation/Talk.tsx.template').matchAll(/from '(\.\.\/[^']*presentation-kit\/[^']*)'/g)]
    expect(kitImports.length).toBeGreaterThan(0)
    for (const [, specifier] of kitImports) {
      expect(specifier).toMatch(/^\.\.\/\.\.\/presentation-kit\//)
    }
  })
})

describe('presentation css template', () => {
  it('scopes the browse-mode table of contents to wide viewports', () => {
    const css = read('presentation/presentation.css.template')
    expect(css).toMatch(/@media[^{]*max-width[^{]*\{/)
    expect(css).toContain("[data-presentation-chrome='toc']")
  })
})
