import path from 'node:path'
import { pathToFileURL } from 'node:url'

/** Starts the app's own preview helper (the same one verification uses) from a throwaway copy. */
export async function startPreviewFor(appDir: string): Promise<{ url: string; stop: () => void }> {
  const module = await import(pathToFileURL(path.join(appDir, 'scripts', 'lib', 'preview.mjs')).href)
  return module.startPreview(appDir)
}
