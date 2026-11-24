import fs from 'fs';
import path from 'path';

/**
 * Claims Audit Script (Spec 5.3)
 * Scans web app source, README, and docs for forbidden overclaiming phrases.
 */

const FORBIDDEN_PHRASES = [
  'zero hallucination',
  '100%',
  'guaranteed',
  'banking grade',
  'bank-grade',
  'never stores',
  'nothing is stored',
  'জিরো হ্যালুসিনেশন',
  'ব্যাংকিং গ্রেড',
  'কিছুই স্টোর করি না',
  'প্রায় শতভাগ নিখুঁত',
];

const SCAN_DIRS = ['app', 'src', 'docs'];
const SCAN_FILES = ['README.md'];
const IGNORED_FILES = ['claims-check.ts', 'claims-check.mjs', 'SCAMSHIELD_BD_ADDENDUM_SPEC.pdf'];

let errorsCount = 0;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // If line has the inline escape marker claims-ok: reason, skip
    if (line.includes('claims-ok:')) {
      return;
    }

    const lowerLine = line.toLowerCase();

    for (const phrase of FORBIDDEN_PHRASES) {
      if (lowerLine.includes(phrase.toLowerCase())) {
        console.error(
          `❌ Overclaiming phrase detected: "${phrase}"\n   File: ${filePath}:${index + 1}\n   Line: "${line.trim()}"`
        );
        errorsCount++;
      }
    }
  });
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (IGNORED_FILES.includes(entry.name)) continue;

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDir(fullPath);
      }
    } else if (entry.isFile()) {
      if (
        entry.name.endsWith('.ts') ||
        entry.name.endsWith('.tsx') ||
        entry.name.endsWith('.js') ||
        entry.name.endsWith('.mjs') ||
        entry.name.endsWith('.md') ||
        entry.name.endsWith('.json')
      ) {
        scanFile(fullPath);
      }
    }
  }
}

console.log('--- Running Claims Audit Check (Spec 5.3) ---');
SCAN_DIRS.forEach((d) => scanDir(d));
SCAN_FILES.forEach((f) => {
  if (fs.existsSync(f)) scanFile(f);
});

if (errorsCount > 0) {
  console.error(`\nAudit FAILED: Found ${errorsCount} overclaiming phrase(s). Please fix or add 'claims-ok: reason'.`);
  process.exit(1);
} else {
  console.log('✅ Audit PASSED: No unauthorized overclaiming claims found.');
  process.exit(0);
}
