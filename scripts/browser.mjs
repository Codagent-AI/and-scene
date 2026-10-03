import { existsSync, readdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { preview } from 'vite'

export async function startPreview() {
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  const address = server.httpServer.address()
  if (!address || typeof address === 'string') {
    await server.close()
    throw new Error('preview check: preview did not bind a TCP port')
  }
  return { server, base: `http://127.0.0.1:${address.port}` }
}

export function launchChromium() {
  const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  const bundledChromium = existsSync('/ms-playwright') ? readdirSync('/ms-playwright').filter((name) => name.startsWith('chromium-')).map((name) => `/ms-playwright/${name}/chrome-linux64/chrome`).find(existsSync) : undefined
  const executablePath = systemChromium || bundledChromium
  return chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
}
