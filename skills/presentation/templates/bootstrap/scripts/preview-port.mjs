import { createServer } from 'node:net'

export async function assertPreviewPortAvailable(host, port) {
  const probe = createServer()
  await new Promise((resolve, reject) => {
    probe.once('error', (error) => {
      if (error.code === 'EADDRINUSE') reject(new Error(`Preview port ${host}:${port} is already in use`))
      else reject(error)
    })
    probe.listen(port, host, () => {
      probe.close((error) => error ? reject(error) : resolve())
    })
  })
}
