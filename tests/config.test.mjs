import fs from 'fs';

let passed = 0;
let failed = 0;

function assert(condition, desc) {
  if (condition) {
    console.log(`✅ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${desc}`);
    failed++;
  }
}

console.log('--- Testing Config Provenance (Spec 4.1 & 6.3b) ---');

// 1. Helplines test
const helplines = JSON.parse(fs.readFileSync('config/helplines.json', 'utf-8'));
assert(Array.isArray(helplines) && helplines.length > 0, 'Helplines config is an array');

helplines.forEach((h) => {
  assert(Boolean(h.id && h.name_bn && h.number), `Helpline ${h.id} has id, name_bn, number`);
  assert(Boolean(h.source_url && h.verified_on), `Helpline ${h.id} has valid source_url and verified_on provenance`);
});

// 2. Emergency playbooks test
const playbooks = JSON.parse(fs.readFileSync('config/emergency-playbooks.json', 'utf-8'));
assert(Array.isArray(playbooks.situations) && playbooks.situations.length >= 3, 'Playbooks contains at least 3 situations');

playbooks.situations.forEach((sit) => {
  sit.steps.forEach((step) => {
    if (step.enabled) {
      assert(['official_url', 'owner_approved'].includes(step.basis), `Step ${step.id} has valid basis`);
      if (step.basis === 'official_url') {
        assert(Boolean(step.source_url), `Official step ${step.id} has source_url`);
      }
      assert(Boolean(step.verified_on), `Step ${step.id} has verified_on date`);
    }
  });
});

// 3. Scam types test
const scamTypes = JSON.parse(fs.readFileSync('config/scam-types.json', 'utf-8'));
assert(Array.isArray(scamTypes), 'Scam types is an array');

scamTypes.forEach((st) => {
  if (st.enabled) {
    assert(Array.isArray(st.evidence_basis) && st.evidence_basis.length > 0, `Enabled scam type ${st.id} has evidence_basis`);
    assert(Array.isArray(st.advice_bn) && st.advice_bn.length > 0, `Enabled scam type ${st.id} has advice_bn`);
    st.advice_bn.forEach((adv) => {
      assert(Boolean(adv.text_bn && adv.basis && adv.source_url), `Advice item under ${st.id} has text, basis, and source_url`);
    });
  }
});

console.log(`\nConfig Tests Summary: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
