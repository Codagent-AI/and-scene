import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..', '..')
const kitRoot = join(repoRoot, 'src', 'presentation-kit')

function kitSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return kitSourceFiles(path)
    return /\.(ts|tsx|css)$/.test(name) ? [path] : []
  })
}

const files = kitSourceFiles(kitRoot).map((path) => ({
  path: relative(repoRoot, path),
  source: readFileSync(path, 'utf8'),
}))

// Style properties the kit must never set. Layout geometry (position, inset,
// width, height, transform, display, flex) is allowed; visual treatment is not.
const forbiddenStyleKeys =
  /\b(color|background\w*|border\w*|outline\w*|box-?shadow|text-?shadow|font\w*|fontFamily|letter-?spacing|opacity-default|margin\w*|padding\w*|gap|filter|backdrop\w*|rounded\w*|radius\w*)\s*[:=]/i

describe('scene kit style neutrality', () => {
  it('finds kit sources to inspect', () => {
    expect(files.length).toBeGreaterThan(5)
  })

  it.each(files.map((file) => [file.path, file.source]))(
    '%s sets no visual style defaults',
    (_path, source) => {
      const offenders = source
        .split('\n')
        .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
        .filter((line) => forbiddenStyleKeys.test(line) || /#[0-9a-f]{3,8}\b/i.test(line))
      expect(offenders).toEqual([])
    },
  )

  it('imports no styling framework', () => {
    for (const file of files) {
      expect(file.source, file.path).not.toMatch(/tailwind|styled-components|@emotion|@mui|bootstrap/i)
    }
  })

  it('keeps the kit free of imports from presentations or host files', () => {
    for (const file of files) {
      expect(file.source, file.path).not.toMatch(/from\s+['"][./]*(presentations|Landing|main|router)/)
    }
  })

  it('adds no styling framework to package.json', () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(names.filter((name) => /tailwind|styled|emotion|mui|bootstrap/.test(name))).toEqual([])
  })
})
