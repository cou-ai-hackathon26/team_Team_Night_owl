import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getDbPool, initDbTables } from '@/src/db/pool';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { maskSensitiveData } from '@/src/pipeline/mask';

const reportSchema = z.object({
  kind: z.enum(['phone', 'url']),
  value: z.string().min(3).max(1000),
  category: z.string().optional(),
  note: z.string().max(500).optional(),
  consent: z.literal(true, {
    message: 'সম্মতি আবশ্যক (Consent is mandatory)',
  }),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = reportSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'CONSENT_REQUIRED',
            message_bn: 'রিপোর্ট জমা দেওয়ার জন্য শর্তাবলীতে সম্মতি দেওয়া আবশ্যক।',
            message_en: parsed.error.issues[0]?.message || 'Valid input and explicit consent required',
          },
        },
        { status: 400 }
      );
    }

    const { kind, value, category, note } = parsed.data;

    // Normalize phone number to standard format if kind is phone
    let normalizedValue = value.trim();
    if (kind === 'phone') {
      const parsedPhone = parsePhoneNumberFromString(normalizedValue, 'BD');
      if (parsedPhone && parsedPhone.isValid()) {
        normalizedValue = parsedPhone.number; // e.g. +8801XXXXXXXXX
      }
    }

    // Mask sensitive digits in note (Privacy by default)
    let maskedNote = '';
    if (note) {
      const { maskedText } = maskSensitiveData(note);
      maskedNote = maskedText;
    }

    // Generate anonymous reporter hash
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const secret = process.env.REPORTER_HASH_SECRET || 'scamshield-default-secret-salt-key';

    const reporterHash = crypto
      .createHmac('sha256', secret)
      .update(`${clientIp}-${userAgent}`)
      .digest('hex');

    let currentTotalReports = 1;

    // Save to Database and synchronize total_reports
    const pool = getDbPool();
    if (pool) {
      await initDbTables();

      try {
        // 1. Insert new report row
        await pool.query(
          `INSERT INTO reports (kind, value_normalized, category, note_masked, reporter_hash, status)
           VALUES ($1, $2, $3, $4, $5, 'accepted')`,
          [kind, normalizedValue, category || 'general', maskedNote, reporterHash]
        );

        // 2. Count exact total reports for this number
        const countRes = await pool.query(
          `SELECT COUNT(*)::int as total FROM reports WHERE value_normalized = $1`,
          [normalizedValue]
        );

        currentTotalReports = countRes.rows[0]?.total || 1;

        // 3. Update total_reports column in the database for all rows of this number
        await pool.query(
          `UPDATE reports SET total_reports = $1 WHERE value_normalized = $2`,
          [currentTotalReports, normalizedValue]
        );
      } catch (dbErr) {
        console.error('Database report insert/count error:', dbErr);
      }
    }

    return NextResponse.json({
      status: 'success',
      message_bn: 'আপনার রিপোর্টটি সফলভাবে গ্রহণ করা হয়েছে এবং ডাটাবেজে যুক্ত হয়েছে। ধন্যবাদ!',
      report: {
        kind,
        value: normalizedValue,
        category: category || 'general',
        note_masked: maskedNote,
        total_reports: currentTotalReports,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('API /v1/reports error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message_bn: 'রিপোর্ট প্রক্রিয়া করার সময় সমস্যা হয়েছে।',
          message_en: 'Internal server error processing report.',
        },
      },
      { status: 500 }
    );
  }
}
