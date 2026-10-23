import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { materializeTemplate, output, REPO, removeScratch, run, scratch } from '../support'

// INT-001: the distributable bootstrap, materialized outside the repository, installs its own
// dependencies from its lock file, builds, and renders its registered route.
let work: string
let app: string

beforeAll(() => {
  work = scratch('bootstrap')
  app = join(work, 'app')
  materializeTemplate(app)
  const install = run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: app, timeout: 500_000 })
  if (install.status !== 0) throw new Error(`npm ci failed in the materialized bootstrap:\n${output(install)}`)
}, 600_000)

afterAll(() => {
  removeScratch(work)
})

describe('materialized bootstrap', () => {
  it('has the three anchors and the complete dependency set installed', () => {
    for (const anchor of ['vite.config.ts', 'src/presentation-kit/index.ts', 'src/presentations/index.ts']) {
      expect(existsSync(join(app, anchor)), anchor).toBe(true)
    }
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8')) as Record<string, Record<string, string>>
    const declared = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', 'playwright']) {
      expect(declared[name], name).toBeTypeOf('string')
      expect(existsSync(join(app, 'node_modules', name)), `installed ${name}`).toBe(true)
    }
  })

  it('keeps the materialized kit byte-identical to the canonical kit', () => {
    const canonical = readFileSync(join(REPO, 'src/presentation-kit/nodes/Box.tsx'))
    const copy = readFileSync(join(app, 'src/presentation-kit/nodes/Box.tsx'))
    expect(copy.equals(canonical)).toBe(true)
    expect(existsSync(join(app, 'src/presentation-kit/__tests__'))).toBe(false)
  })

  it('builds and renders its registered route when verified from a different working directory', () => {
    const verify = run('node', [join(app, 'scripts/verify.mjs')], { cwd: work })
    const text = output(verify)
    expect(verify.status, text).toBe(0)
    expect(text).toContain('VERIFY PASSED: 3 steps of /starter')
    expect(text).toContain('phase render: 3 steps rendered without runtime or console errors')
  }, 300_000)

  it('does not depend on Tailwind or any styling framework', () => {
    const lock = JSON.parse(readFileSync(join(app, 'package-lock.json'), 'utf8')) as { packages: Record<string, unknown> }
    expect(Object.keys(lock.packages).filter((name) => /tailwind/i.test(name))).toEqual([])
  })
})
