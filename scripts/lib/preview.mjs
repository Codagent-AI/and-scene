import net from 'node:net'

export const HOST = '127.0.0.1'

/** Ask the OS for a free IPv4 loopback port. */
export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, HOST, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

/** Poll until the preview answers on the IPv4 loopback address. */
export async function waitForReady(url, { timeoutMs = 20000, fetchImpl = fetch } = {}) {
  const deadline = Date.now() + timeoutMs
  let lastError
  while (Date.now() < deadline) {
    try {
      const res = await fetchImpl(url)
      if (res.ok) return
      lastError = new Error(`HTTP ${res.status}`)
    } catch (err) {
      lastError = err
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  throw new Error(`preview did not become ready at ${url}: ${lastError?.message ?? 'timeout'}`)
}

/** Start `vite preview` on 127.0.0.1 in-process; returns the server and its origin. */
export async function startPreview(root, port) {
  const { preview } = await import('vite')
  const server = await preview({
    root,
    logLevel: 'error',
    preview: { host: HOST, port, strictPort: true, open: false },
  })
  return { server, origin: `http://${HOST}:${port}`, close: () => server.close() }
}
