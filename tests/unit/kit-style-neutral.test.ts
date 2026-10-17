import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const kitDir = join(__dirname, '..', '..', 'src', 'presentation-kit')

function kitSources(dir = kitDir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : kitSources(path)
    return [path]
  })
}

const files = kitSources()

describe('scene kit style neutrality', () => {
  it('ships only code: no stylesheets, assets or styling-framework files', () => {
    expect(files.length).toBeGreaterThan(10)
    for (const file of files) expect(file).toMatch(/\.(ts|tsx)$/)
  })

  it.each([
    ['hex colors', /#[0-9a-fA-F]{3,8}\b/],
    ['functional colors', /\b(?:rgba?|hsla?|oklch|oklab)\(/],
    ['fonts', /font-?family|fontFamily|fontSize|fontWeight/],
    ['shadows and glows', /box-?shadow|boxShadow|drop-?shadow|filter:/i],
    ['borders and radii', /border|radius/i],
    ['backgrounds', /background/i],
    ['spacing scale', /padding|margin|\bgap\b|spacing/i],
    ['css imports', /import\s+['"][^'"]+\.css['"]/],
    ['styling frameworks', /tailwind|styled-components|emotion|@apply/i],
    ['theme tokens', /--[a-z][\w-]*\s*:|theme/i],
  ])('contains no %s', (_label, pattern) => {
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      expect(source, file).not.toMatch(pattern)
    }
  })

  it('has no styling-framework dependency', () => {
    const pkg = JSON.parse(readFileSync(join(kitDir, '..', '..', 'package.json'), 'utf8'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(names.filter((n) => /tailwind|styled|emotion|bootstrap|@mui/.test(n))).toEqual([])
  })
})
