import net from 'node:net'
import { chromium } from 'playwright'
import { preview } from 'vite'

export const LOOPBACK = '127.0.0.1'

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, LOOPBACK, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

async function waitReady(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not listening yet
    }
    if (Date.now() > deadline) throw new Error(`preview did not become ready at ${url}`)
    await new Promise((r) => setTimeout(r, 100))
  }
}

/** Starts `vite preview` in-process on the IPv4 loopback address. */
export async function startPreview(root) {
  const port = await freePort()
  const server = await preview({
    root,
    logLevel: 'error',
    preview: { host: LOOPBACK, port, strictPort: true, open: false },
  })
  const url = `http://${LOOPBACK}:${port}`
  try {
    await waitReady(`${url}/`)
  } catch (err) {
    await server.close()
    throw err
  }
  return { url, close: () => server.close() }
}

export function launchBrowser() {
  const args = process.getuid?.() === 0 ? ['--no-sandbox'] : []
  return chromium.launch({ headless: true, args })
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Resolves once the presentation chrome reports `index` as the active step. */
export function waitForStepIndex(page, index, timeout) {
  return page.waitForFunction(
    (n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n),
    index,
    { timeout },
  )
}
