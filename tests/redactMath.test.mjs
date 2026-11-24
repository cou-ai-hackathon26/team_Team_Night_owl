import { screenToImageCoords, normalizeRect } from '../src/lib/redactMath.js';

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

console.log('--- Testing Redaction Pure Coordinate Math (Spec 5.2.5) ---');

// Test 1: Exact 1:1 scaling
const c1 = screenToImageCoords(50, 50, 200, 200, 200, 200);
assert(c1.x === 50 && c1.y === 50, '1:1 scale mapping works');

// Test 2: 2x natural scale
const c2 = screenToImageCoords(100, 150, 400, 300, 800, 600);
assert(c2.x === 200 && c2.y === 300, '2x scale mapping works');

// Test 3: Clamping out-of-bounds coords
const c3 = screenToImageCoords(500, -50, 400, 300, 800, 600);
assert(c3.x === 800 && c3.y === 0, 'Out-of-bounds coordinates clamped to image borders');

// Test 4: Rect normalization (drag from bottom-right to top-left)
const rect = normalizeRect(150, 200, 50, 80);
assert(rect.x === 50 && rect.y === 80 && rect.width === 100 && rect.height === 120, 'Rect normalized from reverse drag');

console.log(`\nTests Summary: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
