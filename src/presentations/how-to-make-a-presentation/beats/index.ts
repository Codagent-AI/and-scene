import { Beat1 } from './01-you-have-a-topic'
import { Beat2 } from './02-the-skill-interviews-you'
import { Beat3 } from './03-answers-become-steps'
import { Beat4 } from './04-the-deck-grows'
import { Beat5 } from './05-you-set-the-depth'
import { Beat6 } from './06-it-assembles-the-scene'
import { Beat7 } from './07-it-checks-its-own-work'
import { Beat8 } from './08-changed-your-mind'
import { Beat9 } from './09-youre-looking-at-one'
import type { ComponentType } from 'react'
import type { BeatProps } from './types'

export const beats: ComponentType<BeatProps>[] = [Beat1, Beat2, Beat3, Beat4, Beat5, Beat6, Beat7, Beat8, Beat9]
