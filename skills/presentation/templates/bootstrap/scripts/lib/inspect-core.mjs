import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { captureSteps } from './capture.mjs'
import { runCleanups } from './cleanup.mjs'
import { analyzeSnapshot, extractSnapshot } from './diagnostics.mjs'
import { runBuild, startPreview } from './preview.mjs'
import { collectErrors, waitForIndex } from './step-driver.mjs'

const defaultDeps = { build: runBuild, startPreview, launchBrowser: () => chromium.launch() }

/**
 * Build (unless disabled), serve the production build on 127.0.0.1, and capture
 * every step of one presentation. The preview and browser are always shut down,
 * including when the browser fails to launch.
 */
export async function runInspect({ root, opts, log = console.log, deps = {} }) {
  const d = { ...defaultDeps, ...deps }
  const outDir = path.resolve(root, opts.out ?? path.join('inspection-output', opts.slug))
  if (opts.build) {
    const build = await d.build(root)
    if (!build.ok) throw new Error(`npm run build failed:\n${build.output}`)
  }
  let preview
  let browser
  try {
    preview = await d.startPreview(root)
    browser = await d.launchBrowser()
    const page = await browser.newPage({ viewport: { width: opts.width, height: opts.height } })
    const errors = collectErrors(page, () => 0)
    await page.goto(`${preview.origin}/${opts.slug}`)
    const hooks = await waitForIndex(page, 0, { timeoutMs: opts.hooksTimeoutMs ?? 10_000 })
    if (!hooks || !(hooks.count > 0)) throw new Error(`no presentation found at /${opts.slug} (is it registered?)`)
    await mkdir(outDir, { recursive: true })
    const records = await captureSteps({
      page,
      count: hooks.count,
      outDir,
      settleMs: opts.settle,
      shoot: (file) => page.screenshot({ path: file }),
      snapshot: () => page.evaluate(extractSnapshot),
    })
    const warnings = records.flatMap((r) => analyzeSnapshot(r.index + 1, r.snapshot))
    for (const w of warnings) log(`warning: step ${w.step} ${w.kind}: ${w.message}`)
    for (const e of errors) log(`browser error: ${e.text}`)
    const steps = records.map((r) => ({ index: r.index, file: r.file, settleMs: r.settleMs, waitedMs: r.waitedMs, unsettled: r.snapshot.unsettled }))
    await writeFile(
      path.join(outDir, 'report.json'),
      JSON.stringify({ slug: opts.slug, viewport: { width: opts.width, height: opts.height }, steps, warnings, errors }, null, 2),
    )
    log(`inspect: ${records.length} screenshots in ${path.relative(root, outDir)}; ${warnings.length} advisory warning(s)`)
    return { records, warnings }
  } finally {
    await runCleanups([() => browser?.close(), () => preview?.stop()], log)
  }
}
