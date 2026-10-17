import type { TestInfo } from '@playwright/test';

/**
 * Marks a test as covering a known, already-reported defect.
 *
 * The test keeps asserting the *correct* behaviour and is expected to fail. When the defect is
 * fixed Playwright reports an "unexpected pass", which tells us to remove the marker, so known
 * bugs never hide silently and never turn the pipeline red.
 */
export function knownIssue(testInfo: TestInfo, id: string, summary: string): void {
  testInfo.annotations.push({
    type: 'known-issue',
    description: `${id}: ${summary} (see docs/test-cases.md)`,
  });
  testInfo.fail();
}

/** Records an observation that needs a product decision; the test does not fail on it. */
export function observation(testInfo: TestInfo, id: string, detail: string): void {
  testInfo.annotations.push({ type: 'observation', description: `${id}: ${detail}` });
}
