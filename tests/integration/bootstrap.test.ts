import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  anchorProblems,
  compareKitTrees,
  dependencyProblems,
  lockPackageNames,
  presentationFindings,
  STYLING_FRAMEWORK_NAME,
  STYLING_FRAMEWORK_TEXT,
  stylesheetProblems,
} from '../unit/helpers/bootstrap'

// INT-001: materialize the distributable bootstrap outside the repository and exercise it.
const REPO = fileURLToPath(new URL('../../', import.meta.url))
const TEMPLATE = join(REPO, 'skills/presentation/templates/bootstrap')
const INSTALL_TIMEOUT = 600_000
const STEP_TIMEOUT = 600_000

let scratch = ''
let app = ''
let install: SpawnSyncReturns<string>
let lint: SpawnSyncReturns<string>
let build: SpawnSyncReturns<string>
let verify: SpawnSyncReturns<string>

function run(command: string, args: string[], cwd: string): SpawnSyncReturns<string> {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: STEP_TIMEOUT,
    maxBuffer: 64 * 1024 * 1024,
    env: process.env,
  })
}

const readText = (rel: string) => readFileSync(join(app, rel), 'utf8')
const readJson = (rel: string) => JSON.parse(readText(rel))

beforeAll(() => {
  scratch = mkdtempSync(join(tmpdir(), 'and-scene-bootstrap-'))
  if (scratch.startsWith(REPO)) throw new Error(`scratch dir must be outside the repository: ${scratch}`)
  app = join(scratch, 'app')
  cpSync(TEMPLATE, app, {
    recursive: true,
    filter: (src) => !/[\\/](node_modules|dist|\.inspection)([\\/]|$)/.test(src),
  })
  // Run every step from the scratch root, never from inside the repository.
  install = run('npm', ['ci', '--no-audit', '--no-fund'], app)
  if (install.status === 0) {
    lint = run('npm', ['run', 'lint', '--prefix', app], scratch)
    build = run('npm', ['run', 'build', '--prefix', app], scratch)
    verify = run('npm', ['run', 'verify', '--prefix', app], scratch)
  }
}, INSTALL_TIMEOUT + 3 * STEP_TIMEOUT)

afterAll(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true, maxRetries: 3 })
})

const tail = (r: SpawnSyncReturns<string> | undefined) => (r ? `${r.stdout ?? ''}${r.stderr ?? ''}`.slice(-4000) : 'not run')

describe('INT-001 materialized bootstrap', () => {
  it('installs its declared dependency set from the committed lock', () => {
    expect(install.status, tail(install)).toBe(0)
    for (const dir of ['playwright', 'react', 'vite']) {
      expect(existsSync(join(app, 'node_modules', dir, 'package.json')), dir).toBe(true)
    }
    const installed = readText('node_modules/.package-lock.json')
    expect(installed).not.toMatch(/"node_modules\/tailwindcss/)
    expect(installed).not.toMatch(/@tailwindcss\//)
  })

  it('lints the materialized app', () => {
    expect(lint?.status, tail(lint)).toBe(0)
  })

  it('builds the materialized app from outside the repository', () => {
    expect(build?.status, tail(build)).toBe(0)
    expect(existsSync(join(app, 'dist', 'index.html'))).toBe(true)
  })

  it('verify passes against its registered starter route, on 127.0.0.1', () => {
    const out = `${verify?.stdout ?? ''}${verify?.stderr ?? ''}`
    expect(verify?.status, tail(verify)).toBe(0)
    expect(out).toMatch(/verify: PASS/)
    expect(out).toMatch(/http:\/\/127\.0\.0\.1:\d+/)
    expect(out).not.toMatch(/localhost/)
  })

  it('has the three scaffold anchors and the full dependency set', () => {
    expect(anchorProblems(app)).toEqual([])
    expect(dependencyProblems(readJson('package.json'))).toEqual([])
  })

  it('its package-lock.json and installed tree name no styling framework', () => {
    const lockNames = lockPackageNames(readJson('package-lock.json'))
    expect(lockNames.filter((n) => STYLING_FRAMEWORK_NAME.test(n))).toEqual([])
    const installed = lockPackageNames(readJson('node_modules/.package-lock.json'))
    expect(installed.filter((n) => STYLING_FRAMEWORK_NAME.test(n))).toEqual([])
    for (const rel of ['package.json', 'vite.config.ts', 'eslint.config.js', 'tsconfig.app.json', 'index.html']) {
      expect(readText(rel), rel).not.toMatch(STYLING_FRAMEWORK_TEXT)
    }
  })

  it('its kit matches the canonical src/presentation-kit file set and bytes', () => {
    expect(compareKitTrees(join(REPO, 'src/presentation-kit'), join(app, 'src/presentation-kit'))).toEqual([])
  })

  it('its host stylesheet and starter presentation impose no visual defaults', () => {
    expect(stylesheetProblems(readText('src/index.css'))).toEqual([])
    expect(presentationFindings(app, 'src/presentations/starter')).toEqual([])
  })
})
