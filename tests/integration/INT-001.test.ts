import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { REQUIRED_DEPENDENCIES } from '../../skills/presentation/scripts/scaffold.mjs'
import { ROOT, TEMPLATE, listFiles, materializeBootstrap, removeDir, run } from './helpers'

/**
 * INT-001: the distributable bootstrap, materialized outside the repository, installs from its
 * committed lock data, builds, passes its own render verification, and matches the canonical kit.
 */
let app: string

beforeAll(() => {
  app = materializeBootstrap('int001-')
  const install = run('npm', ['ci', '--no-audit', '--no-fund'], app, 900_000)
  if (install.status !== 0) throw new Error(`npm ci failed:\n${install.output}`)
}, 1_000_000)

afterAll(() => {
  if (app) removeDir(app)
})

describe('materialized bootstrap', () => {
  it('is complete: build setup, scene kit, and presentation index are all present', () => {
    expect(existsSync(join(app, 'vite.config.ts'))).toBe(true)
    expect(existsSync(join(app, 'src/presentation-kit/index.ts'))).toBe(true)
    expect(existsSync(join(app, 'src/presentations/index.ts'))).toBe(true)
  })

  it('declares the whole required dependency set and no styling framework', () => {
    const manifest = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
    const declared = new Set([...Object.keys(manifest.dependencies), ...Object.keys(manifest.devDependencies)])
    for (const name of REQUIRED_DEPENDENCIES) expect(declared.has(name), name).toBe(true)
    expect([...declared].some((name) => /tailwind/i.test(name))).toBe(false)
    expect(readFileSync(join(app, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
  })

  it('installs from the committed lock data unchanged', () => {
    expect(readFileSync(join(app, 'package-lock.json'), 'utf8')).toBe(readFileSync(join(TEMPLATE, 'package-lock.json'), 'utf8'))
  })

  it('builds with npm run build', () => {
    const build = run('npm', ['run', 'build'], app)
    expect(build.status, build.output).toBe(0)
  }, 300_000)

  it('its registered route passes the local verification entry point', () => {
    const verify = run('npm', ['run', 'verify'], app)
    expect(verify.output).toContain('verify: PASS')
    expect(verify.status, verify.output).toBe(0)
  }, 600_000)
})

describe('canonical kit and bootstrap copies stay aligned', () => {
  it('every non-test kit file in the bootstrap is byte-identical to src/presentation-kit', () => {
    const canonical = listFiles(join(ROOT, 'src/presentation-kit'))
    const copied = listFiles(join(TEMPLATE, 'src/presentation-kit'))
    expect(copied.sort()).toEqual(canonical.sort())
    for (const rel of canonical) {
      expect(readFileSync(join(TEMPLATE, 'src/presentation-kit', rel)).equals(readFileSync(join(ROOT, 'src/presentation-kit', rel)))).toBe(true)
    }
  })

  it('the root verify and inspect scripts are byte-identical to their bootstrap copies', () => {
    for (const rel of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs']) {
      expect(readFileSync(join(TEMPLATE, rel)).equals(readFileSync(join(ROOT, rel))), rel).toBe(true)
    }
  })

  it('the kit ships no visual defaults in the materialized app', () => {
    const cssFiles = listFiles(join(app, 'src/presentation-kit')).filter((file) => file.endsWith('.css'))
    expect(cssFiles).toEqual([])
  })
})
