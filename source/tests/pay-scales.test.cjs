const { test } = require('node:test');
const assert = require('node:assert/strict');
const esbuild = require('esbuild');

function load() {
  const result = esbuild.buildSync({ entryPoints: ['src/pay-scales.ts'], bundle: true, platform: 'node', format: 'cjs', write: false });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

const TODAY = '2026-11-14';
const ALLOWED = ['nzno-registered-nurse','nzno-enrolled-nurse','nzno-hca','nzno-mha','meras-midwife','kindergarten-teacher','primary-teacher','secondary-teacher','school-teacher-aide','school-admin-support','school-librarian','school-science-technician','school-other-support','aphst-allied-health'];

test('offered occupations are exactly the 14 selected agreements', () => {
  const { offeredOccupations, PAY_SCALES } = load();
  assert.deepEqual(PAY_SCALES.occupations.map(item => item.id), ALLOWED);
  assert.deepEqual(offeredOccupations(TODAY).map(item => item.id), ALLOWED);
});

test('school therapists and designated allied steps are kept in the file but not offered', () => {
  const { offeredOccupations, PAY_SCALES } = load();
  const primary = offeredOccupations(TODAY).find(item => item.id === 'primary-teacher');
  assert.deepEqual(primary.scales.map(item => item.id), ['ptca-trained', 'ptca-untrained']);
  assert.ok(PAY_SCALES.occupations.find(item => item.id === 'primary-teacher').scales.some(item => item.id === 'ptca-slt'));
  const allied = offeredOccupations(TODAY).find(item => item.id === 'aphst-allied-health');
  assert.deepEqual(allied.scales.map(item => item.id), ['aphst-core']);
  assert.ok(PAY_SCALES.occupations.find(item => item.id === 'aphst-allied-health').scales.some(item => item.id === 'aphst-designated'));
});

test('registered nurse step 1 uses the 2 March 2026 salary and notes the 2027 column', () => {
  const { quoteScale, annualToHourly } = load();
  const quote = quoteScale('nzno-registered-nurse', 'rn', '1', TODAY);
  assert.equal(quote.amount, 77667);
  assert.equal(quote.effectiveFrom, '2026-03-02');
  assert.equal(quote.basis, 'annual');
  assert.equal(quote.hours, 40);
  assert.equal(quote.hourly, annualToHourly(77667));
  assert.equal(quote.pending.date, '2027-03-02');
  assert.equal(quote.pending.amount, 79221);
  assert.equal(quoteScale('nzno-registered-nurse', 'rn', '1', '2027-03-02').amount, 79221);
  assert.equal(quoteScale('nzno-registered-nurse', 'rn', '1', '2027-03-02').pending, null);
});

test('MERAS midwives use the 1 June 2026 column and carry the union note flag', () => {
  const { quoteScale, MERAS_NOTE, selectableSteps, offeredOccupations } = load();
  const quote = quoteScale('meras-midwife', 'core-mw', '7', TODAY);
  assert.equal(quote.amount, 111821);
  assert.equal(quote.effectiveFrom, '2026-06-01');
  assert.equal(quote.pending, null);
  assert.equal(quote.meras, true);
  assert.match(MERAS_NOTE.zh, /MERAS/);
  assert.match(MERAS_NOTE.en, /MERAS union member/);
  const core = offeredOccupations(TODAY).find(item => item.id === 'meras-midwife').scales.find(item => item.id === 'core-mw');
  assert.equal(core.steps.some(step => step.step === '1'), false);
  assert.deepEqual(core.steps.map(step => step.step), ['2', '3', '4', '5', '6', '7']);
  assert.equal(selectableSteps(core, TODAY).some(step => step.step === '1'), false);
});

test('teacher and support scales follow their printed current and pending dates', () => {
  const { quoteScale } = load();
  assert.equal(quoteScale('kindergarten-teacher', 'k1', '1', TODAY).amount, 62862);
  assert.equal(quoteScale('kindergarten-teacher', 'k1', '1', TODAY).pending.date, '2027-01-28');
  assert.equal(quoteScale('kindergarten-teacher', 'k2', 'K2', TODAY).effectiveFrom, '2026-06-29');
  assert.equal(quoteScale('kindergarten-teacher', 'k2', 'K2', TODAY).amount, 113356);
  assert.equal(quoteScale('primary-teacher', 'ptca-trained', '10', TODAY).amount, 105686);
  assert.equal(quoteScale('primary-teacher', 'ptca-untrained', 'Minimum', TODAY).amount, 53780);
  assert.equal(quoteScale('secondary-teacher', 'stca-trained', '1', TODAY).effectiveFrom, '2026-01-28');
  assert.equal(quoteScale('secondary-teacher', 'stca-trained', '1', TODAY).amount, 62862);
  assert.equal(quoteScale('secondary-teacher', 'stca-untrained', 'U1', TODAY).amount, 54484);
  const aide = quoteScale('school-teacher-aide', 'teacher-aide', 'A-1', TODAY);
  assert.equal(aide.basis, 'hourly');
  assert.equal(aide.amount, 25.81);
  assert.equal(aide.hours, null);
  assert.equal(aide.effectiveFrom, '2026-03-24');
  assert.equal(aide.pending.date, '2027-03-23');
  assert.equal(aide.pending.amount, 26.33);
});

test('allied core scale switches to the 7 December 2026 column on that date', () => {
  const { quoteScale } = load();
  const before = quoteScale('aphst-allied-health', 'aphst-core', '1', '2026-12-06');
  const onDay = quoteScale('aphst-allied-health', 'aphst-core', '1', '2026-12-07');
  assert.equal(before.amount, 79014);
  assert.equal(before.effectiveFrom, '2025-12-01');
  assert.equal(before.pending.date, '2026-12-07');
  assert.equal(before.pending.amount, 80594);
  assert.equal(onDay.amount, 80594);
  assert.equal(onDay.effectiveFrom, '2026-12-07');
  assert.equal(onDay.pending, null);
});

test('annual conversion label states the printed salary and a 40-hour week', () => {
  const { conversionLabel, hourlyInput, annualToHourly } = load();
  const label = conversionLabel(77667);
  assert.equal(label.zh, '年薪 $77,667，按每周40小时折算');
  assert.equal(label.en, 'Annual salary $77,667, converted at 40 hours a week.');
  assert.equal(hourlyInput(annualToHourly(77667)), '37.3399');
});

test('unknown selections do not invent a rate', () => {
  const { quoteScale } = load();
  assert.equal(quoteScale('custom', 'rn', '1', TODAY), null);
  assert.equal(quoteScale('nzno-registered-nurse', 'rn', '99', TODAY), null);
  assert.equal(quoteScale('primary-teacher', 'ptca-slt', '1', TODAY), null);
});
