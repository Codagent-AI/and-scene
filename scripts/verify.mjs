#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exitOnSignals, launchBrowser, runNpmBuild, startPreview } from './lib/preview.mjs'
import { checkOutline, parseRegistry, planRoutes, renderPresentation, VerifyFailure } from './lib/verify-lib.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function runBuild() {
  try {
    await runNpmBuild(root)
  } catch (error) {
    throw new VerifyFailure('build', error.message)
  }
}

function readConfig() {
  const file = path.join(root, 'verify.config.json')
  if (!existsSync(file)) return {}
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    throw new VerifyFailure('sample', `verify.config.json is not valid JSON: ${error.message}`)
  }
}

function checkSample(config) {
  const registryFile = path.join(root, 'src', 'presentations', 'index.ts')
  if (!existsSync(registryFile)) throw new VerifyFailure('sample', 'src/presentations/index.ts is missing')
  const registered = parseRegistry(readFileSync(registryFile, 'utf8'))
  const required = config.required
  const slugs = planRoutes(registered, required?.slug)
  let outline
  if (required?.outline) {
    const outlineFile = path.join(root, required.outline)
    if (!existsSync(outlineFile)) throw new VerifyFailure('sample', `sample outline ${required.outline} is missing`)
    try {
      outline = JSON.parse(readFileSync(outlineFile, 'utf8'))
    } catch (error) {
      throw new VerifyFailure('sample', `sample outline ${required.outline} is malformed: ${error.message}`)
    }
  }
  return { slugs, required, outline }
}

async function render({ slugs, required, outline }) {
  const preview = await startPreview(root)
  console.log(`verify: preview ${preview.url}`)
  exitOnSignals(() => preview.stop())
  let browser
  try {
    browser = await launchBrowser()
    let steps = 0
    for (const slug of slugs) {
      const page = await browser.newPage()
      try {
        const seen = await renderPresentation(page, preview.url, slug)
        steps += seen.length
        if (outline && slug === required.slug) {
          const problems = checkOutline(seen, outline)
          if (problems.length) throw new VerifyFailure('sample', `${slug} does not match the outline:\n  ${problems.join('\n  ')}`, { slug })
        }
        console.log(`  rendered ${slug}: ${seen.length} steps (${preview.url}/${slug})`)
      } finally {
        await page.close()
      }
    }
    return steps
  } finally {
    await browser?.close()
    await preview.stop()
  }
}

async function main() {
  try {
    console.log('verify: build')
    await runBuild()
    console.log('verify: sample')
    const plan = checkSample(readConfig())
    console.log(`verify: render ${plan.slugs.join(', ')}`)
    const steps = await render(plan)
    console.log(`PASS verify: build, sample, render (${plan.slugs.length} presentations, ${steps} steps)`)
  } catch (error) {
    if (error instanceof VerifyFailure) {
      console.error(`FAIL ${error.phase}: ${error.message}`)
      if (error.slug) console.error(`  presentation: ${error.slug}`)
      if (error.step) console.error(`  step ${error.step} of ${error.total} (index ${error.index})`)
    } else {
      console.error(`FAIL render: ${error.stack ?? error}`)
    }
    process.exitCode = 1
  }
}

await main()
