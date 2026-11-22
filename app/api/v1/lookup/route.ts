import { NextRequest, NextResponse } from 'next/server';
import { getDbPool, initDbTables } from '@/src/db/pool';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get('kind') || 'phone';
  const query = searchParams.get('value') || searchParams.get('q');

  const pool = getDbPool();

  if (pool) {
    await initDbTables();
  }

  // 1. If searching for a specific number/URL
  if (query && query.trim()) {
    let normalizedValue = query.trim();
    if (kind === 'phone') {
      const parsed = parsePhoneNumberFromString(normalizedValue, 'BD');
      if (parsed && parsed.isValid()) {
        normalizedValue = parsed.number;
      }
    }

    if (pool) {
      try {
        // Fetch all matching reports
        const reportsRes = await pool.query(
          `SELECT category, note_masked, total_reports, created_at
           FROM reports
           WHERE (value_normalized = $1 OR value_normalized LIKE $2)
           ORDER BY created_at DESC
           LIMIT 50`,
          [normalizedValue, `%${query.trim()}%`]
        );

        const rows = reportsRes.rows;
        const totalReports = rows.length > 0 ? (rows[0].total_reports || rows.length) : 0;

        if (totalReports > 0) {
          return NextResponse.json({
            found: true,
            value: normalizedValue,
            kind,
            total_reports: totalReports,
            status: 'reported_scam',
            reports: rows.map((r: { category: string; note_masked: string | null; created_at: string }) => ({
              category: r.category,
              short_message: r.note_masked || 'কোনো বিবরণ দেওয়া হয়নি',
              reported_at: r.created_at,
            })),
            disclaimer_bn: `${totalReports} বার রিপোর্ট করা হয়েছে।`,
          });
        }
      } catch (err) {
        console.error('DB query error:', err);
      }
    }

    return NextResponse.json({
      found: false,
      value: normalizedValue,
      kind,
      total_reports: 0,
      reports: [],
      status: 'no_reports_found',
      disclaimer_bn: 'এখনো কোনো রিপোর্ট নেই।',
    });
  }

  // 2. If no query provided, return recent reported numbers aggregated
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT DISTINCT ON (value_normalized) 
                value_normalized, kind, category, note_masked, total_reports, created_at
         FROM reports
         ORDER BY value_normalized, created_at DESC
         LIMIT 25`
      );

      return NextResponse.json({
        recent_reports: res.rows.map((row: {
          value_normalized: string;
          kind: string;
          category: string;
          note_masked: string;
          total_reports: number;
          created_at: string;
        }) => ({
          value: row.value_normalized,
          kind: row.kind,
          category: row.category || 'general',
          short_message: row.note_masked || 'সন্দেহজনক কার্যকলাপের কারণে রিপোর্টকৃত',
          report_count: Number(row.total_reports) || 1,
          reported_at: row.created_at,
        })),
      });
    } catch (err) {
      console.error('DB recent list error:', err);
    }
  }

  return NextResponse.json({
    recent_reports: [],
  });
}
