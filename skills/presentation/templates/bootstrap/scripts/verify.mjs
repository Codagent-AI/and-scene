// Deterministic gate: build the whole app, confirm the reference sample is registered and
// matches its outline, then step through it in Chromium against a production preview.
// Prints one labelled line per phase and a single final PASS/FAIL line; exits non-zero on failure.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import {
  HOST,
  installSignalCleanup,
  normalize,
  projectRoot,
  runNpm,
  sleep,
  startPreview,
  stopAll,
} from './lib/runtime.mjs'

const STEP_TIMEOUT_MS = 5000
const SETTLE_MS = Number(process.env.VERIFY_SETTLE_MS ?? 700)

class VerifyError extends Error {
  constructor(phase, message) {
    super(message)
    this.phase = phase
  }
}

const log = (line) => console.log(`[verify] ${line}`)

function loadReference() {
  const configPath = join(projectRoot, 'scripts', 'verify.config.json')
  return JSON.parse(readFileSync(configPath, 'utf8')).reference
}

function compareSteps(expected, actual, where) {
  if (actual.length !== expected.length) {
    throw new VerifyError(
      where,
      `expected ${expected.length} steps but found ${actual.length}`,
    )
  }
  expected.forEach((want, index) => {
    for (const field of ['era', 'title', 'caption']) {
      if (normalize(actual[index][field]) !== normalize(want[field])) {
        throw new VerifyError(
          where,
          `step index ${index} ${field}: expected "${want[field]}" but found "${actual[index][field]}"`,
        )
      }
    }
  })
}

async function build() {
  log('phase build: start')
  const { code, output } = await runNpm('build')
  if (code !== 0) {
    console.log(output.split('\n').slice(-40).join('\n'))
    throw new VerifyError('build', `npm run build exited with code ${code}`)
  }
  log('phase build: PASS')
}

async function checkSampleRegistration(reference) {
  log('phase sample-registration: start')
  const phase = 'sample-registration'
  const registryPath = join(projectRoot, 'src', 'presentations', 'index.ts')
  const registry = existsSync(registryPath) ? readFileSync(registryPath, 'utf8') : ''
  const entry = new RegExp(
    `slug:\\s*['"]${reference.slug}['"][\\s\\S]*?import\\(\\s*['"]\\./([^'"]+)['"]\\s*\\)`,
  ).exec(registry)
  if (!entry) {
    throw new VerifyError(phase, `reference sample "${reference.slug}" is not registered in src/presentations/index.ts`)
  }
  const entryFile = ['.tsx', '.ts'].map((ext) => join(projectRoot, 'src', 'presentations', entry[1] + ext)).find(existsSync)
  if (!entryFile) {
    throw new VerifyError(phase, `registered entry for "${reference.slug}" is missing (${entry[1]})`)
  }
  const outlinePath = join(projectRoot, reference.outline)
  if (!existsSync(outlinePath)) {
    throw new VerifyError(phase, `reference sample outline is missing (${reference.outline})`)
  }
  const { OUTLINE } = await import(pathToFileURL(outlinePath).href)
  compareSteps(reference.steps, OUTLINE, phase)
  log(`phase ${phase}: PASS (${OUTLINE.length} steps)`)
}

async function renderSample(reference) {
  const phase = 'render'
  log('phase render: start')
  const preview = await startPreview()
  log(`preview probe ${preview.probeUrl}`)
  log(`preview bound ${preview.boundUrl ?? 'unreported'}`)
  if (preview.boundUrl && !preview.boundUrl.includes(`//${HOST}:`)) {
    throw new VerifyError(phase, `preview bound ${preview.boundUrl}, expected ${HOST}`)
  }
  const url = `${preview.baseUrl}/${reference.slug}`
  log(`browser url ${url}`)

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    let currentStep = 0
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push({ step: currentStep, text: message.text() })
    })
    page.on('pageerror', (error) => errors.push({ step: currentStep, text: String(error) }))
    const failIfErrors = () => {
      if (errors.length) {
        throw new VerifyError(phase, `step index ${errors[0].step}: browser error: ${errors[0].text}`)
      }
    }

    await page.goto(url)
    try {
      await page.waitForSelector('[data-step-count]', { timeout: STEP_TIMEOUT_MS })
    } catch {
      failIfErrors()
      throw new VerifyError(phase, `step index 0: presentation did not render at ${url}`)
    }
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    if (count !== reference.steps.length) {
      throw new VerifyError(phase, `data-step-count is ${count}, expected ${reference.steps.length}`)
    }
    if ((await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')) !== reference.initialMode) {
      await page.keyboard.press('p')
    }

    const read = () =>
      page.evaluate(() => {
        const text = (selector) => document.querySelector(selector)?.textContent ?? ''
        return {
          era: text('[data-presentation-era]'),
          title: text('[data-presentation-title]'),
          caption: text('[data-presentation-caption]'),
        }
      })

    for (let index = 0; index < count; index++) {
      currentStep = index
      if (index > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (want) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === want,
            String(index),
            { timeout: STEP_TIMEOUT_MS },
          )
        } catch {
          failIfErrors()
          throw new VerifyError(phase, `step index ${index}: transition did not advance data-step-index`)
        }
      }
      await sleep(SETTLE_MS)
      failIfErrors()
      const shown = await read()
      const want = reference.steps[index]
      for (const field of ['era', 'title', 'caption']) {
        if (normalize(shown[field]) !== normalize(want[field])) {
          throw new VerifyError(phase, `step index ${index} ${field}: rendered "${shown[field]}", expected "${want[field]}"`)
        }
      }
      log(`step index ${index}: ok`)
    }

    // Every other registered presentation must at least render its first step cleanly.
    const registry = readFileSync(join(projectRoot, 'src', 'presentations', 'index.ts'), 'utf8')
    const others = [...registry.matchAll(/slug:\s*['"]([^'"]+)['"]/g)]
      .map((match) => match[1])
      .filter((slug) => slug !== reference.slug)
    for (const slug of others) {
      currentStep = 0
      errors.length = 0
      await page.goto(`${preview.baseUrl}/${slug}`)
      try {
        await page.waitForSelector('[data-step-count]', { timeout: STEP_TIMEOUT_MS })
      } catch {
        failIfErrors()
        throw new VerifyError(phase, `presentation "${slug}" step index 0: did not render`)
      }
      await sleep(SETTLE_MS)
      if (errors.length) {
        throw new VerifyError(phase, `presentation "${slug}" step index 0: browser error: ${errors[0].text}`)
      }
      log(`presentation ${slug}: first step ok`)
    }
  } finally {
    await browser.close()
  }
  log('phase render: PASS')
}

async function main() {
  installSignalCleanup()
  let failure = null
  try {
    const reference = loadReference()
    await build()
    await checkSampleRegistration(reference)
    await renderSample(reference)
  } catch (error) {
    failure = error instanceof VerifyError ? error : new VerifyError('verify', error?.stack ?? String(error))
  } finally {
    await stopAll()
  }
  if (failure) {
    log(`FAIL phase=${failure.phase}: ${failure.message}`)
    process.exit(1)
  }
  log('PASS')
}

await main()
