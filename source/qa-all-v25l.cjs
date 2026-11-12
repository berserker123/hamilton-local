const { spawnSync } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path');
const out = path.resolve(__dirname, '../out');
const results = [];
for (const suite of ['qa-v25l', 'qa-all-v25k']) {
  const result = spawnSync(process.execPath, [suite + '.cjs'], { cwd: __dirname, windowsHide: true, stdio: 'inherit' });
  results.push({ suite, exitCode: result.status });
}
const passed = results.every(r => r.exitCode === 0);
fs.writeFileSync(path.join(out, 'qa-all-v25l.json'), JSON.stringify({ passed, suites: results, behavioralSuites: 17 }, null, 2));
if (!passed) process.exitCode = 1;
