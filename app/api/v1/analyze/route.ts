import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runScamAnalysisPipeline } from '@/src/pipeline';

const analyzeSchema = z.object({
  text: z.string().max(4000).optional(),
  url: z.string().max(1000).optional(),
  is_shopkeeper: z.boolean().optional(),
}).refine((data) => Boolean(data.text?.trim() || data.url?.trim()), {
  message: 'Either text or url must be provided',
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = analyzeSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message_bn: 'বার্তা বা লিঙ্ক প্রদান করা আবশ্যক (সর্বোচ্চ ৪,০০০ অক্ষর)।',
            message_en: parsed.error.issues[0]?.message || 'Invalid input data',
          },
        },
        { status: 400 }
      );
    }

    const response = await runScamAnalysisPipeline({
      text: parsed.data.text,
      url: parsed.data.url,
      isShopkeeper: parsed.data.is_shopkeeper,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('API /v1/analyze error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message_bn: 'বিশ্লেষণ করার সময় একটি অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
          message_en: 'Internal server error processing the analysis.',
        },
      },
      { status: 500 }
    );
  }
}
