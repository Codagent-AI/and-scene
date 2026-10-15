#!/usr/bin/env node
// Deterministic verification gate: build -> sample -> render.
//
// Usage: node scripts/verify.mjs [--root <dir>] [--slug <slug>] [--timeout <ms>]
//   --root     project root to verify (default: the repository root)
//   --slug     sample route to render (default: SAMPLE.slug)
// Env equivalents: VERIFY_ROOT, VERIFY_SLUG, VERIFY_TIMEOUT.
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ---- Sample-specific constants (the only repository-specific assumptions) ----
export const SAMPLE = {
  slug: 'how-to-make-a-presentation',
  dir: 'src/presentations/how-to-make-a-presentation',
  registry: 'src/presentations/index.ts',
  steps: [
    { era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.' },
    { era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.' },
    { era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.' },
    { era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.' },
    { era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.' },
    { era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.' },
    { era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.' },
    { era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.' },
    { era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.' },
  ],
}
// ------------------------------------------------------------------------------

const HOST = '127.0.0.1'
const SETTLE_MS = 1300 // layout move + newcomer enter + scene fade, with margin

function parseArgs(argv, env) {
  const opts = {
    root: env.VERIFY_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    slug: env.VERIFY_SLUG || SAMPLE.slug,
    timeout: Number(env.VERIFY_TIMEOUT || 120000),
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--root') opts.root = path.resolve(argv[++i])
    else if (a === '--slug') opts.slug = argv[++i]
    else if (a === '--timeout') opts.timeout = Number(argv[++i])
    else throw new Error(`unknown argument: ${a}`)
  }
  opts.root = path.resolve(opts.root)
  if (!Number.isFinite(opts.timeout) || opts.timeout <= 0) throw new Error(`timeout must be a positive number of ms, got ${opts.timeout}`)
  return opts
}

class PhaseError extends Error {}

// Preview processes are killed on any exit path, including signals and the overall timeout.
const stoppers = new Set()
process.on('exit', () => stoppers.forEach((stop) => stop()))
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130))

function runBuild(root) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new PhaseError(`npm run build exited with code ${code}\n${out.trim().split('\n').slice(-25).join('\n')}`))
    })
  })
}

function checkSample(root, slug) {
  const dir = path.join(root, SAMPLE.dir)
  if (!existsSync(dir)) throw new PhaseError(`reference sample directory missing: ${SAMPLE.dir}`)
  const registryFile = path.join(root, SAMPLE.registry)
  if (!existsSync(registryFile)) throw new PhaseError(`registry missing: ${SAMPLE.registry}`)
  const registry = readFileSync(registryFile, 'utf8')
  const registered = [...registry.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
  if (!registered.includes(slug)) {
    throw new PhaseError(`sample "${slug}" is not registered in ${SAMPLE.registry}`)
  }
  const stepsDir = path.join(dir, 'steps')
  const files = existsSync(stepsDir) ? readdirSync(stepsDir).filter((f) => /\.tsx?$/.test(f)).sort() : []
  if (files.length === 0) throw new PhaseError(`no step sources found in ${SAMPLE.dir}/steps`)
  const source = files.map((f) => readFileSync(path.join(stepsDir, f), 'utf8')).join('\n')
  let cursor = 0
  SAMPLE.steps.forEach((s, i) => {
    for (const [label, text] of [['title', s.title], ['caption', s.caption]]) {
      const at = source.indexOf(text, cursor)
      if (at < 0) {
        const anywhere = source.includes(text)
        throw new PhaseError(`step ${i} ${label} ${anywhere ? 'is out of order' : 'is missing or retitled'}: ${JSON.stringify(text)}`)
      }
      cursor = at + text.length
    }
  })
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.on('error', reject)
    srv.listen(0, HOST, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

async function startPreview(root) {
  const port = await freePort()
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  let exited = false
  child.on('exit', () => (exited = true))
  const stop = () => {
    if (exited) return
    try { process.kill(-child.pid, 'SIGKILL') } catch { /* already gone */ }
  }
  stoppers.add(stop)
  const origin = `http://${HOST}:${port}`
  const deadline = Date.now() + 30000
  for (;;) {
    if (exited) { stop(); throw new PhaseError(`vite preview exited early\n${log.trim()}`) }
    try {
      const res = await fetch(`${origin}/`)
      if (res.ok) break
    } catch { /* not ready */ }
    if (Date.now() > deadline) { stop(); throw new PhaseError(`vite preview not ready at ${origin}\n${log.trim()}`) }
    await new Promise((r) => setTimeout(r, 150))
  }
  return { origin, stop }
}

async function renderSample(root, slug) {
  const { chromium } = await import('playwright')
  const preview = await startPreview(root)
  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    let current = -1 // step index errors are attributed to (-1 = load)
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push({ step: current, text: m.text() }) })
    page.on('pageerror', (e) => errors.push({ step: current, text: `uncaught: ${e.message}` }))
    const url = `${preview.origin}/${slug}`
    await page.goto(url, { waitUntil: 'load' })
    const root$ = page.locator('[data-presentation-root]')
    try {
      await root$.waitFor({ timeout: 10000 })
    } catch {
      throw new PhaseError(`no presentation root at ${url} (route missing or failed to render)${fmt(errors)}`)
    }
    const count = Number(await root$.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new PhaseError(`unreadable data-step-count at ${url}`)
    if (slug === SAMPLE.slug && count !== SAMPLE.steps.length) {
      throw new PhaseError(`expected ${SAMPLE.steps.length} steps, data-step-count is ${count}`)
    }
    const fail = (index, msg) => { throw new PhaseError(`step ${index}: ${msg}${fmt(errors)}`) }
    for (let i = 0; i < count; i++) {
      current = i
      const index = Number(await root$.getAttribute('data-step-index'))
      if (index !== i) fail(i, `data-step-index is ${index}, expected ${i} (transition did not advance)`)
      await page.waitForTimeout(SETTLE_MS)
      if (slug === SAMPLE.slug) {
        const title = (await page.locator('[data-presentation-step-title]').first().textContent())?.trim()
        const caption = (await page.locator('[data-presentation-caption]').first().textContent())?.trim()
        if (title !== SAMPLE.steps[i].title) fail(i, `title ${JSON.stringify(title)} != ${JSON.stringify(SAMPLE.steps[i].title)}`)
        if (caption !== SAMPLE.steps[i].caption) fail(i, `caption ${JSON.stringify(caption)} != ${JSON.stringify(SAMPLE.steps[i].caption)}`)
      }
      if (errors.length) fail(i, 'runtime/console error')
      if (i < count - 1) {
        current = i + 1 // errors raised while entering the next step belong to it
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n),
            i + 1,
            { timeout: 3000 },
          )
        } catch {
          fail(i + 1, `ArrowRight from step ${i} did not advance data-step-index to ${i + 1}`)
        }
      }
    }
    if (errors.length) fail(count - 1, 'runtime/console error')
    return count
  } finally {
    await browser?.close().catch(() => {})
    preview.stop()
  }
}

