// E2E-002: `npm run verify` fails loudly, and cleanly, on a fault in each phase.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyAppFiles, isListening, leftoverPreviews, linkDependencies, previewPortFrom, repoRoot, run, tempDir } from '../helpers/process.mjs'

const SAMPLE = 'src/presentations/how-to-make-a-presentation'
let work
let sourceStatus

const edit = (app, rel, change) => {
  const file = path.join(app, rel)
  const before = fs.readFileSync(file, 'utf8')
  const after = change(before)
  expect(after, `${rel} was not changed`).not.toBe(before)
  fs.writeFileSync(file, after)
}

function freshCopy(name) {
  const app = path.join(work, name)
  copyAppFiles(repoRoot, app, {
    files: ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html'],
    dirs: ['src', 'scripts', 'public'],
  })
  linkDependencies(app)
  return app
}

const gitStatus = () => execFileSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' })

beforeAll(() => {
  work = tempDir('e2e-002')
  sourceStatus = gitStatus()
})

afterAll(() => {
  fs.rmSync(work, { recursive: true, force: true })
  // The source checkout is never modified by the throwaway runs.
  expect(gitStatus()).toBe(sourceStatus)
})

async function verifyFails(name, fault) {
  const app = freshCopy(name)
  fault(app)
  const result = run('npm', ['run', 'verify'], { cwd: app })
  expect(result.status, result.out).not.toBe(0)
  expect(result.out).not.toMatch(/PASS verify/)
  const port = previewPortFrom(result.out)
  if (port !== null) {
    expect(await isListening(port), `preview on ${port} still listening`).toBe(false)
    expect(leftoverPreviews(port)).toEqual([])
  }
  return { ...result, port }
}

describe('E2E-002 build phase', () => {
  it('fails on a type error outside the reference sample and names the build phase', async () => {
    const { out, port } = await verifyFails('type-error', (app) =>
      edit(app, 'src/Landing.tsx', (s) => `${s}\nexport const broken: number = 'not a number'\n`),
    )
    expect(out).toMatch(/FAIL \[build\]/)
    expect(out).toMatch(/Landing\.tsx/)
    expect(port).toBeNull()
  })

  it('fails on a production-bundling error that type checking does not see', async () => {
    const { out } = await verifyFails('bundle-error', (app) => edit(app, 'src/main.tsx', (s) => `import './missing-stylesheet.css'\n${s}`))
    expect(out).toMatch(/FAIL \[build\]/)
    expect(out).toMatch(/missing-stylesheet/)
  })
})

describe('E2E-002 sample phase', () => {
  it('fails when the reference sample is missing', async () => {
    const { out } = await verifyFails('missing-sample', (app) => {
      fs.rmSync(path.join(app, SAMPLE), { recursive: true })
      fs.writeFileSync(
        path.join(app, 'src/presentations/index.ts'),
        "import type { PresentationEntry } from './registry.ts'\nexport const PRESENTATIONS: readonly PresentationEntry[] = []\n",
      )
    })
    expect(out).toMatch(/FAIL \[sample\]/)
    expect(out).toMatch(/how-to-make-a-presentation/)
  })

  it('fails when the sample folder exists but is not registered', async () => {
    const { out } = await verifyFails('unregistered-sample', (app) =>
      edit(app, 'src/presentations/index.ts', (s) => s.replace("slug: 'how-to-make-a-presentation'", "slug: 'renamed'")),
    )
    expect(out).toMatch(/FAIL \[sample\]/)
    expect(out).toMatch(/not registered/)
  })

  it('fails with the offending steps when the sample is out of order', async () => {
    const { out } = await verifyFails('out-of-order', (app) =>
      edit(app, `${SAMPLE}/steps/index.ts`, (s) => s.replace('  STEP_03,\n  STEP_04,\n', '  STEP_04,\n  STEP_03,\n')),
    )
    expect(out).toMatch(/FAIL \[outline\]/)
    expect(out).toMatch(/step 2: title/)
    expect(out).toMatch(/step 3: title/)
  })
})

describe('E2E-002 render phase', () => {
  const scene = `${SAMPLE}/SampleScene.tsx`
  // Injects a fault once the scene shows its Nth entity, i.e. at a known later step.
  const atStep = (n, body) => (app) =>
    edit(app, scene, (s) =>
      s
        .replace("import { Appear,", "import { useEffect } from 'react'\nimport { Appear,")
        .replace('export function SampleScene({ payload }: SceneProps<SamplePayload>) {', `export function SampleScene({ payload }: SceneProps<SamplePayload>) {\n  useEffect(() => {\n    if (payload.visible.length === ${n}) { ${body} }\n  }, [payload.visible.length])`),
    )

  it('fails on a console.error during the first load and names step 0', async () => {
    const { out } = await verifyFails('console-load', (app) =>
      edit(app, `${SAMPLE}/Talk.tsx`, (s) => s.replace('export default function Talk() {', "console.error('injected-load-error')\nexport default function Talk() {")),
    )
    expect(out).toMatch(/FAIL \[render\] console error at step 0 of \/how-to-make-a-presentation/)
    expect(out).toMatch(/injected-load-error/)
  })

  it('fails on an uncaught page error during the first load and names step 0', async () => {
    const { out } = await verifyFails('pageerror-load', (app) =>
      edit(app, `${SAMPLE}/Talk.tsx`, (s) =>
        s.replace('export default function Talk() {', "setTimeout(() => {\n  throw new Error('injected-load-exception')\n})\nexport default function Talk() {"),
      ),
    )
    expect(out).toMatch(/FAIL \[render\] uncaught page error at step 0/)
    expect(out).toMatch(/injected-load-exception/)
  })

  it('fails on a console.error at a later step and identifies that step', async () => {
    // Step index 5 ("It assembles the scene") is the first to show 15 entities.
    const { out } = await verifyFails('console-step', atStep(15, "console.error('injected-step-error')"))
    expect(out).toMatch(/FAIL \[render\] console error at step 5 of/)
    expect(out).toMatch(/injected-step-error/)
  })

  it('fails on an uncaught page error at a later step and identifies that step', async () => {
    const { out } = await verifyFails('pageerror-step', atStep(15, "setTimeout(() => { throw new Error('injected-step-exception') })"))
    expect(out).toMatch(/FAIL \[render\] uncaught page error at step 5 of/)
    expect(out).toMatch(/injected-step-exception/)
  })

  it('fails when a transition does not advance the public step index', async () => {
    const { out } = await verifyFails('stuck-transition', (app) =>
      edit(app, 'src/presentation-kit/usePresentationNav.ts', (s) =>
        s.replace('const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])', 'const next = useCallback(() => setIndex((i) => (i >= 3 ? i : clampIndex(i + 1, count))), [count])'),
      ),
    )
    expect(out).toMatch(/FAIL \[render\] transition to step 4 of \/how-to-make-a-presentation failed: expected index 4, observed 3/)
  })
})
