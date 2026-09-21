import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const skillRoot = join(process.cwd(), 'skills/presentation')
const bootstrap = join(skillRoot, 'templates/bootstrap')
const canonicalKit = join(process.cwd(), 'src/presentation-kit')
const templateKit = join(bootstrap, 'src/presentation-kit')

function filesUnder(root: string, base = root): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name)
    return entry.isDirectory() ? filesUnder(path, base) : [relative(base, path)]
  }).sort()
}

describe('presentation skill bootstrap contract', () => {
  it('ships the complete dependency contract and local helpers', () => {
    const packageJson = JSON.parse(readFileSync(join(bootstrap, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string>; scripts: Record<string, string> }
    for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) expect(packageJson.dependencies[dependency]).toBeTruthy()
    for (const dependency of ['vite', 'typescript', 'eslint', 'playwright', '@playwright/test']) expect(packageJson.devDependencies[dependency]).toBeTruthy()
    expect(statSync(join(bootstrap, 'package-lock.json')).isFile()).toBe(true)
    expect(packageJson.scripts.verify).toBeTruthy()
    expect(packageJson.scripts.inspect).toBeTruthy()
  })

  it('keeps the bootstrap kit byte-aligned with the canonical kit', () => {
    const canonicalFiles = filesUnder(canonicalKit).filter((file) => !file.includes('__tests__'))
    const templateFiles = filesUnder(templateKit)
    expect(templateFiles).toEqual(canonicalFiles)
    for (const file of canonicalFiles) {
      expect(readFileSync(join(templateKit, file), 'utf8')).toBe(readFileSync(join(canonicalKit, file), 'utf8'))
    }
  })

  it('keeps the shared visual diagnostics byte-aligned with the root helper', () => {
    expect(readFileSync(join(bootstrap, 'scripts/visual-diagnostics.mjs'), 'utf8')).toBe(readFileSync(join(process.cwd(), 'scripts/visual-diagnostics.mjs'), 'utf8'))
  })

  it('does not put a styling system or visual defaults in the reusable kit', () => {
    const source = filesUnder(templateKit).map((file) => readFileSync(join(templateKit, file), 'utf8')).join('\n')
    expect(source).not.toMatch(/tailwind|theme-|#[0-9a-f]{3,8}|font-family|box-shadow/i)
  })
})

describe('canonical app dogfoods the template import convention', () => {
  it('resolves the @presentation-kit alias like the bootstrap template does', () => {
    expect(readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8')).toMatch(/'@presentation-kit':/)
    expect(readFileSync(join(process.cwd(), 'tsconfig.app.json'), 'utf8')).toMatch(/"@presentation-kit"/)
  })

  it('imports the kit through the alias in the committed reference sample', () => {
    const sampleRoot = join(process.cwd(), 'src/presentations/how-to-make-a-presentation')
    const kitImporters = filesUnder(sampleRoot)
      .filter((name) => name.endsWith('.ts') || name.endsWith('.tsx'))
      .map((name) => readFileSync(join(sampleRoot, name), 'utf8'))
      .filter((source) => source.includes('presentation-kit'))

    expect(kitImporters.length).toBeGreaterThan(0)
    for (const source of kitImporters) expect(source).toMatch(/from '@presentation-kit'/)
  })
})
