// Run independent browser suites with separate logs and capture actual exit codes.
const fs = require('node:fs'), path = require('node:path'), { spawn } = require('node:child_process');
const suites = ['qa-existing-v23','qa-home-v23','qa-cord-status','qa-v23b','qa-v24b','qa-v24c','qa-v25'];
const out = path.resolve(__dirname, '../out');
const report = { url: 'http://127.0.0.1:4186', started: new Date().toISOString(), suites: [] };
async function run(name) {
 const log = fs.openSync(path.join(out, 'run-' + name + '.log'), 'w');
 const processHandle = spawn(process.execPath, [name + '.cjs'], { cwd: __dirname, env: { ...process.env, PREVIEW_URL: report.url }, stdio: ['ignore', log, log] });
 const code = await new Promise((resolve, reject) => { processHandle.on('exit', resolve); processHandle.on('error', reject); });
 fs.closeSync(log); report.suites.push({ name, exitCode: code }); console.log(name, code === 0 ? 'PASS' : 'FAIL');
 fs.writeFileSync(path.join(out, 'final-verification-v25.json'), JSON.stringify(report, null, 2));
}
(async () => {
 // Three browser processes at a time. Each suite owns its output filenames.
 for(let i=0;i<suites.length;i+=3) await Promise.all(suites.slice(i,i+3).map(run));
 report.finished = new Date().toISOString(); report.passed = report.suites.every(r => r.exitCode === 0);
 fs.writeFileSync(path.join(out, 'final-verification-v25.json'), JSON.stringify(report, null, 2));
 if(!report.passed) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
