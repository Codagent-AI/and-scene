import { readFile, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { detectAnchors } from '../../skills/presentation/scripts/scaffold.mjs'
import { ROOT, run, tempDir } from './helpers'
import { TEST_FILE, rel, text, walk } from '../contract/helpers'
import type { Result } from './helpers'

const SCAFFOLD = path.join(ROOT, 'skills/presentation/scripts/scaffold.mjs')
const exists = (p: string) => stat(p).then(() => true, () => false)

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  let dir: string
  let scaffoldOut: Result
  let install: Result
  let build: Result
  let lint: Result
  let verify: Result
  let created: Result
  let rebuild: Result

  beforeAll(async () => {
    dir = await tempDir('bootstrap')
    // Invoked from a working directory outside this repository.
    scaffoldOut = await run(process.execPath, [SCAFFOLD, 'apply', dir], os.tmpdir())
    install = await run('npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund'], dir)
    build = await run('npm', ['run', 'build'], dir)
    lint = await run('npm', ['run', 'lint'], dir)
    verify = await run(process.execPath, [path.join(dir, 'scripts/verify.mjs')], os.tmpdir())
    created = await run(process.execPath, [SCAFFOLD, 'new', dir, 'second-talk', 'Second Talk'], os.tmpdir())
    rebuild = await run('npm', ['run', 'build'], dir)
  })

  it('materializes and installs from the committed lock data', () => {
    expect(scaffoldOut.code, scaffoldOut.output).toBe(0)
    expect(install.code, install.output).toBe(0)
  })

  it('has all three anchors and the complete dependency set', async () => {
    expect(await detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
    const declared = { ...pkg.dependencies, ...pkg.devDependencies }
    const required = ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'eslint-plugin-react-hooks', 'playwright']
    for (const name of required) {
      expect(declared, name).toHaveProperty(name)
      expect(await exists(path.join(dir, 'node_modules', name)), `${name} installed`).toBe(true)
    }
  })

  it('builds and lints', () => {
    expect(build.code, build.output).toBe(0)
    expect(lint.code, lint.output).toBe(0)
  })

  it('smoke-checks its registered starter route from outside the project directory', () => {
    expect(verify.code, verify.output).toBe(0)
    expect(verify.output).toMatch(/verify: PASS .*"starter"/)
    expect(verify.output).toMatch(/\[verify\] step 1 ok/)
    expect(verify.output).toMatch(/http:\/\/127\.0\.0\.1:\d+\/starter/)
  })

  it('keeps the materialized scene kit and scripts identical to the canonical sources', async () => {
    const kit = (dirName: string) => walk(path.join(dirName, 'src/presentation-kit')).then((f) => f.filter((x) => !TEST_FILE.test(x)))
    expect(rel(dir, await kit(dir))).toEqual(rel(ROOT, await kit(ROOT)))
    for (const file of await kit(ROOT)) {
      expect(await text(path.join(dir, path.relative(ROOT, file))), file).toBe(await text(file))
    }
    for (const file of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(await text(path.join(dir, file))).toBe(await text(path.join(ROOT, file)))
    }
  })

  it('introduces no styling framework and no visual defaults', async () => {
    expect(await exists(path.join(dir, 'node_modules/tailwindcss'))).toBe(false)
    const files = (await walk(dir)).filter((f) => f.endsWith('.css') && !f.includes('second-talk'))
    expect(rel(dir, files)).toEqual(['src/index.css'])
    expect(await text(files[0])).not.toMatch(/(color|background|font|border|shadow|radius|padding|gap)[\w-]*\s*:/)
    expect(await text(path.join(dir, 'vite.config.ts'))).not.toMatch(/tailwind/i)
  })

  it('compiles and lints a presentation created from the templates and registers it', async () => {
    expect(created.code, created.output).toBe(0)
    expect(rebuild.code, rebuild.output).toBe(0)
    expect(await text(path.join(dir, 'src/presentations/index.ts'))).toContain("slug: 'second-talk'")
    const relint = await run('npm', ['run', 'lint'], dir)
    expect(relint.code, relint.output).toBe(0)
  })
})
