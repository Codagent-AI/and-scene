// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { escapeRegExp, isPortOpen } from '../helpers'

// E2E-002: each verification phase reports its own failure, names the step, and
// leaves no preview process behind. Every fault is injected into a disposable copy.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const RUN_TIMEOUT_MS = 420_000
const SAMPLE_DIR = 'src/presentations/how-to-make-a-presentation'

const EXCLUDED_TOP_LEVEL = new Set(['node_modules', 'dist', '.git', 'validator_logs', '.agent-runner'])
// Dependencies are reused through per-entry symlinks. Build caches stay private to each copy.
const PRIVATE_NODE_MODULES = new Set(['.tmp', '.vite', '.cache'])

const disposables: string[] = []

afterAll(() => {
  for (const dir of disposables) rmSync(dir, { recursive: true, force: true })
})

function createCopy(): string {
  const copy = mkdtempSync(join(tmpdir(), 'and-scene-verify-fault-'))
  disposables.push(copy)
  cpSync(repoRoot, copy, {
    recursive: true,
    filter: (source) => {
      const [top] = relative(repoRoot, source).split(/[\\/]/)
      return !top || !EXCLUDED_TOP_LEVEL.has(top)
    },
  })
  mkdirSync(join(copy, 'node_modules'))
  for (const entry of readdirSync(join(repoRoot, 'node_modules'))) {
    if (PRIVATE_NODE_MODULES.has(entry)) continue
    symlinkSync(join(repoRoot, 'node_modules', entry), join(copy, 'node_modules', entry), 'dir')
  }
  return copy
}

function editFile(copy: string, file: string, edit: (source: string) => string): void {
  const path = join(copy, file)
  const before = readFileSync(path, 'utf8')
  const after = edit(before)
  if (after === before) throw new Error(`fault injection did not change ${file}`)
  writeFileSync(path, after)
}

function replaceOnce(source: string, search: string, replacement: string): string {
  if (!source.includes(search)) throw new Error(`expected snippet not found: ${search}`)
  return source.replace(search, replacement)
}

interface Fault {
  name: string
  inject: (copy: string) => void
  /** Phase label printed in the FAIL line, e.g. `FAIL [render]`. */
  phase: string
  /** Text that must identify the offending step (or the failing check). */
  locator: RegExp
  /** Whether the run should have started a preview server. */
  startsPreview: boolean
}

const faults: Fault[] = [
  {
    name: 'build-breaking edit',
    inject: (copy) =>
      editFile(copy, `${SAMPLE_DIR}/Talk.tsx`, (source) => `${source}\nexport const broken: number = 'not a number'\n`),
    phase: 'build',
    locator: /TS\d{4}|error/i,
    startsPreview: false,
  },
  {
    name: 'sample removed from the registry',
    inject: (copy) =>
      editFile(copy, 'src/presentations/index.ts', () =>
        "import type { PresentationEntry } from './types'\n\nexport const PRESENTATIONS: PresentationEntry[] = []\n\nexport type { PresentationEntry } from './types'\n",
      ),
    phase: 'sample registration',
    locator: /how-to-make-a-presentation/,
    startsPreview: false,
  },
  {
    name: 'sample titles out of order',
    inject: (copy) => {
      editFile(copy, `${SAMPLE_DIR}/steps/03-answers-become-steps.tsx`, (source) =>
        replaceOnce(source, "title: 'Answers become steps'", "title: 'The deck grows'"),
      )
      editFile(copy, `${SAMPLE_DIR}/steps/04-the-deck-grows.tsx`, (source) =>
        replaceOnce(source, "title: 'The deck grows'", "title: 'Answers become steps'"),
      )
    },
    phase: 'sample registration',
    locator: /step index 2 \(step 3 of 9\)/,
    startsPreview: true,
  },
  {
    name: 'console error while rendering a step',
    inject: (copy) =>
      editFile(copy, `${SAMPLE_DIR}/Scene.tsx`, (source) =>
        replaceOnce(
          source,
          'export function EvolvingScene({ payload }: SceneProps<TalkPayload>) {\n',
          "export function EvolvingScene({ payload }: SceneProps<TalkPayload>) {\n  if (payload.stage === 4) console.error('injected fault while rendering step 4')\n",
        ),
      ),
    phase: 'render',
    locator: /step index 3 \(step 4 of 9\)/,
    startsPreview: true,
  },
  {
    name: 'transition that does not advance the step index',
    inject: (copy) =>
      editFile(copy, 'src/presentation-kit/usePresentationNav.ts', (source) =>
        replaceOnce(
          source,
          'setState((current) => ({ ...current, index: clampIndex(current.index + 1, count) }))',
          'setState((current) => ({ ...current, index: current.index === 4 ? current.index : clampIndex(current.index + 1, count) }))',
        ),
      ),
    phase: 'transition',
    locator: /step index 5 \(step 6 of 9\)/,
    startsPreview: true,
  },
]

function runVerify(copy: string) {
  return spawnSync(npm, ['run', 'verify'], {
    cwd: copy,
    encoding: 'utf8',
    timeout: RUN_TIMEOUT_MS,
    maxBuffer: 32 * 1024 * 1024,
  })
}

describe('E2E-002 verification failures are actionable', () => {
  it.each(faults.map((fault) => [fault.name, fault] as const))(
    'fails %s with the failing phase and step, and releases the preview port',
    async (_name, fault) => {
      const copy = createCopy()
      fault.inject(copy)

      const run = runVerify(copy)
      const output = `${run.stdout ?? ''}${run.stderr ?? ''}`
      if (run.status === 0) console.error(output)

      expect(run.status).not.toBe(0)
      expect(output).not.toMatch(/\bPASS\b/)
      expect(output).toMatch(new RegExp(`FAIL \\[${escapeRegExp(fault.phase)}\\]`))
      expect(output).toMatch(fault.locator)

      const port = /preview: http:\/\/127\.0\.0\.1:(\d+)/.exec(output)?.[1]
      if (fault.startsPreview) {
        expect(port, 'preview should have started before the fault surfaced').toBeDefined()
      } else {
        expect(port).toBeUndefined()
      }
      if (port) {
        expect(await isPortOpen(Number(port))).toBe(false)
      }
    },
    RUN_TIMEOUT_MS + 30_000,
  )
})