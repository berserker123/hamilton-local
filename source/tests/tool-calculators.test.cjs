const { test } = require('node:test');
const assert = require('node:assert/strict');
const esbuild = require('esbuild');
function load() {
  const result = esbuild.buildSync({ entryPoints: ['src/tool-calculators.ts'], bundle: true, platform: 'node', format: 'cjs', write: false });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}
test('2026–27 M: $25 × 40h hand calculation, PAYE includes ACC exactly once', () => {
  const { calculatePay } = load();
  const p = calculatePay(25, 40, 0.035, false);
  assert.deepEqual(p.weekly, { gross: 1000, incomeTax: 154, acc: 17.5, paye: 171.5, kiwisaver: 35, studentLoan: 0, net: 793.5 });
  assert.equal(p.fortnightly.gross, 2000);
  assert.equal(p.fortnightly.net, 1587);
  assert.equal(p.annual.incomeTax, 8008); // 15,600 × .105 + 36,400 × .175
  assert.equal(p.annual.net, 41262);
});
test('M SL: IRD $600/week worked loan example gives $16.32; $1000 gives $64.32', () => {
  const { calculatePay } = load();
  assert.equal(calculatePay(15, 40, 0, true).weekly.studentLoan, 16.32);
  assert.equal(calculatePay(25, 40, 0.035, true).weekly.net, 729.18);
  assert.equal(calculatePay(464, 1, 0, true).weekly.studentLoan, 0);
  assert.equal(calculatePay(464.01, 1, 0, true).weekly.studentLoan, 0);
  assert.equal(calculatePay(465, 1, 0, true).weekly.studentLoan, 0.12);
});
test('progressive tax brackets have correct cumulative tax and marginal rates', () => {
  const { incomeTax } = load();
  for (const [income, tax, next] of [[0,0,.105],[15600,1638,.175],[53500,8270.5,.30],[78100,15650.5,.33],[180000,49277.5,.39]]) {
    assert.ok(Math.abs(incomeTax(income) - tax) < 1e-7);
    assert.ok(Math.abs(incomeTax(income + 1) - tax - next) < 1e-7);
  }
  assert.equal(incomeTax(200000), 57077.5);
});
test('ACC cap $156,641, minimum wage default, all KiwiSaver options, zero pay', () => {
  const { calculatePay, PAY_RULES, KIWISAVER_RATES } = load();
  assert.equal(PAY_RULES.minimumWage, 23.95);
  assert.equal(PAY_RULES.defaultKiwiSaver, .035);
  assert.equal(calculatePay(23.95, 40, .035, false).weekly.gross, 958);
  for (const salary of [156641, 200000, 1000000]) assert.equal(calculatePay(salary / 52, 1, 0, false).annual.acc, 2741.22);
  for (const rate of KIWISAVER_RATES) assert.equal(calculatePay(25,40,rate,false).weekly.kiwisaver,1000*rate);
  assert.deepEqual(calculatePay(0,40,0,true).weekly, { gross:0,incomeTax:0,acc:0,paye:0,kiwisaver:0,studentLoan:0,net:0 });
});
test('invalid, empty and non-finite calculator inputs are rejected', () => {
  const { calculatePay, calculateGST, convertUnits, parseNumber } = load();
  for (const value of ['', ' ', '-', '1e309']) assert.equal(parseNumber(value), null);
  assert.equal(parseNumber('0'), 0);
  for (const value of [-1, NaN, Infinity]) {
    assert.equal(calculatePay(value,40,.035,false), null);
    assert.equal(calculatePay(25,value,.035,false), null);
    assert.equal(calculateGST(value,'exclusive'), null);
    assert.equal(convertUnits(value,'kg','lb'), null);
  }
  assert.equal(calculatePay(25,40,.05,false),null);
  assert.equal(convertUnits(1,'c','kg'),null);
});
test('IRD GST headphone examples: exclusive $100 and inclusive $115, including cent rounding', () => {
  const { calculateGST } = load();
  for (const [amount,direction] of [[100,'exclusive'],[115,'inclusive']]) assert.deepEqual(calculateGST(amount,direction),{exclusive:100,gst:15,inclusive:115});
  assert.deepEqual(calculateGST(100,'inclusive'),{exclusive:86.96,gst:13.04,inclusive:100});
  assert.deepEqual(calculateGST(0,'inclusive'),{exclusive:0,gst:0,inclusive:0});
  assert.equal(calculateGST(0.01,'exclusive').inclusive,0.01);
});
test('temperature, mainland jin, international pounds and square feet convert both ways', () => {
  const { convertUnits } = load();
  assert.equal(convertUnits(32,'f','c'),0);
  assert.equal(convertUnits(100,'c','f'),212);
  assert.equal(convertUnits(-40,'f','c'),-40);
  assert.equal(convertUnits(2,'jin','kg'),1);
  assert.equal(convertUnits(1,'kg','jin'),2);
  assert.equal(convertUnits(1,'lb','kg'),.45359237);
  assert.equal(convertUnits(1,'ft2','m2'),.09290304);
  for (const [a,b] of [['f','c'],['kg','lb'],['jin','lb'],['m2','ft2']]) assert.ok(Math.abs(convertUnits(convertUnits(123.456,a,b),b,a)-123.456)<1e-8);
});
