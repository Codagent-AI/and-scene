import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { cwd } from 'node:process'
import { describe, expect, it } from 'vitest'

const ROOT = cwd()
const TEMPLATE = join(ROOT, 'skills/presentation/templates/bootstrap')

/** Every file under `dir` that is not a test, as a sorted list of relative paths. */
function nonTestFiles(dir) {
  const found = []
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const path = join(current, entry)
      if (statSync(path).isDirectory()) {
        if (entry !== '__tests__') walk(path)
      } else if (!/\.test\./.test(entry)) {
        found.push(relative(dir, path))
      }
    }
  }
  walk(dir)
  return found.sort()
}

describe('canonical kit and bootstrap copy stay byte-aligned', () => {
  it('has identical non-test file sets, rejecting missing or extra files', () => {
    const canonical = nonTestFiles(join(ROOT, 'src/presentation-kit'))
    const copy = nonTestFiles(join(TEMPLATE, 'src/presentation-kit'))
    expect(copy).toEqual(canonical)
    expect(canonical.length).toBeGreaterThan(15)
  })

  it('has identical bytes in every non-test kit file', () => {
    for (const file of nonTestFiles(join(ROOT, 'src/presentation-kit'))) {
      const canonical = readFileSync(join(ROOT, 'src/presentation-kit', file))
      const copy = readFileSync(join(TEMPLATE, 'src/presentation-kit', file))
      expect(copy.equals(canonical), file).toBe(true)
    }
  })
})

describe('verification and inspection scripts stay aligned with the bootstrap copies', () => {
  // reference.mjs is the one documented sample-specific script: it names the reference outline.
  const shared = ['verify.mjs', 'inspect-presentation.mjs', 'lib/outline.mjs', 'lib/preview.mjs', 'lib/diagnostics.mjs', 'lib/collect.mjs', 'lib/paths.mjs']

  it.each(shared)('keeps %s byte-identical', (file) => {
    expect(readFileSync(join(TEMPLATE, 'scripts', file)).equals(readFileSync(join(ROOT, 'scripts', file)))).toBe(true)
  })

  it('differs only in the reference outline', () => {
    const rootReference = readFileSync(join(ROOT, 'scripts/reference.mjs'), 'utf8')
    const copyReference = readFileSync(join(TEMPLATE, 'scripts/reference.mjs'), 'utf8')
    expect(copyReference).not.toBe(rootReference)
    expect(copyReference).toContain("slug: 'starter'")
    expect(rootReference).toContain("slug: 'how-to-make-a-presentation'")
  })
})

describe('bootstrap scaffold contract', () => {
  const pkg = JSON.parse(readFileSync(join(TEMPLATE, 'package.json'), 'utf8'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }

  it('has the three anchors', () => {
    expect(existsSync(join(TEMPLATE, 'vite.config.ts'))).toBe(true)
    expect(existsSync(join(TEMPLATE, 'src/presentation-kit/index.ts'))).toBe(true)
    expect(existsSync(join(TEMPLATE, 'src/presentations/index.ts'))).toBe(true)
    expect(existsSync(join(TEMPLATE, 'src/main.tsx'))).toBe(true)
  })

  it('declares the full required dependency set', () => {
    const required = [
      'react',
      'react-dom',
      'motion',
      'lucide-react',
      'vite',
      '@vitejs/plugin-react',
      'typescript',
      '@types/react',
      '@types/react-dom',
      '@types/node',
      'eslint',
      '@eslint/js',
      'typescript-eslint',
      'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh',
      'globals',
      'playwright',
    ]
    expect(required.filter((name) => !(name in deps))).toEqual([])
  })

  it('declares no styling framework', () => {
    expect(Object.keys(deps).filter((name) => /tailwind/i.test(name))).toEqual([])
    expect(readFileSync(join(TEMPLATE, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
  })

  it('ships a lock file that pins the declared dependencies', () => {
    const lock = JSON.parse(readFileSync(join(TEMPLATE, 'package-lock.json'), 'utf8'))
    for (const name of ['playwright', 'motion', 'vite']) {
      expect(lock.packages[`node_modules/${name}`]?.version, name).toBeTypeOf('string')
    }
  })

  it('ships CSS with no visual defaults in host or kit files', () => {
    const host = readFileSync(join(TEMPLATE, 'src/index.css'), 'utf8')
    expect(host).not.toMatch(/\b(color|background|font-family|border|box-shadow)\s*:/)
  })
})

describe('skill references resolve inside the distributed skill', () => {
  const SKILL_DIR = join(ROOT, 'skills/presentation')
  const skill = readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf8')
  const referenced = [...new Set(skill.match(/templates\/[A-Za-z0-9_./-]*[A-Za-z0-9_]/g) ?? [])]

  it('names at least the bootstrap and presentation templates', () => {
    expect(referenced).toEqual(expect.arrayContaining(['templates/bootstrap', 'templates/presentation']))
  })

  it.each(referenced)('%s exists relative to the skill file', (reference) => {
    expect(existsSync(join(SKILL_DIR, reference)), reference).toBe(true)
  })

  it('has no reference to a path outside the distributed skill', () => {
    expect(skill).not.toMatch(/\.\.\/|src\/presentations\/how-to-make-a-presentation|scripts\/verify\.mjs/)
  })
})
