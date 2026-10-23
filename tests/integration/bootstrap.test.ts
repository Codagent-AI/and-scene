// INT-001: the distributable bootstrap, materialized by the skill's helper into a fresh
// directory outside the repository, installs from its lock data, builds, verifies, and
// stays aligned with the canonical kit and scripts.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { exists, listFiles, npm, REPO, removeDir, run, tempDir } from './support'
import { applyScaffold, detectAnchors, planScaffold, TEMPLATE_ROOT } from '../../skills/presentation/scripts/scaffold.mjs'

const TEMPLATE = join(REPO, 'skills', 'presentation', 'templates', 'bootstrap')
const PARITY_DIRS = ['src/presentation-kit', 'src/presentations/how-to-make-a-presentation', 'scripts']
const PARITY_FILES = ['src/presentations/index.ts', 'src/presentations/types.ts']

let work: string
let app: string

beforeAll(async () => {
  work = await tempDir('int001')
  app = join(work, 'presentation-app')
  // Materialize through the helper, the same path an agent uses, into an empty directory.
  await applyScaffold(app, { templateRoot: TEMPLATE })
  const install = await npm(['ci', '--no-audit', '--no-fund'], app, 600_000)
  if (install.code !== 0) throw new Error(`npm ci failed:\n${install.output}`)
}, 700_000)

afterAll(async () => {
  if (work) await removeDir(work)
})

describe('materialized bootstrap', () => {
  it('has all three anchors and the complete dependency set', async () => {
    expect(await detectAnchors(app)).toEqual({ build: true, kit: true, index: true })
    const manifest = JSON.parse(await readFile(join(app, 'package.json'), 'utf8'))
    const declared = { ...manifest.dependencies, ...manifest.devDependencies }
    for (const name of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint',
      'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright',
    ]) {
      expect(declared, name).toHaveProperty(name)
    }
    expect(await exists(join(app, 'package-lock.json'))).toBe(true)
  })

  it('installs from its committed lock data and builds with npm run build', async () => {
    const build = await npm(['run', 'build'], app)
    expect(build.code, build.output).toBe(0)
  }, 300_000)

  it('verifies its registered route when invoked from a working directory outside the repository', async () => {
    const outside = join(tmpdir())
    const verify = await run(process.execPath, [join(app, 'scripts', 'verify.mjs')], outside, 600_000)
    expect(verify.code, verify.output).toBe(0)
    expect(verify.output).toMatch(/PASS verify/)
  }, 600_000)

  it('has no visual defaults or styling framework in the materialized kit or config', async () => {
    const manifest = await readFile(join(app, 'package.json'), 'utf8')
    expect(manifest).not.toMatch(/tailwind/i)
    expect(await readFile(join(app, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
    const kitFiles = await listFiles(join(app, 'src', 'presentation-kit'))
    expect(kitFiles.filter((file) => file.endsWith('.css'))).toEqual([])
  })
})

describe('template parity with the canonical sources', () => {
  it('matches every non-test kit file, sample file, and script byte-for-byte', async () => {
    const mismatches: string[] = []
    for (const dir of PARITY_DIRS) {
      const canonical = (await listFiles(join(REPO, dir))).filter((file) => !file.includes('tests/'))
      const template = (await listFiles(join(TEMPLATE, dir))).filter((file) => !file.includes('tests/'))
      if (JSON.stringify(canonical) !== JSON.stringify(template)) {
        mismatches.push(`${dir}: file sets differ`)
        continue
      }
      for (const file of canonical) {
        const a = await readFile(join(REPO, dir, file))
        const b = await readFile(join(TEMPLATE, dir, file))
        if (!a.equals(b)) mismatches.push(`${dir}/${file}`)
      }
    }
    for (const file of PARITY_FILES) {
      const a = await readFile(join(REPO, file))
      const b = await readFile(join(TEMPLATE, file))
      if (!a.equals(b)) mismatches.push(file)
    }
    expect(mismatches).toEqual([])
  })

  it('plans to materialize every template file of the groups it owns', async () => {
    const empty = await tempDir('int001-plan')
    try {
      const plan = await planScaffold(empty, { templateRoot: TEMPLATE })
      const planned = plan.files.map((file: { rel: string }) => file.rel).sort()
      expect(planned).toEqual((await listFiles(TEMPLATE)).sort())
      expect(TEMPLATE_ROOT).toBe(TEMPLATE)
    } finally {
      await removeDir(empty)
    }
  })
})

describe('template lookup independence', () => {
  it('finds templates from the skill directory when the helper runs from another working directory', async () => {
    const target = await tempDir('int001-cwd')
    try {
      const helper = join(REPO, 'skills', 'presentation', 'scripts', 'scaffold.mjs')
      const out = execFileSync(process.execPath, [helper, target], { cwd: tmpdir(), encoding: 'utf8' })
      const parsed = JSON.parse(out)
      expect(parsed.target.relation).toBe('root')
      expect(parsed.plan.missingAnchors).toEqual(['build', 'kit', 'index'])
    } finally {
      await removeDir(target)
    }
  })
})
