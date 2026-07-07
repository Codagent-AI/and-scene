import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..')
const DEMO_VIDEO_PATH = 'docs/assets/and-scene-demo.mp4'

describe('README demo video', () => {
  it('embeds the checked-in demo video asset', async () => {
    const readme = await readFile(join(ROOT, 'README.md'), 'utf-8')
    const videoPath = join(ROOT, DEMO_VIDEO_PATH)

    expect(readme).toContain('## Demo')
    expect(readme).toContain(`<source src="${DEMO_VIDEO_PATH}" type="video/mp4" />`)
    expect(readme).toContain(`[Download the demo video](${DEMO_VIDEO_PATH})`)
    expect(existsSync(videoPath)).toBe(true)
    expect(statSync(videoPath).size).toBeGreaterThan(1024)
  })
})
