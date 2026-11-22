import { cp, mkdir } from 'node:fs/promises'
const target = new URL('../skills/presentation/templates/bootstrap/', import.meta.url)
await mkdir(target, { recursive: true })
for (const path of ['src/presentation-kit', 'scripts/browser.mjs', 'scripts/verify.mjs', 'scripts/reference.mjs', 'scripts/diagnostics.mjs', 'scripts/inspect-presentation.mjs']) {
  await cp(new URL(`../${path}`, import.meta.url), new URL(path, target), { recursive: true })
}
