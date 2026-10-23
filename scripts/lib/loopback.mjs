import net from 'node:net'

/** Verification and inspection never rely on how `localhost` resolves. */
export const HOST = '127.0.0.1'

export function previewUrl(port, pathname = '/') {
  return `http://${HOST}:${port}${pathname}`
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}
