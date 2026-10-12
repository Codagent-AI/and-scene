const namespace = "how-to-make-a-presentation";
export const entity = {
  you: `${namespace}:you`, prompt: `${namespace}:prompt`, skill: `${namespace}:skill`,
  conversation: `${namespace}:conversation`, question: `${namespace}:question`,
  tray: `${namespace}:tray`, card: (index: number) => `${namespace}:step-card-${index}`,
  kit: `${namespace}:scene-kit`, verify: `${namespace}:verify`,
  modify: `${namespace}:modify`, frame: `${namespace}:reveal-frame`,
} as const;
