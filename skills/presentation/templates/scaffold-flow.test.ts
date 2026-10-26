// @vitest-environment node
//
// End-to-end regression test for the skill's main client flow: scaffold from
// `templates/bootstrap/`, materialize `templates/presentation/*` exactly where
// SKILL.md §3 says to, register the slug, then run the scaffolded project's own
// `npm run verify` gate (SKILL.md §4). A template defect that only shows up once
// the pieces are wired together — a stylesheet that is never imported, an import
// path that does not resolve from the depth a template lands at — is invisible to
// the per-file template checks but fails here, which is exactly how it reached a
// human in acceptance testing.
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '../../..')
const bootstrapDir = path.join(__dirname, 'bootstrap')
const presentationTemplateDir = path.join(__dirname, 'presentation')

const SLUG = 'scaffold-flow-check'
const TITLE = 'Scaffold Flow Check'
const THROWN_MESSAGE = 'injected scaffold-flow render failure'

interface StepSpec {
  index: number
  id: string
  era: string
  title: string
  caption: string
  visual: string
}

const STEP_SPECS: StepSpec[] = [
  {
    index: 1,
    id: 'first-beat',
    era: 'the setup',
    title: 'The first beat',
    caption: 'Where the scene starts.',
    visual: 'a single anchor entity',
  },
  {
    index: 2,
    id: 'second-beat',
    era: 'the setup',
    title: 'The second beat',
    caption: 'The anchor entity morphs in place.',
    visual: 'the anchor entity, emphasised',
  },
]

function readTemplate(relative: string): string {
  return readFileSync(path.join(presentationTemplateDir, relative), 'utf8')
}

function substitute(source: string, replacements: Record<string, string>): string {
  let out = source
  for (const [token, value] of Object.entries(replacements)) {
    out = out.replaceAll(`{{${token}}}`, value)
  }
  const leftover = out.match(/\{\{[A-Z_]+\}\}/)
  expect(leftover, `unsubstituted placeholder ${leftover?.[0]}`).toBeNull()
  return out
}

// Mirrors what an agent following SKILL.md §3 does: copy each template to the
// destination it names, replace every {{PLACEHOLDER}}, and add one registry line.
function materializePresentation(projectDir: string): void {
  const presentationDir = path.join(projectDir, 'src/presentations', SLUG)
  mkdirSync(path.join(presentationDir, 'steps'), { recursive: true })

  writeFileSync(
    path.join(presentationDir, 'entities.ts'),
    readTemplate('entities.ts.template').replace('// EXAMPLE_ENTITY:', 'EXAMPLE_ENTITY:'),
  )
  writeFileSync(
    path.join(presentationDir, 'Talk.tsx'),
    substitute(readTemplate('Talk.tsx.template'), { PRESENTATION_TITLE: TITLE }),
  )
  writeFileSync(
    path.join(presentationDir, 'presentation.css'),
    substitute(readTemplate('presentation.css.template'), { PRESENTATION_TITLE: TITLE }),
  )

  const stepTemplate = readTemplate('steps/Step.tsx.template')
  for (const spec of STEP_SPECS) {
    writeFileSync(
      path.join(presentationDir, 'steps', `Step${spec.index}.tsx`),
      substitute(stepTemplate, {
        STEP_INDEX: String(spec.index),
        STEP_ID: spec.id,
        STEP_ERA: spec.era,
        STEP_TITLE: spec.title,
        STEP_CAPTION: spec.caption,
        STEP_VISUAL_DESCRIPTION: spec.visual,
      }),
    )
  }

  // steps/index.ts lists every step in on-screen order.
  const stepsIndex = readTemplate('steps/index.ts.template')
    .replace(
      "import { step1 } from './Step1'",
      STEP_SPECS.map((s) => `import { step${s.index} } from './Step${s.index}'`).join('\n'),
    )
    .replace('[step1]', `[${STEP_SPECS.map((s) => `step${s.index}`).join(', ')}]`)
  writeFileSync(path.join(presentationDir, 'steps/index.ts'), stepsIndex)

  const registryPath = path.join(projectDir, 'src/presentations/index.ts')
  const registry = readFileSync(registryPath, 'utf8')
  const entry = `  { slug: '${SLUG}', title: '${TITLE}', load: () => import('./${SLUG}/Talk') },\n`
  const updated = registry.replace(/(presentations:\s*PresentationRegistryEntry\[\]\s*=\s*\[)\s*\n?/, `$1\n${entry}`)
  expect(updated, 'could not add a registry entry').not.toBe(registry)
  writeFileSync(registryPath, updated)
}

function scaffold(): string {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'and-scene-scaffold-flow-'))
  cpSync(bootstrapDir, tempDir, {
    recursive: true,
    filter: (src) => !src.endsWith('.test.ts') && !src.endsWith('.test.tsx'),
  })
  symlinkSync(path.join(repoRoot, 'node_modules'), path.join(tempDir, 'node_modules'), 'dir')
  materializePresentation(tempDir)
  return tempDir
}

