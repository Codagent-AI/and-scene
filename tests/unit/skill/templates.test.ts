// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { scanDir, walk } from '../helpers/styleScan.ts'

const TEMPLATES = 'skills/presentation/templates'

describe('template neutrality (L-35)', () => {
  it('ships no presentation styling in the bootstrap or presentation templates', () => {
    expect(scanDir(TEMPLATES)).toEqual([])
  })

  it('declares no styling framework in any template manifest or config', () => {
    for (const file of walk(TEMPLATES, (f) => /(package\.json|vite\.config\.ts|eslint\.config\.js|tsconfig.*\.json)$/.test(f))) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/tailwind/i)
    }
  })

  it('has a bootstrap that builds without a CSS framework plugin', () => {
    expect(readFileSync(path.join(TEMPLATES, 'bootstrap/vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
  })

  it('registers an unstyled two-step starter (C-6)', () => {
    const starter = path.join(TEMPLATES, 'bootstrap/src/presentations/starter')
    expect(walk(starter).some((f) => f.endsWith('.css'))).toBe(false)
    const steps = readFileSync(path.join(starter, 'steps/index.ts'), 'utf8')
    expect(steps.match(/\bid:/g)).toHaveLength(2)
    expect(readFileSync(path.join(TEMPLATES, 'bootstrap/src/presentations/index.ts'), 'utf8')).toMatch(/slug: 'starter'[\s\S]*Talk\.tsx/)
    expect(JSON.parse(readFileSync(path.join(TEMPLATES, 'bootstrap/presentation.config.json'), 'utf8'))).toEqual({ referenceSample: null })
  })
})

describe('template alignment (L-75)', () => {
  it('keeps the shared kit, shell and scripts byte-aligned with the canonical copies', () => {
    expect(() => execFileSync('node', ['scripts/sync-templates.mjs', '--check'], { stdio: 'pipe' })).not.toThrow()
  })
})
