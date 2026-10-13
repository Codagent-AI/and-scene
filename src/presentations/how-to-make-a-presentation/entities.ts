// Stable identities belong to this presentation, independent of its active beat.
const id = (name: string) => `how-to-make-a-presentation:${name}`
export const entities = {
  you: id('you'), prompt: id('prompt'), skill: id('skill'), conversation: id('conversation'),
  question: id('question'), tray: id('tray'), depth: id('depth'), kit: id('kit'),
  verify: id('verify'), modify: id('modify'), reveal: id('reveal'), ghost: id('ghost'),
  card: (index: number) => id(`card-${index}`), link: (index: number) => id(`morph-${index}`),
}
