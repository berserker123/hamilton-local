// Current suites plus maintained wrappers for v18, v22 and feedback behavior.
// v17/v20/v21 and qa-regression-feedback are archived versions of these checks;
// their old page/theme/hash expectations are superseded by the maintained suites.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve(__dirname, '../out/qa-v25f-logs');
const suites = ['qa-v25f','qa-v25e','qa-v25d','qa-v25','qa-home-v23','qa-cord-status','qa-v23b','qa-v24b','qa-v24c','qa-existing-v23'];
fs.mkdirSync(out, { recursive: true });
function run(name) {
  return new Promise(resolve => {
    const log = fs.openSync(path.join(out, name + '.log'), 'w');
    const child = spawn(process.execPath, [name + '.cjs'], { cwd: __dirname, windowsHide: true, stdio: ['ignore', log, log] });
    child.on('error', error => { console.error(error); });
    child.on('close', code => { fs.closeSync(log); console.log((code === 0 ? 'PASS ' : 'FAIL ') + name); resolve({ suite: name, exitCode: code }); });
  });
}
(async () => {
  // Keep suites sequential: each suite owns its browser and evidence files.
  const results = [];
  for (const suite of suites) results.push(await run(suite));
  const passed = results.every(result => result.exitCode === 0);
  fs.writeFileSync(path.resolve(out, '../qa-all-v25f.json'), JSON.stringify({ passed, suites: results, behavioralSuites: 12, logs: out }, null, 2));
  if (!passed) process.exitCode = 1;
})();
