import { expect, it } from 'vitest';
import { STEPS } from '../../../src/presentations/how-to-make-a-presentation/steps';
import expectations from '../../../scripts/verify.expectations.json';
it('matches the normative nine-step reference in order with unique identities', () => {
  expect(STEPS.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(expectations.referenceSample.steps);
  expect(new Set(STEPS.map(step => step.id)).size).toBe(9);
  expect(new Set(STEPS.map(step => step.groupKey)).size).toBe(1);
  expect(new Set(STEPS.map(step => step.Scene)).size).toBe(1);
});
