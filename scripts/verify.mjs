// Deterministic gate: build the whole app, then render every registered presentation step by
// step in Chromium against a production preview on 127.0.0.1.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HOST, launchChromium, runBuild, startPreview } from './lib/preview.mjs'
import { VerifyError, renderPresentation } from './lib/render.mjs'

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
    try {
      browser = await launchChromium({ root })
    } catch (err) {
      throw new VerifyError('browser', err.message)
    }
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
