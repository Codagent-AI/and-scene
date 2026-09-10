import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'

async function waitForPreview(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // The preview may still be starting.
    }
    await delay(125)
  }
  throw new Error(`preview readiness failed at ${url}`)
}

export async function withPresentationPage(port, slug, inspect) {
  const preview = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js', 'preview',
    '--host', host, '--port', String(port), '--strictPort',
  ], { stdio: 'inherit' })
  // Subscribe immediately: startup may fail before readiness or browser launch.
  const previewExited = once(preview, 'exit')
  try {
    const url = `http://${host}:${port}/${slug}`
    await waitForPreview(url)
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      return await inspect(page, url)
    } finally {
      await browser.close()
    }
  } finally {
    if (preview.exitCode === null && preview.signalCode === null) preview.kill('SIGTERM')
    await previewExited.catch(() => undefined)
  }
}
