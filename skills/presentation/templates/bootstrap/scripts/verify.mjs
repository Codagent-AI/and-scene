#!/usr/bin/env node
// Production verification gate: build, sample validation, then a real-browser
// render of every step over `vite preview` on 127.0.0.1. Exits non-zero on failure.
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { HOST, launchChromium, runNpm, startPreview, urlFor } from './lib/preview.mjs'

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()

export class VerifyError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

/** Describe a failure in one greppable line naming the phase and, when known, the step. */
export function formatFailure(e) {
  const phase = e instanceof VerifyError ? e.phase : 'internal'
  const step = e instanceof VerifyError && e.step !== undefined ? ` step=${e.step}` : ''
  return `verify: FAIL phase=${phase}${step}: ${e.message}`
}

/** Compare the registry and the actual narration data with the expected outline. */
export function validateSample({ registrySource, narration, manifest }) {
  const errors = []
  const slugRe = new RegExp(`slug:\\s*['"\`]${manifest.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`)
  if (!slugRe.test(registrySource ?? '')) errors.push(`sample "${manifest.slug}" is not registered`)
  if (!Array.isArray(narration)) return [...errors, 'sample narration is missing or malformed']
  if (narration.length !== manifest.steps.length) errors.push(`expected ${manifest.steps.length} steps, found ${narration.length}`)
  manifest.steps.forEach((want, i) => {
    const got = narration[i]
    if (!got) return
    for (const field of ['era', 'title', 'caption']) {
      if (norm(got[field]) !== norm(want[field])) errors.push(`step ${i + 1} ${field}: expected "${want[field]}", found "${got[field] ?? ''}"`)
    }
  })
  return errors
}

async function loadManifest(cwd, manifestPath) {
  try {
    return JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch (e) {
    throw new VerifyError('sample', `cannot read verification manifest ${manifestPath}: ${e.message}`)
  }
}

async function checkSample(cwd, manifest) {
  let registrySource
  let narration
  try {
    registrySource = await readFile(join(cwd, manifest.registry), 'utf8')
  } catch {
    throw new VerifyError('sample', `presentation registry ${manifest.registry} is missing`)
  }
  try {
    const mod = await import(`${pathToFileURL(join(cwd, manifest.narration)).href}?t=${Date.now()}`)
    narration = mod.NARRATION
  } catch (e) {
    throw new VerifyError('sample', `reference sample ${manifest.narration} is missing or malformed: ${e.message}`)
  }
  const errors = validateSample({ registrySource, narration, manifest })
  if (errors.length) throw new VerifyError('sample', errors.join('; '))
}

/** Step through the sample in Chromium; every console/page error is attributed to the step on screen. */
export async function renderSample({ baseUrl, manifest, log = console.log, settleMs = 600 }) {
  const browser = await launchChromium().catch((e) => {
    throw new VerifyError('render', e.message)
  })
  try {
    const page = await browser.newPage()
    let current = 0
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push({ step: current, text: m.text() }))
    page.on('pageerror', (e) => errors.push({ step: current, text: e.message }))
    const fail = () => {
      if (errors.length) throw new VerifyError('render', `${errors[0].text}`, errors[0].step)
    }
    const url = `${baseUrl}/${manifest.slug}`
    await page.goto(url, { waitUntil: 'load' })
    const root = page.locator('[data-step-count]')
    await root.waitFor({ state: 'attached', timeout: 10000 }).catch(() => {
      fail()
      throw new VerifyError('render', `no presentation chrome found at ${url}`, 0)
    })
    const count = Number(await root.getAttribute('data-step-count'))
    if (count !== manifest.steps.length) throw new VerifyError('render', `data-step-count is ${count}, expected ${manifest.steps.length}`)
    for (let i = 0; i < count; i++) {
      current = i
      const index = () => page.locator('[data-step-index]').getAttribute('data-step-index')
      if (Number(await index()) !== i) throw new VerifyError('render', `expected data-step-index ${i}, found ${await index()}`, i)
      const want = manifest.steps[i]
      const title = norm(await page.locator('[data-presentation-title]').first().textContent())
      if (title !== norm(want.title)) throw new VerifyError('render', `title "${title}" does not match "${want.title}"`, i)
      const caption = page.locator('[data-presentation-caption]')
      if ((await caption.count()) && norm(await caption.textContent()) !== norm(want.caption)) {
        throw new VerifyError('render', `caption does not match "${want.caption}"`, i)
      }
      await page.waitForTimeout(settleMs)
      fail()
      log(`verify: step ${i} rendered (${want.title})`)
      if (i === count - 1) break
      current = i + 1
      await page.keyboard.press('ArrowRight')
      const advanced = await page
        .waitForFunction((n) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(n), i + 1, { timeout: 5000 })
        .then(() => true, () => false)
      fail()
      if (!advanced) throw new VerifyError('render', `step ${i} did not advance to ${i + 1} (data-step-index stayed ${await index()})`, i + 1)
    }
    fail()
  } finally {
    await browser.close()
  }
}

export async function runVerify({ cwd = process.cwd(), manifestPath = join(cwd, 'scripts', 'verify-manifest.json'), log = console.log } = {}) {
  let preview
  try {
    log('verify: phase build')
    const build = await runNpm(cwd, ['run', 'build'])
    if (build.code !== 0) throw new VerifyError('build', `npm run build failed:\n${build.output.trim().split('\n').slice(-25).join('\n')}`)
    log('verify: build passed')

    const manifest = await loadManifest(cwd, manifestPath)
    log('verify: phase sample')
    await checkSample(cwd, manifest)
    log(`verify: sample "${manifest.slug}" is registered with ${manifest.steps.length} steps in order`)

    log(`verify: phase render (preview on ${HOST})`)
    try {
      preview = await startPreview(cwd)
    } catch (e) {
      throw new VerifyError('render', e.message)
    }
    log(`verify: preview ready at ${urlFor(preview.port)} (pid ${preview.pid})`)
    await renderSample({ baseUrl: `http://${HOST}:${preview.port}`, manifest, log })
    log('verify: PASS')
    return { ok: true }
  } catch (e) {
    log(formatFailure(e))
    return { ok: false, error: e }
  } finally {
    await preview?.stop()
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const { ok } = await runVerify()
  process.exit(ok ? 0 : 1)
}
