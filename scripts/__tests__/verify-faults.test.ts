import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { createConnection } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const source = process.cwd()
const copies: string[] = []

/** Caches that must not be shared between copies, or an injected fault could be skipped as up to date. */
const LOCAL_CACHE_DIRS = new Set(['.tmp', '.cache'])

/** The port scripts/verify.mjs binds with --strictPort; a leaked preview would keep holding it. */
const PREVIEW_PORT = 4173

type Fault = {
  name: string
  file: string
  find: string
  replace: string
  expected: RegExp
}

const FAULTS: Fault[] = [
  {
    name: 'a type error in the build phase',
    file: 'src/presentations/index.ts',
    find: 'export const presentations',
    replace: 'const broken: number = "not a number"\nexport const presentations',
    expected: /FAIL: verification/,
  },
  {
    name: 'a reference sample missing from the registry',
    file: 'src/presentations/index.ts',
    find: "slug: 'how-to-make-a-presentation'",
    replace: "slug: 'some-other-presentation'",
    expected: /reference sample is missing from the presentation registry/,
  },
  {
    name: 'a step that emits a browser error',
    file: 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx',
    find: 'export function Scene',
    replace: 'if (typeof window !== "undefined") console.error("injected scene fault")\nexport function Scene',
    expected: /step \d+:.*injected scene fault/s,
  },
  {
    // Keeps the signature type-safe so the fault surfaces as a stalled transition, not a build error.
    name: 'a transition that never advances',
    file: 'src/presentation-kit/navigation.ts',
    find: "const delta = direction === 'next' ? 1 : -1",
    replace: "const delta = direction === 'next' ? 0 : -1",
    expected: /step \d+: (transition stopped at index|expected title)/,
  },
]

/**
 * E2E-002 materializes disposable copies so faults never touch the source checkout.
 * node_modules is a per-copy symlink farm: dependencies are shared, but build
 * caches stay local so an injected type error really fails.
 */
function makeFaultyCopy({ file, find, replace }: Fault): string {
  const root = mkdtempSync(join(tmpdir(), 'and-scene-fault-'))
  copies.push(root)
  // Tracked-but-deleted paths are skipped so the copy mirrors the working tree, not the index.
  for (const tracked of execFileSync('git', ['ls-files'], { cwd: source, encoding: 'utf8' }).split('\n').filter(Boolean)) {
    if (existsSync(join(source, tracked))) cpSync(join(source, tracked), join(root, tracked))
  }
  mkdirSync(join(root, 'node_modules'))
  for (const entry of readdirSync(join(source, 'node_modules'))) {
    if (!LOCAL_CACHE_DIRS.has(entry)) symlinkSync(join(source, 'node_modules', entry), join(root, 'node_modules', entry))
  }

  const path = join(root, file)
  const before = readFileSync(path, 'utf8')
  expect(before, `fault anchor not found in ${file}`).toContain(find)
  writeFileSync(path, before.replace(find, replace))
  return root
}

function runVerify(root: string) {
  try {
    return { status: 0, output: execFileSync('node', ['scripts/verify.mjs'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }
  } catch (error) {
    const failure = error as { status: number | null; stdout?: string; stderr?: string }
    return { status: failure.status ?? -1, output: `${failure.stdout ?? ''}${failure.stderr ?? ''}` }
  }
}

const previewPortIsFree = () => new Promise<boolean>((resolve) => {
  const socket = createConnection({ host: '127.0.0.1', port: PREVIEW_PORT })
  socket.once('connect', () => { socket.destroy(); resolve(false) })
  socket.once('error', () => resolve(true))
})

afterAll(() => {
  for (const root of copies) rmSync(root, { recursive: true, force: true })
})

describe('E2E-002: verification failures are actionable', () => {
  it.each(FAULTS)('exits non-zero and names the failure for $name', async (fault) => {
    const { status, output } = runVerify(makeFaultyCopy(fault))

    expect(status).not.toBe(0)
    expect(output).toMatch(fault.expected)
    expect(output).not.toContain('PASS:')
    expect(await previewPortIsFree(), 'preview subprocess was left running').toBe(true)
  }, 180_000)
})
