import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { appendInspectionWarnings, findChromeWarnings } from './inspect-presentation.mjs'

const ROOT = join(import.meta.dirname, '..')

describe('verify entry point', () => {
  it('package.json exposes npm run verify', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.scripts?.verify).toBe('node --experimental-strip-types scripts/verify.mjs')
  })

  it('verify script exists', () => {
    expect(() => readFileSync(join(ROOT, 'scripts/verify.mjs'), 'utf-8')).not.toThrow()
  })

  it('package.json exposes npm run inspect for visual screenshots', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.scripts?.inspect).toBe(
      'node --experimental-strip-types scripts/inspect-presentation.mjs',
    )
  })

  it('inspect script exists', () => {
    expect(() => readFileSync(join(ROOT, 'scripts/inspect-presentation.mjs'), 'utf-8')).not.toThrow()
  })

  it('inspect scripts keep attribution quality diagnostics aligned', () => {
    for (const path of [
      join(ROOT, 'scripts/inspect-presentation.mjs'),
      join(ROOT, 'skills/presentation/templates/bootstrap/scripts/inspect-presentation.mjs'),
    ]) {
      const script = readFileSync(path, 'utf-8')
      expect(script).toContain('attribution is not rendered')
      expect(script).toContain('attribution is present but not visible')
    }
  })

  it('distinguishes absent and hidden attribution on every step', async () => {
    const page = {
      evaluate: async <T, A>(callback: (arg: A) => T, arg: A) => callback(arg),
    }

    document.body.innerHTML = ''
    expect(await findChromeWarnings(page, 'demo', 0)).toContain(
      'demo: attribution is not rendered; pass attribution={null} only for an intentional opt-out',
    )
    expect(await findChromeWarnings(page, 'demo', 1)).toContain(
      'demo: attribution is not rendered; pass attribution={null} only for an intentional opt-out',
    )

    document.body.innerHTML = '<a data-presentation-attribution style="display: none">made by and-scene</a>'
    expect(await findChromeWarnings(page, 'demo', 0)).toContain(
      'demo: attribution is present but not visible; style [data-presentation-attribution] in presentation CSS',
    )
  })

  it('reports each deck-level attribution warning category once', () => {
    const warnings: string[] = []
    const seenAttributionWarnings = new Set<string>()
    const absent = 'demo: attribution is not rendered; pass attribution={null} only for an intentional opt-out'
    const hidden = 'demo: attribution is present but not visible; style [data-presentation-attribution] in presentation CSS'

    appendInspectionWarnings(warnings, seenAttributionWarnings, [absent, absent])
    appendInspectionWarnings(warnings, seenAttributionWarnings, [absent, hidden])

    expect(warnings).toEqual([absent, hidden])
  })

  it('playwright is listed as a dev dependency', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.devDependencies?.playwright).toBeDefined()
  })
})
