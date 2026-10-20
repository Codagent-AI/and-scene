// Deterministic verification: build the whole app, check the reference sample,
// then render every registered presentation through all of its steps in
// Chromium against a production preview on the IPv4 loopback address.
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const HOST = '127.0.0.1'
export const SETTLE_MS = 900
export const SAMPLE_SLUG = 'how-to-make-a-presentation'
const SAMPLE_META = 'src/presentations/how-to-make-a-presentation/steps/meta.ts'
const REGISTRY = 'src/presentations/index.ts'

/** Normative sample outline, transcribed from the presentation-verification spec. */
export const EXPECTED_SAMPLE = [
  { era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.' },
  { era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.' },
  { era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.' },
  { era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.' },
  { era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.' },
  { era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.' },
  { era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.' },
  { era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.' },
  { era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.' },
]

/** A verification failure that names its phase and, for browser faults, the 0-based step. */
export class VerifyError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

export const previewUrl = (port, route = '/') => `http://${HOST}:${port}${route}`

export function parseRegistrySlugs(source) {
  return [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

/** Throws a `sample` VerifyError unless the registry and step data match the outline exactly. */
export function checkSample({ slugs, steps }) {
  if (!slugs.includes(SAMPLE_SLUG)) {
    throw new VerifyError('sample', `reference sample "${SAMPLE_SLUG}" is not registered in ${REGISTRY}`)
  }
  if (!Array.isArray(steps)) throw new VerifyError('sample', 'sample step data is missing or malformed')
  if (steps.length !== EXPECTED_SAMPLE.length) {
    throw new VerifyError('sample', `sample has ${steps.length} steps, expected ${EXPECTED_SAMPLE.length}`)
  }
  EXPECTED_SAMPLE.forEach((want, i) => {
    const got = steps[i]
    if (!got || typeof got !== 'object') throw new VerifyError('sample', `sample step ${i} is malformed`, i)
    for (const field of ['era', 'title', 'caption']) {
      if (got[field] !== want[field]) {
        throw new VerifyError(
          'sample',
          `sample step ${i} ${field} is ${JSON.stringify(got[field])}, expected ${JSON.stringify(want[field])}`,
          i,
        )
      }
    }
  })
}

/** Runs phases in order; stops at the first failure and returns a structured outcome. */
export async function runPhases(phases, log = console.log) {
  for (const { name, run } of phases) {
    log(`[verify] phase ${name}: start`)
    try {
      await run()
    } catch (err) {
      const phase = err instanceof VerifyError ? err.phase : name
      const step = err instanceof VerifyError ? err.step : undefined
      return { ok: false, phase, step, message: err instanceof Error ? err.message : String(err) }
    }
    log(`[verify] phase ${name}: PASS`)
  }
  return { ok: true }
}

export function formatOutcome(outcome) {
  if (outcome.ok) return 'VERIFY PASSED'
  const step = outcome.step === undefined ? '' : ` step=${outcome.step}`
  return `VERIFY FAILED phase=${outcome.phase}${step}: ${outcome.message}`
}

function run(cmd, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (e) => resolve({ code: 1, output: String(e) }))
    child.on('close', (code) => resolve({ code, output }))
  })
}

export async function buildApp(root) {
  const { code, output } = await run('npm', ['run', 'build'], root)
  if (code !== 0) {
    throw new VerifyError('build', `npm run build failed (exit ${code})\n${output.split('\n').slice(-30).join('\n')}`)
  }
}

export async function loadSample(root) {
  const registryFile = path.join(root, REGISTRY)
  const slugs = existsSync(registryFile) ? parseRegistrySlugs(readFileSync(registryFile, 'utf8')) : []
  const metaFile = path.join(root, SAMPLE_META)
  let steps
  if (existsSync(metaFile)) {
    try {
      steps = (await import(pathToFileURL(metaFile).href)).STEP_META
    } catch (err) {
      throw new VerifyError('sample', `cannot load sample step data: ${err.message}`)
    }
  }
  return { slugs, steps }
}

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })

const stderrOf = (child) => {
  const text = (child.stderrText ?? '').trim()
  return text ? `\n${text.split('\n').slice(-15).join('\n')}` : ''
}

async function waitReady(url, child, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new VerifyError('render', `preview server exited before it was ready${stderrOf(child)}`)
    }
    try {
      if ((await fetch(url)).ok) return
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new VerifyError('render', `preview server was not ready at ${url}${stderrOf(child)}`)
}

const stopProcess = (child) =>
  new Promise((resolve) => {
    if (child.exitCode !== null) return resolve()
    const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
    // It may have exited between the first check and the listener; do not wait for an event that already fired.
    if (child.exitCode !== null) {
      clearTimeout(timer)
      return resolve()
    }
    child.kill('SIGTERM')
  })

/** Serves the production build on the IPv4 loopback and always stops the server. */
export async function withPreview(root, fn, log = console.log, { readyTimeoutMs = 30_000 } = {}) {
  const port = await freePort()
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] },
  )
  child.stderrText = ''
  child.stderr.on('data', (d) => (child.stderrText += d))
  try {
    log(`[verify] preview ${previewUrl(port)} (pid ${child.pid})`)
    await waitReady(previewUrl(port), child, readyTimeoutMs)
    return await fn(port)
  } finally {
    await stopProcess(child)
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Steps through one presentation route with ArrowRight. Listeners attach
 * before navigation; any console error, page error, or non-advancing step
 * fails with the 0-based index of the step being shown.
 */
export async function checkRoute(page, url, { expected, settleMs = SETTLE_MS, log = () => {} } = {}) {
  let current = 0
  const faults = []
  page.on('console', (m) => m.type() === 'error' && faults.push({ step: current, text: `console error: ${m.text()}` }))
  page.on('pageerror', (e) => faults.push({ step: current, text: `page error: ${e.message}` }))
  const assertClean = () => {
    if (faults.length) throw new VerifyError('render', faults[0].text, faults[0].step)
  }

  await page.goto(url, { waitUntil: 'load' })
  const chrome = page.locator('[data-step-count]')
  try {
    await chrome.waitFor({ timeout: 10_000 })
  } catch {
    assertClean()
    throw new VerifyError('render', `no [data-step-count] chrome at ${url}`, 0)
  }
  const count = Number(await chrome.getAttribute('data-step-count'))
  if (!(count > 0)) throw new VerifyError('render', 'step count hook is not a positive number', 0)
  if (expected && count !== expected.length) {
    throw new VerifyError('render', `rendered ${count} steps, expected ${expected.length}`, 0)
  }
  const indexNow = async () => Number(await chrome.getAttribute('data-step-index'))

  for (let i = 0; i < count; i++) {
    current = i
    if ((await indexNow()) !== i) throw new VerifyError('render', `step index is not ${i}`, i)
    if (expected) {
      const title = await page.locator('[data-presentation-title]').first().textContent()
      const caption = await page.locator('[data-presentation-caption]').first().textContent()
      if (title !== expected[i].title) {
        throw new VerifyError('render', `title is ${JSON.stringify(title)}, expected ${JSON.stringify(expected[i].title)}`, i)
      }
      if (caption !== expected[i].caption) {
        throw new VerifyError('render', `caption is ${JSON.stringify(caption)}, expected ${JSON.stringify(expected[i].caption)}`, i)
      }
    }
    await delay(settleMs)
    assertClean()
    log(`[verify] step ${i} of ${count - 1} ok`)
    if (i === count - 1) break
    current = i + 1 // the next step renders as soon as the key is handled
    await page.keyboard.press('ArrowRight')
    try {
      await page.waitForFunction(
        ([n]) => document.querySelector('[data-step-count]')?.getAttribute('data-step-index') === String(n),
        [i + 1],
        { timeout: 3000 },
      )
    } catch {
      assertClean()
      throw new VerifyError('render', `ArrowRight did not advance from step ${i} to ${i + 1}`, i)
    }
  }
  assertClean()
}

export async function renderAll(root, slugs, log = console.log, { launch } = {}) {
  const launchBrowser = launch ?? (async () => (await import('playwright')).chromium.launch())
  await withPreview(
    root,
    async (port) => {
      let browser
      try {
        browser = await launchBrowser()
      } catch (err) {
        throw new VerifyError('render', `cannot launch Chromium: ${err.message}`)
      }
      try {
        for (const slug of slugs) {
          const url = previewUrl(port, `/${slug}`)
          log(`[verify] render ${url}`)
          const page = await browser.newPage()
          try {
            await checkRoute(page, url, { expected: slug === SAMPLE_SLUG ? EXPECTED_SAMPLE : undefined, log })
          } finally {
            await page.close()
          }
        }
      } finally {
        await browser.close()
      }
    },
    log,
  )
}

export async function verify(root, log = console.log) {
  let sample
  const phases = [
    { name: 'build', run: () => buildApp(root) },
    {
      name: 'sample',
      run: async () => {
        sample = await loadSample(root)
        checkSample(sample)
      },
    },
    { name: 'render', run: () => renderAll(root, sample.slugs, log) },
  ]
  const outcome = await runPhases(phases, log)
  log(`[verify] ${formatOutcome(outcome)}`)
  return outcome
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const outcome = await verify(root)
  process.exit(outcome.ok ? 0 : 1)
}
