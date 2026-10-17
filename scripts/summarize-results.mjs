// Turns Playwright's JSON report into a Markdown summary (per-project totals + known issues).
// Usage: node scripts/summarize-results.mjs reports/results.json [out.md]
import { readFileSync, writeFileSync } from 'node:fs';

const [input = 'reports/results.json', output] = process.argv.slice(2);
const report = JSON.parse(readFileSync(input, 'utf8'));

const byProject = {};
const annotated = [];

function walk(suite, file) {
  for (const child of suite.suites ?? []) walk(child, child.file ?? file);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests) {
      const p = (byProject[t.projectName] ??= {
        passed: 0,
        expectedFail: 0,
        failed: 0,
        flaky: 0,
        skipped: 0,
      });
      const isExpectedFail = t.expectedStatus === 'failed';
      if (t.status === 'skipped') p.skipped++;
      else if (t.status === 'flaky') p.flaky++;
      else if (t.status === 'expected' && isExpectedFail) p.expectedFail++;
      else if (t.status === 'expected') p.passed++;
      else p.failed++;
      for (const a of t.annotations ?? []) {
        if (a.type === 'known-issue' || a.type === 'observation') {
          annotated.push(`| ${t.projectName} | ${spec.title} | ${a.type} | ${a.description} |`);
        }
      }
    }
  }
}
for (const s of report.suites) walk(s, s.file);

const started = report.stats?.startTime ? new Date(report.stats.startTime).toISOString() : 'n/a';
const lines = [
  '# Test execution summary',
  '',
  `Run started: ${started} · Duration: ${Math.round((report.stats?.duration ?? 0) / 1000)}s · Playwright ${report.config?.version ?? ''}`,
  '',
  '| Project | Passed | Known issue (expected fail) | Failed | Flaky | Skipped |',
  '|---|---|---|---|---|---|',
  ...Object.entries(byProject).map(
    ([name, p]) => `| ${name} | ${p.passed} | ${p.expectedFail} | ${p.failed} | ${p.flaky} | ${p.skipped} |`,
  ),
  '',
  '## Known issues and observations raised by the run',
  '',
  '| Project | Test | Type | Detail |',
  '|---|---|---|---|',
  ...[...new Set(annotated)],
  '',
];
const md = lines.join('\n');
if (output) writeFileSync(output, md);
console.log(md);