function fmt(errors) {
  return errors.length ? '\n' + errors.map((e) => `  [step ${e.step}] ${e.text}`).join('\n') : ''
}

export async function verify(opts) {
  const results = []
  let blocked = false
  const phases = [
    ['build', () => runBuild(opts.root).then(() => 'app builds')],
    ['sample', async () => { checkSample(opts.root, opts.slug); return `${SAMPLE.steps.length} steps registered in order` }],
    ['render', async () => `${await renderSample(opts.root, opts.slug)} steps rendered cleanly on ${HOST}`],
  ]
  for (const [name, run] of phases) {
    // build and sample are independent; render needs both to have passed.
    if (name === 'render' && blocked) {
      results.push({ name, status: 'SKIP', detail: 'blocked by earlier failure' })
      console.log(`SKIP ${name}: blocked by earlier failure`)
      continue
    }
    try {
      const detail = await run()
      results.push({ name, status: 'PASS', detail })
      console.log(`PASS ${name}: ${detail}`)
    } catch (err) {
      blocked = true
      const detail = err instanceof PhaseError ? err.message : `${err?.stack || err}`
      results.push({ name, status: 'FAIL', detail })
      console.log(`FAIL ${name}: ${detail}`)
    }
  }
  const failed = results.filter((r) => r.status === 'FAIL')
  console.log('')
  console.log(failed.length ? `VERIFY FAILED (${failed.map((f) => f.name).join(', ')})` : 'VERIFY PASSED (build, sample, render)')
  return failed.length ? 1 : 0
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  let opts
  try { opts = parseArgs(process.argv.slice(2), process.env) } catch (e) { console.error(e.message); process.exit(2) }
  const timer = setTimeout(() => { console.log(`FAIL verify: overall timeout after ${opts.timeout}ms`); process.exit(1) }, opts.timeout)
  verify(opts).then((code) => { clearTimeout(timer); process.exit(code) })
}
