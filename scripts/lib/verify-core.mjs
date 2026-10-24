import { chromium } from 'playwright'
import { driveSteps } from './step-driver.mjs'
import { runBuild, startPreview } from './preview.mjs'
import { VerifyError } from './report.mjs'

export const DESKTOP = { width: 1440, height: 900 }

const defaultDeps = {
  build: runBuild,
  startPreview,
  launchBrowser: () => chromium.launch(),
  driveSteps,
}

/** The registry check: the route's slug must be listed on the landing page. */
async function assertRegistered(page, origin, slug) {
  await page.goto(`${origin}/`)
  const found = await page.evaluate((s) => document.querySelector(`a[data-presentation-slug="${s}"]`) !== null, slug)
  if (!found) throw new VerifyError('sample', `"${slug}" is not registered in the presentation index`)
}

/**
 * Build everything, serve the production build on 127.0.0.1, and step every
 * configured route in Chromium. Resolves with per-route results or throws a
 * VerifyError; the preview server and browser are always shut down.
 */
export async function runVerify({ root, config, log = console.log, deps = {} }) {
  const d = { ...defaultDeps, ...deps }

  log('verify: building the whole app (npm run build)')
  const build = await d.build(root)
  if (!build.ok) throw new VerifyError('build', `npm run build failed:\n${build.output}`)

  let preview
  let browser
  try {
    try {
      preview = await d.startPreview(root)
    } catch (err) {
      throw new VerifyError('preview', err instanceof Error ? err.message : String(err))
    }
    log(`verify: preview ready at ${preview.origin}`)
    try {
      browser = await d.launchBrowser()
    } catch (err) {
      throw new VerifyError('browser', err instanceof Error ? err.message : String(err))
    }
    const results = []
    for (const route of config.routes) {
      log(`verify: rendering ${preview.origin}/${route.slug}`)
      const context = await browser.newContext({ viewport: DESKTOP })
      try {
        const page = await context.newPage()
        await assertRegistered(page, preview.origin, route.slug)
        const run = await d.driveSteps(page, `${preview.origin}/${route.slug}`, {
          outline: route.outline,
          onStep: ({ index, title }) => log(`verify:   step index ${index} ok: ${title}`),
        })
        results.push({ slug: route.slug, count: run.count })
      } finally {
        await context.close()
      }
    }
    return results
  } finally {
    await browser?.close()
    await preview?.stop()
  }
}
