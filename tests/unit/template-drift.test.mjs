import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { BOOTSTRAP, ROOT, expectedTemplateFiles, templateDrift } from '../../scripts/sync-template.mjs'

describe('bootstrap template alignment', () => {
  it('keeps the kit, verify/inspect scripts, and shared app files aligned with the canonical copies', () => {
    expect(templateDrift()).toEqual([])
  })

  it('byte-aligns every non-test kit file with src/presentation-kit', () => {
    const files = Object.keys(expectedTemplateFiles()).filter((f) => f.startsWith('src/presentation-kit/'))
    expect(files.length).toBeGreaterThan(15)
    for (const rel of files) {
      expect(fs.readFileSync(path.join(BOOTSTRAP, rel)).equals(fs.readFileSync(path.join(ROOT, rel))), rel).toBe(true)
    }
  })

  it('ships no template kit files that the canonical kit lacks', () => {
    const list = (dir) =>
      fs.readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.relative(dir, path.join(e.parentPath, e.name)))
    const canonical = new Set(list(path.join(ROOT, 'src/presentation-kit')).filter((f) => !f.startsWith('__tests__')))
    for (const rel of list(path.join(BOOTSTRAP, 'src/presentation-kit'))) expect(canonical.has(rel), rel).toBe(true)
  })

  it('has no styling framework or tests in the template', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(BOOTSTRAP, 'package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter((d) => /tailwind|vitest|jsdom|testing-library/.test(d))).toEqual([])
  })
})

describe('verification scripts', () => {
  it('use the IPv4 loopback address and never localhost', () => {
    for (const file of ['verify.mjs', 'inspect-presentation.mjs', 'lib/preview.mjs']) {
      const source = fs.readFileSync(path.join(ROOT, 'scripts', file), 'utf8')
      expect(source, file).not.toMatch(/localhost/i)
    }
    expect(fs.readFileSync(path.join(ROOT, 'scripts/lib/preview.mjs'), 'utf8')).toContain("HOST = '127.0.0.1'")
  })
})
