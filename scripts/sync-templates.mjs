import { cp, mkdir, rm } from 'node:fs/promises'

// Resolve relative to this script so the command also works from another cwd.
const root = new URL('../', import.meta.url)
const snapshot = new URL('skills/presentation/templates/bootstrap/', root)
const kit = new URL('src/presentation-kit/', snapshot)
await rm(kit, { recursive: true, force: true })
await cp(new URL('src/presentation-kit/', root), kit, { recursive: true })
await mkdir(new URL('scripts/', snapshot), { recursive: true })
for (const name of ['verify.mjs', 'inspect-presentation.mjs']) {
  await cp(new URL(`scripts/${name}`, root), new URL(`scripts/${name}`, snapshot))
}
console.log('Synced canonical scene kit and browser drivers to bootstrap templates')
