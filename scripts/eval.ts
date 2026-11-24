import fs from 'fs';
import { runScamAnalysisPipeline } from '../src/pipeline';

function wilsonInterval(k: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 0];
  const p = k / n;
  const denominator = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denominator;
  return [Math.max(0, centre - margin), Math.min(1, centre + margin)];
}

interface EvalRow {
  id: string;
  label: string;
  sender_type: string;
  text: string;
}

function parseCSV(content: string): EvalRow[] {
  const lines = content.trim().split('\n');
  const rows: EvalRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(/^([^,]+),([^,]+),([^,]+),"(.*)"$/);
    if (match) {
      rows.push({
        id: match[1],
        label: match[2],
        sender_type: match[3],
        text: match[4],
      });
    } else {
      const parts = line.split(',');
      if (parts.length >= 4) {
        rows.push({
          id: parts[0],
          label: parts[1],
          sender_type: parts[2],
          text: parts.slice(3).join(',').replace(/^"|"$/g, ''),
        });
      }
    }
  }
  return rows;
}

async function runEvaluation() {
  console.log('--- ScamShield BD Pipeline Evaluation (Spec F2) ---');

  if (!fs.existsSync('data/eval/eval_set.csv')) {
    console.error('Missing data/eval/eval_set.csv');
    process.exit(1);
  }

  const evalRows = parseCSV(fs.readFileSync('data/eval/eval_set.csv', 'utf-8'));
  console.log(`Loaded ${evalRows.length} held-out evaluation samples.`);

  // Check overlap with templates (Spec 7.2)
  if (fs.existsSync('data/templates/scam_templates.csv')) {
    const templateContent = fs.readFileSync('data/templates/scam_templates.csv', 'utf-8').toLowerCase();
    for (const r of evalRows) {
      if (templateContent.includes(r.text.toLowerCase().trim())) {
        console.error(`❌ Overlap detected between eval set and templates for ID: ${r.id}`);
        process.exit(1);
      }
    }
  }

  const configs = [
    { name: 'A_rules_only', useLlm: false, useSafeBrowsing: false },
    { name: 'B_rules_and_urls', useLlm: false, useSafeBrowsing: true },
    { name: 'C_full_pipeline', useLlm: true, useSafeBrowsing: true },
  ];

  const resultsByConfig: Record<string, any> = {};

  for (const cfg of configs) {
    console.log(`\nEvaluating configuration: ${cfg.name}...`);
    let TP = 0, FP = 0, TN = 0, FN = 0;
    const errors = [];

    for (let idx = 0; idx < evalRows.length; idx++) {
      const row = evalRows[idx];
      const isActualScam = row.label === 'scam';

      const res = await runScamAnalysisPipeline({
        text: row.text,
        persistEvent: false, // Never write to analysis_events or reports
        useLlm: cfg.useLlm,
        useSafeBrowsing: cfg.useSafeBrowsing,
      });

      const isPredictedScam = res.risk.level === 'high' || res.risk.level === 'medium';

      if (isActualScam && isPredictedScam) TP++;
      else if (!isActualScam && !isPredictedScam) TN++;
      else if (!isActualScam && isPredictedScam) {
        FP++;
        errors.push({
          row: idx + 1,
          id: row.id,
          label: row.label,
          predicted: res.risk.level,
          signals: res.signals.map((s) => s.id),
        });
      } else if (isActualScam && !isPredictedScam) {
        FN++;
        errors.push({
          row: idx + 1,
          id: row.id,
          label: row.label,
          predicted: res.risk.level,
          signals: res.signals.map((s) => s.id),
        });
      }
    }

    const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
    const recall = TP + FN > 0 ? TP / (TP + FN) : 0;
    const fpr = FP + TN > 0 ? FP / (FP + TN) : 0;
    const accuracy = (TP + TN) / evalRows.length;

    resultsByConfig[cfg.name] = {
      TP, FP, TN, FN,
      accuracy,
      precision,
      precision_wilson_95: wilsonInterval(TP, TP + FP),
      recall,
      recall_wilson_95: wilsonInterval(TP, TP + FN),
      fpr,
      fpr_wilson_95: wilsonInterval(FP, FP + TN),
      errors,
    };
  }

  const runDate = new Date().toISOString().split('T')[0];
  const evalData = {
    date: runDate,
    sample_size: evalRows.length,
    model_ids: {
      llm: process.env.LLM_MODEL || 'gemini-3.5-flash-lite',
      vision: process.env.VISION_MODEL || 'gemini-3.5-flash-lite',
    },
    configurations: resultsByConfig,
  };

  // Write JSON
  fs.writeFileSync('docs/eval_results.json', JSON.stringify(evalData, null, 2));

  // Write Markdown Table
  const full = resultsByConfig['C_full_pipeline'];
  const mdContent = `# ScamShield BD: Evaluation & Benchmark Results
**তারিখ (Date):** ${runDate}  
**নমুনার আকার (Sample Size):** ${evalRows.length} টি বাস্তব বার্তা (held-out)  
**মডেল (Models):** ${evalData.model_ids.llm}  

## ১. হেডলাইন মেট্রিক্স (Headline Metrics - Configuration C: Full Pipeline)
- **Accuracy (যথার্থতা):** ${(full.accuracy * 100).toFixed(1)}%
- **Precision:** ${(full.precision * 100).toFixed(1)}% (95% CI: ${(full.precision_wilson_95[0] * 100).toFixed(1)}% - ${(full.precision_wilson_95[1] * 100).toFixed(1)}%)
- **Recall (শনাক্তকরণ হার):** ${(full.recall * 100).toFixed(1)}% (95% CI: ${(full.recall_wilson_95[0] * 100).toFixed(1)}% - ${(full.recall_wilson_95[1] * 100).toFixed(1)}%)
- **False-Positive Rate:** ${(full.fpr * 100).toFixed(1)}% (95% CI: ${(full.fpr_wilson_95[0] * 100).toFixed(1)}% - ${(full.fpr_wilson_95[1] * 100).toFixed(1)}%)

## ২. কনফিগারেশন অ্যাবলেশন (Ablation Study)
| কনফিগারেশন | Accuracy | Precision | Recall | False Positive Rate |
|---|---|---|---|---|
| A (Rules only) | ${(resultsByConfig['A_rules_only'].accuracy * 100).toFixed(1)}% | ${(resultsByConfig['A_rules_only'].precision * 100).toFixed(1)}% | ${(resultsByConfig['A_rules_only'].recall * 100).toFixed(1)}% | ${(resultsByConfig['A_rules_only'].fpr * 100).toFixed(1)}% |
| B (Rules + URLs) | ${(resultsByConfig['B_rules_and_urls'].accuracy * 100).toFixed(1)}% | ${(resultsByConfig['B_rules_and_urls'].precision * 100).toFixed(1)}% | ${(resultsByConfig['B_rules_and_urls'].recall * 100).toFixed(1)}% | ${(resultsByConfig['B_rules_and_urls'].fpr * 100).toFixed(1)}% |
| C (Full Pipeline) | ${(full.accuracy * 100).toFixed(1)}% | ${(full.precision * 100).toFixed(1)}% | ${(full.recall * 100).toFixed(1)}% | ${(full.fpr * 100).toFixed(1)}% |

## ৩. সীমাবদ্ধতা ও সততা ডিসক্লেমার (Honest Disclaimers)
- এই মূল্যায়নটি সংগৃহীত ${evalRows.length}টি বাস্তব বার্তার ওপর পরিচালিত হয়েছে।
- কোনো সিন্থেটিক বা কাল্পনিক ডেটা যুক্ত করা হয়নি। নমুনার সংখ্যা সীমিত হওয়ায় ৯৫% উইলসন ইন্টারভাল উল্লেখ করা হয়েছে।
`;

  fs.writeFileSync('docs/EVAL_RESULTS.md', mdContent);
  console.log('\n✅ Evaluation completed. Generated docs/EVAL_RESULTS.md and docs/eval_results.json');
}

runEvaluation().catch((err) => {
  console.error('Eval failed:', err);
  process.exit(1);
});