interface VerifyResult {
  status: number
  output: string
}

// A port of its own so this never collides with a `npm run verify` the developer
// is running alongside the suite. Keep the choices off the WHATWG bad-port list
// (4190 among them) — `waitForServer` probes with `fetch`, which refuses those.
function runVerify(projectDir: string, port: string): VerifyResult {
  try {
    const output = execFileSync('node', ['scripts/verify.mjs'], {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, VERIFY_PORT: port },
    })
    return { status: 0, output }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { status: failure.status ?? -1, output: `${failure.stdout ?? ''}${failure.stderr ?? ''}` }
  }
}

describe('skill client flow', () => {
  it('produces a presentation that passes the scaffolded verify gate', () => {
    const tempDir = scaffold()
    try {
      const { status, output } = runVerify(tempDir, '4189')
      expect(output).toContain('[verify] PASS')
      expect(status).toBe(0)
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  }, 240_000)

  // `Number(null)` is 0, so a root that renders without the step-state hook at
  // all satisfies the step-0 comparison. On a single-step presentation there is
  // no later step to catch it, and the gate would report a clean pass.
  it('fails when the presentation root omits the step-state hook', () => {
    const tempDir = scaffold()
    try {
      const stepsIndex = path.join(tempDir, 'src/presentations', SLUG, 'steps/index.ts')
      writeFileSync(
        stepsIndex,
        readFileSync(stepsIndex, 'utf8')
          .replace(/^import \{ step2 \}.*\n/m, '')
          .replace('[step1, step2]', '[step1]'),
      )

      const kitPath = path.join(tempDir, 'src/presentation-kit/Presentation.tsx')
      const original = readFileSync(kitPath, 'utf8')
      const withoutHook = original.replaceAll(/\s*data-step-index=\{[^}]*\}/g, '')
      expect(withoutHook, 'expected a data-step-index attribute to remove').not.toBe(original)
      writeFileSync(kitPath, withoutHook)

      const { status, output } = runVerify(tempDir, '4192')
      expect(status).not.toBe(0)
      expect(output).toContain('data-step-index')
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  }, 240_000)

  // An uncaught render error unmounts the React tree, taking
  // [data-presentation-root] with it. Verification has to report the step and
  // the captured page error rather than the locator timeout that follows.
  it('names the failing step and the page error when a step throws', () => {
    const tempDir = scaffold()
    try {
      const second = STEP_SPECS[1]
      writeFileSync(
        path.join(tempDir, 'src/presentations', SLUG, 'steps/Step2.tsx'),
        [
          "import type { Step } from '../../../presentation-kit/types'",
          '',
          'function Scene(): never {',
          `  throw new Error('${THROWN_MESSAGE}')`,
          '}',
          '',
          'export const step2: Step = {',
          `  id: '${second.id}',`,
          `  era: '${second.era}',`,
          `  title: '${second.title}',`,
          `  caption: '${second.caption}',`,
          '  Scene,',
          '  payload: undefined,',
          '}',
          '',
        ].join('\n'),
      )

      const { status, output } = runVerify(tempDir, '4191')
      expect(status).not.toBe(0)
      expect(output).toContain('step 1')
      expect(output).toContain(THROWN_MESSAGE)
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  }, 240_000)
})
