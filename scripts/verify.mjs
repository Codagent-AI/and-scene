// Deterministic gate: build the whole app, then render every registered presentation step by
// step in Chromium against a production preview on 127.0.0.1.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HOST, launchChromium, runBuild, sleep, startPreview } from './lib/preview.mjs'

const STEP_TIMEOUT = 5000

class VerifyError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

function parseArgs(argv) {
  const args = { root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), build: true }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') args.root = path.resolve(argv[++i])
    else if (argv[i] === '--skip-build') args.build = false
  }
  return args
}

function registeredSlugs(root) {
  const file = path.join(root, 'src', 'presentations', 'index.ts')
  if (!fs.existsSync(file)) throw new VerifyError('registry', `missing ${path.relative(root, file)}`)
  const source = fs.readFileSync(file, 'utf8')
  return [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

function readReference(root) {
  const file = path.join(root, 'scripts', 'reference-sample.json')
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null
}

async function renderPresentation(browser, baseUrl, slug, reference) {
  const page = await browser.newPage()
  let current = 0
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ step: current, text: msg.text() })
  })
  page.on('pageerror', (err) => errors.push({ step: current, text: String(err) }))
  const fail = (message, step = current) => new VerifyError('render', `${slug}: ${message}`, step + 1)
  const firstError = () => errors[0]
  try {
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'load' })
    const root = page.locator('[data-presentation-root]')
    try {
      await root.waitFor({ timeout: STEP_TIMEOUT })
    } catch {
      throw fail(firstError() ? `did not render: ${firstError().text}` : 'presentation root never rendered')
    }
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw fail('data-step-count hook missing or invalid')
    if (reference && count !== reference.steps.length) {
      throw new VerifyError('reference-sample', `${slug}: expected ${reference.steps.length} steps, found ${count}`, 1)
    }
    if ((await root.getAttribute('data-presentation-mode')) !== 'browse') await page.keyboard.press('p')
    for (let i = 0; i < count; i++) {
      current = i
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n),
            i,
            { timeout: STEP_TIMEOUT },
          )
        } catch {
          throw fail(`step index did not advance to ${i}`)
        }
      }
      await sleep(150)
      if (errors.length) throw fail(`browser error: ${errors[0].text}`, errors[0].step)
      if (reference) {
        const title = (await page.locator('[data-presentation-title]').textContent())?.trim()
        const caption = (await page.locator('[data-presentation-caption]').textContent())?.trim()
        const want = reference.steps[i]
        if (title !== want.title || caption !== want.caption) {
          throw new VerifyError(
            'reference-sample',
            `${slug}: step ${i + 1} should be "${want.title}" but shows "${title}"${caption === want.caption ? '' : ' (caption differs)'}`,
            i + 1,
          )
        }
      }
    }
    console.log(`[verify] render ${slug}: ${count} steps ok`)
  } finally {
    await page.close()
  }
}

async function main() {
  const { root, build } = parseArgs(process.argv.slice(2))
  if (build) {
    console.log('[verify] build: running npm run build')
    const result = await runBuild(root)
    if (result.code !== 0) throw new VerifyError('build', `npm run build failed (exit ${result.code})\n${result.output.trim()}`)
    console.log('[verify] build: ok')
  }

  const slugs = registeredSlugs(root)
  const reference = readReference(root)
  if (reference && !slugs.includes(reference.slug)) {
    throw new VerifyError('reference-sample', `reference sample "${reference.slug}" is not registered in src/presentations/index.ts`)
  }
  if (slugs.length === 0) throw new VerifyError('registry', 'no presentations registered')

  const preview = await startPreview(root)
  console.log(`[verify] preview ${preview.url} (host ${HOST})`)
  let browser
  try {
    browser = await launchChromium()
    for (const slug of slugs) {
      await renderPresentation(browser, preview.url, slug, reference?.slug === slug ? reference : null)
    }
  } finally {
    await browser?.close()
    await preview.stop()
  }
}

main().then(
  () => console.log('VERIFY PASS'),
  (err) => {
    if (err instanceof VerifyError) {
      console.error(`VERIFY FAIL [${err.phase}]${err.step ? ` step ${err.step}` : ''}: ${err.message}`)
    } else {
      console.error(`VERIFY FAIL [internal]: ${err?.stack ?? err}`)
    }
    process.exitCode = 1
  },
)
