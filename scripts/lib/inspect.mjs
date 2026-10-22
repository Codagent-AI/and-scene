import path from 'node:path'
import { parseArgs } from 'node:util'
import { screenshotName, warningsForStep } from './diagnostics.mjs'

export const DEFAULTS = { out: 'inspection', viewport: '1440x900', settleMs: 1200 }

export function parseViewport(text) {
  const match = /^(\d+)x(\d+)$/.exec(text)
  if (!match) throw new Error(`invalid --viewport "${text}"; expected WIDTHxHEIGHT such as 1440x900`)
  return { width: Number(match[1]), height: Number(match[2]) }
}

/** `inspect-presentation.mjs <slug> [--out DIR] [--viewport WxH] [--settle-ms N] [--no-build]` */
export function parseInspectArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      out: { type: 'string', default: DEFAULTS.out },
      viewport: { type: 'string', default: DEFAULTS.viewport },
      'settle-ms': { type: 'string', default: String(DEFAULTS.settleMs) },
      'no-build': { type: 'boolean', default: false },
    },
  })
  const [slug] = positionals
  if (!slug) throw new Error('usage: inspect-presentation.mjs <slug> [--out DIR] [--viewport WxH] [--settle-ms N] [--no-build]')
  const settleMs = Number(values['settle-ms'])
  if (!Number.isFinite(settleMs) || settleMs < 0) throw new Error(`invalid --settle-ms "${values['settle-ms']}"`)
  return { slug, out: values.out, viewport: parseViewport(values.viewport), settleMs, build: !values['no-build'] }
}

export const screenshotPath = (out, slug, index) => path.join(out, slug, screenshotName(index))

/**
 * Walks every step: advance, wait for the step to be active, wait out the settle
 * interval, then capture and diagnose. The adapters keep this testable without a browser.
 */
export async function captureSteps({ count, settleMs, advance, waitForStep, sleep, screenshot, collect, warn }) {
  const written = []
  for (let index = 0; index < count; index += 1) {
    if (index > 0) {
      await advance()
      await waitForStep(index)
    }
    await sleep(settleMs)
    written.push(await screenshot(index))
    for (const line of warningsForStep(index, await collect(index))) warn(line)
  }
  return written
}
