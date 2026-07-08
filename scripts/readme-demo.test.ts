import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..')
const DEMOS = [
  {
    label: 'How to make a presentation demo',
    previewPath: 'docs/assets/and-scene-demo.gif',
    videoPath: 'docs/assets/and-scene-demo.mp4',
    downloadText: 'Download the demo video',
  },
  {
    label: 'Evolution of the bicycle demo',
    previewPath: 'docs/assets/evolution-of-the-bicycle-demo.gif',
    videoPath: 'docs/assets/evolution-of-the-bicycle-demo.mp4',
    downloadText: 'Download the bicycle demo video',
  },
] as const

describe('README demo video', () => {
  it('embeds GitHub-renderable previews that link to checked-in demo videos', async () => {
    const readme = await readFile(join(ROOT, 'README.md'), 'utf-8')

    expect(readme).toContain('## Demo')

    for (const demo of DEMOS) {
      const previewPath = join(ROOT, demo.previewPath)
      const videoPath = join(ROOT, demo.videoPath)

      expect(readme).toContain(`[![${demo.label}](${demo.previewPath})](${demo.videoPath})`)
      expect(readme).toContain(`[${demo.downloadText}](${demo.videoPath})`)
      expect(existsSync(previewPath)).toBe(true)
      expect(existsSync(videoPath)).toBe(true)
      expect(statSync(previewPath).size).toBeGreaterThan(1024)
      expect(statSync(videoPath).size).toBeGreaterThan(1024)
    }
  })
})
