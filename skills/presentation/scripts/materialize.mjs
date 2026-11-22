import { cp, mkdir, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
// The public skill handles anchor detection and confirmed partial merges. This
// helper only materializes a complete template into an empty resolved app target.
export const bootstrap = fileURLToPath(new URL('../templates/bootstrap/', import.meta.url))
const target = process.argv[2] && resolve(process.argv[2])
try {
  if (!target) throw new Error('usage: node materialize.mjs <empty-app-target>')
  await mkdir(target, { recursive: true })
  if ((await readdir(target)).length) throw new Error('target is non-empty; use the skill contract-aware merge procedure')
  await cp(bootstrap, target, { recursive: true })
  console.log(`Scaffold materialized: ${target}; run npm ci --include=dev and npx playwright install chromium`)
} catch (error) { console.error(error.message); process.exitCode = 1 }
