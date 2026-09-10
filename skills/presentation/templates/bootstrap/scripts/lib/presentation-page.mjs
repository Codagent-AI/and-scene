import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { stripVTControlCharacters } from 'node:util'
import { chromium } from 'playwright'

const host = '127.0.0.1'

function waitForListening(preview, url, signal) {
  const address = new URL('/', url).href
  return new Promise((resolve, reject) => {
    let output = ''
    function cleanup() {
      preview.stdout.off('data', onData)
      signal.removeEventListener('abort', onAbort)
    }
    function onAbort() {
      cleanup()
      reject(signal.reason)
    }
    function onData(chunk) {
      output = stripVTControlCharacters(output + chunk.toString()).slice(-4096)
      const listening = output.split('\n').some((line) => {
        const marker = line.indexOf('Local:')
        return marker !== -1 && line.slice(marker + 'Local:'.length).trim() === address
      })
      if (listening) {
        cleanup()
        resolve()
      }
    }
    preview.stdout.on('data', onData)
    signal.addEventListener('abort', onAbort, { once: true })
    if (signal.aborted) onAbort()
  })
}

async function waitForPreview(url, signal) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    signal.throwIfAborted()
    try {
      const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(500)])
      if ((await fetch(url, { signal: requestSignal })).ok) return
    } catch {
      signal.throwIfAborted()
    }
    await delay(125, undefined, { signal }).catch((error) => {
      throw signal.reason ?? error
    })
  }
  throw new Error(`preview readiness failed at ${url}`)
}

export async function withPresentationPage(port, slug, inspect) {
  const url = `http://${host}:${port}/${slug}`
  const preview = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js', 'preview',
    '--host', host, '--port', String(port), '--strictPort', '--logLevel', 'info',
  ], { stdio: ['inherit', 'pipe', 'inherit'] })
  // Subscribe immediately: startup may fail before readiness or browser launch.
  const previewExited = once(preview, 'exit')
  const previewFailed = previewExited.then(([code, signal]) => {
    throw new Error(`preview readiness failed: process exited (code ${code}, signal ${signal})`)
  })
  preview.stdout.pipe(process.stdout, { end: false })
  const startup = new AbortController()
  const timeout = setTimeout(() => {
    startup.abort(new Error(`preview readiness failed at ${url}: startup timed out`))
  }, 5000)

  function assertPreviewRunning() {
    if (preview.exitCode !== null || preview.signalCode !== null) {
      throw new Error(`preview readiness failed: process exited before inspection`)
    }
  }

  try {
    const ready = async () => {
      // An unrelated HTTP server may answer before Vite fails to bind its port.
      // Vite prints its Local URL only after its own listener has started.
      await waitForListening(preview, url, startup.signal)
      await waitForPreview(url, startup.signal)
    }
    await Promise.race([ready(), previewFailed])
    clearTimeout(timeout)
    assertPreviewRunning()
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      assertPreviewRunning()
      return await inspect(page, url)
    } finally {
      await browser.close()
    }
  } finally {
    clearTimeout(timeout)
    startup.abort()
    if (preview.exitCode === null && preview.signalCode === null) preview.kill('SIGTERM')
    await previewExited.catch(() => undefined)
  }
}
