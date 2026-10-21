import { defineStep } from './define'

export const step07 = defineStep(7, {
  id: 'verify',
  era: 'the build',
  title: "It checks its own work",
  caption: "Before saying done, it builds and renders every step — and fixes what breaks.",
})
