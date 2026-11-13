// One namespace; continuing entities keep their IDs for the entire presentation.
export const entity = (name: string) => `sample:${name}`
export const positions = {
 you: [64, 40, 104, 66], prompt: [64, 12, 104, 23], skill: [630, 40, 150, 66], question: [328, 15, 170, 25],
 tray: [64, 153, 734, 118], 'card-1': [80, 171, 140, 84], 'card-2': [280, 171, 140, 84], 'card-3': [480, 171, 140, 84],
 ghost: [640, 173, 140, 25], depth: [64, 116, 145, 24], kit: [292, 270, 240, 42], verify: [655, 202, 117, 46],
 edited: [480, 150, 140, 22], reveal: [32, 0, 796, 365], 'morph-1': [222, 207, 56, 23], 'morph-2': [422, 207, 56, 23],
} as const
