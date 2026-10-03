import { preview } from 'vite'

/**
 * Starts the production preview in-process.
 *
 * Vite's programmatic API resolves only once the server is listening and hands
 * back the server itself, so ownership of the port is established by
 * construction. There is nothing to probe and no startup output to parse: with
 * strictPort a port already in use rejects here rather than being silently
 * adopted, which is what a spawn-and-poll approach cannot rule out.
 */
export async function startPreview(host, port) {
  return preview({ preview: { host, port, strictPort: true } })
}

export async function stopPreview(server) {
  if (server) await server.close()
}
