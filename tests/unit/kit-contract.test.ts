import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '../..')
const kitDir = path.join(root, 'src/presentation-kit')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const kitFiles = walk(kitDir)
const readJson = (file: string) => JSON.parse(readFileSync(path.join(root, file), 'utf8'))

describe('style-neutral kit contract', () => {
  it('ships only TypeScript sources, never stylesheets', () => {
    expect(kitFiles.length).toBeGreaterThan(10)
    for (const file of kitFiles) expect(file).toMatch(/\.tsx?$/)
  })

  it('declares no visual defaults: colors, fonts, borders, shadows, themes', () => {
    const forbiddenProperty =
      /(?<![A-Za-z])(color|background\w*|font\w*|border\w*|boxShadow|textShadow|outline\w*|fill)\s*:/
    const forbiddenValue = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|var\(--/
    for (const file of kitFiles) {
      const source = readFileSync(file, 'utf8')
      expect(source, file).not.toMatch(forbiddenProperty)
      expect(source, file).not.toMatch(forbiddenValue)
      expect(source, file).not.toMatch(/\.css['"]/)
      expect(source.toLowerCase(), file).not.toContain('tailwind')
    }
  })

  it('only uses currentColor for strokes so author text color drives drawings', () => {
    const uses = kitFiles.flatMap((f) => readFileSync(f, 'utf8').match(/currentColor/g) ?? [])
    expect(uses.length).toBeGreaterThan(0)
  })

  it('only imports react, motion and lucide-react from outside the kit', () => {
    for (const file of kitFiles) {
      const imports = [...readFileSync(file, 'utf8').matchAll(/from '([^'.][^']*)'/g)].map((m) => m[1])
      for (const spec of imports) expect(['react', 'motion/react', 'lucide-react'], `${file}: ${spec}`).toContain(spec)
    }
  })

  it('does not require a styling framework in the project manifest', () => {
    const pkg = readJson('package.json')
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter((d) => /tailwind|styled-components|emotion|bootstrap/.test(d))).toEqual([])
    const vite = readFileSync(path.join(root, 'vite.config.ts'), 'utf8')
    expect(vite).not.toMatch(/tailwind/i)
  })
})

describe('repository conventions', () => {
  it('keeps npm test to unit tests and the slower suites in another script', () => {
    const scripts = readJson('package.json').scripts
    expect(scripts.test).toContain('vitest.config.ts')
    expect(scripts.test).not.toContain('integration')
    expect(scripts['test:integration']).toContain('vitest.integration.config.ts')
    for (const name of ['verify', 'inspect', 'build', 'lint']) expect(scripts[name]).toBeTruthy()
  })

  it('uses the IPv4 loopback address in browser automation, never localhost', () => {
    for (const file of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs']) {
      const source = readFileSync(path.join(root, file), 'utf8')
      expect(source, file).not.toMatch(/localhost/)
    }
    expect(readFileSync(path.join(root, 'scripts/lib/preview.mjs'), 'utf8')).toContain("'127.0.0.1'")
  })

  it('does not add hosted CI configuration or commit generated output', () => {
    const tracked = readFileSync(path.join(root, '.gitignore'), 'utf8')
    for (const ignored of ['node_modules', 'dist', 'inspection']) expect(tracked).toContain(ignored)
    expect(() => statSync(path.join(root, '.github'))).toThrow()
  })
})
