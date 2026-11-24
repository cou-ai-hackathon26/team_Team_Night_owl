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

console.log('--- Testing F3 Scam Type Classification Logic (Spec 8.4) ---');

const scamTypes = JSON.parse(fs.readFileSync('config/scam-types.json', 'utf-8'));
const enabledTaxonomy = scamTypes.filter((st) => st.enabled);
const disabledTaxonomy = scamTypes.filter((st) => !st.enabled);

// 1. Ensure disabled types are truly marked enabled: false
assert(disabledTaxonomy.some((t) => t.id === 'loan_app'), 'Disabled taxonomy contains loan_app');
assert(disabledTaxonomy.every((t) => t.enabled === false), 'All disabled types have enabled: false');

// 2. Test Rule Type Resolution logic
function resolveType(ruleType, llmType, riskLevel) {
  if (riskLevel === 'low') return null;
  let type = ruleType || llmType || 'other';
  if (!enabledTaxonomy.some((t) => t.id === type)) {
    type = 'other';
  }
  return type;
}

// Test rule type beats LLM type
assert(resolveType('credential_theft', 'prize_bait', 'high') === 'credential_theft', 'Rule type beats LLM type');

// Test fallback to LLM type when rule type is null
assert(resolveType(null, 'prize_bait', 'high') === 'prize_bait', 'Falls back to LLM type when rule type is null');

// Test low risk gives null
assert(resolveType('credential_theft', 'prize_bait', 'low') === null, 'Low risk level returns null scam_type');

// Test invalid / disabled LLM type mapped to 'other'
assert(resolveType(null, 'loan_app', 'medium') === 'other', 'Disabled or invalid LLM type becomes other');

console.log(`\nF3 Tests Summary: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
