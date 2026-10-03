export function parseActiveStepIndex(raw, currentStep) {
  if (raw === null || !/^\d+$/.test(raw)) {
    throw new Error(`step ${currentStep}: missing or invalid data-step-index`)
  }
  return Number(raw)
}
