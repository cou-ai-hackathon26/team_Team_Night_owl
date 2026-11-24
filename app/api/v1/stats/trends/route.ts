import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/src/db/pool';
import scamTypesConfig from '@/config/scam-types.json';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days') || '7';

    // Spec F6: Validate days is strictly 7 or 30
    if (daysParam !== '7' && daysParam !== '30') {
      return NextResponse.json(
        {
          error: 'Invalid parameter. Allowed values for days are 7 or 30.',
        },
        { status: 400 }
      );
    }

    const days = parseInt(daysParam, 10);
    const minBucket = parseInt(process.env.TRENDS_MIN_BUCKET || '1', 10);

    const pool = getDbPool();
    if (!pool) {
      // Graceful empty state when DB not configured
      return NextResponse.json({
        window_days: days,
        total_analyses: 0,
        risk_breakdown: { high: 0, medium: 0, low: 0 },
        scam_types: [],
        brands: [],
        community_reports: 0,
        caveat: 'এই পরিসংখ্যান কেবল ScamShield BD-তে জমাকৃত ও বিশ্লেষিত বার্তার ওপর ভিত্তি করে প্রস্তুতকৃত। এটি বাংলাদেশের সামগ্রিক সাইবার অপরাধের পূর্ণাঙ্গ বা প্রাতিষ্ঠানিক পরিসংখ্যান নয়।',
      });
    }

    const intervalStr = `${days} days`;

    // 1. Total analyses and risk breakdown
    const statsRes = await pool.query(
      `
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE risk_level = 'high')::int AS high_count,
        COUNT(*) FILTER (WHERE risk_level = 'medium')::int AS medium_count,
        COUNT(*) FILTER (WHERE risk_level = 'low')::int AS low_count
      FROM analysis_events
      WHERE created_at >= NOW() - ($1 || ' days')::interval;
      `,
      [days.toString()]
    );

    const totalAnalyses = statsRes.rows[0]?.total || 0;
    const riskBreakdown = {
      high: statsRes.rows[0]?.high_count || 0,
      medium: statsRes.rows[0]?.medium_count || 0,
      low: statsRes.rows[0]?.low_count || 0,
    };

    // 2. Scam type distribution
    const typesRes = await pool.query(
      `
      SELECT 
        scam_type, 
        COUNT(*)::int AS count
      FROM analysis_events
      WHERE created_at >= NOW() - ($1 || ' days')::interval
        AND scam_type IS NOT NULL
        AND scam_type != 'other'
      GROUP BY scam_type
      HAVING COUNT(*) >= $2
      ORDER BY count DESC
      LIMIT 10;
      `,
      [days.toString(), minBucket]
    );

    const scamTypes = typesRes.rows.map((r) => {
      const typeInfo = scamTypesConfig.find((t: { id: string; label_bn: string }) => t.id === r.scam_type);
      return {
        id: r.scam_type,
        label_bn: typeInfo ? typeInfo.label_bn : r.scam_type,
        count: r.count,
        percentage: totalAnalyses > 0 ? Math.round((r.count / totalAnalyses) * 100) : 0,
      };
    });

    // 3. Brand distribution
    const brandsRes = await pool.query(
      `
      SELECT 
        brand, 
        COUNT(*)::int AS count
      FROM analysis_events
      WHERE created_at >= NOW() - ($1 || ' days')::interval
        AND brand IS NOT NULL
      GROUP BY brand
      HAVING COUNT(*) >= $2
      ORDER BY count DESC
      LIMIT 10;
      `,
      [days.toString(), minBucket]
    );

    const brands = brandsRes.rows.map((r) => ({
      brand: r.brand,
      count: r.count,
      percentage: totalAnalyses > 0 ? Math.round((r.count / totalAnalyses) * 100) : 0,
    }));

    // 4. Community reports count
    const reportsRes = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM reports
      WHERE created_at >= NOW() - ($1 || ' days')::interval;
      `,
      [days.toString()]
    );
    const communityReports = reportsRes.rows[0]?.count || 0;

    return NextResponse.json({
      window_days: days,
      total_analyses: totalAnalyses,
      risk_breakdown: riskBreakdown,
      scam_types: scamTypes,
      brands,
      community_reports: communityReports,
      caveat: 'এই পরিসংখ্যান কেবল ScamShield BD-তে জমাকৃত ও বিশ্লেষিত বার্তার ওপর ভিত্তি করে প্রস্তুতকৃত। এটি বাংলাদেশের সামগ্রিক সাইবার অপরাধের পূর্ণাঙ্গ বা প্রাতিষ্ঠানিক পরিসংখ্যান নয়।',
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      {
        error: 'পরিসংখ্যান লোড করতে ত্রুটি হয়েছে।',
      },
      { status: 500 }
    );
  }
}
