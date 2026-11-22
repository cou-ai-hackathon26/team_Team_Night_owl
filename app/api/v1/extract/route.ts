import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

/**
 * Screenshot text extraction endpoint (P0.5)
 * Vision OCR using Google Gemini Vision
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        {
          error: {
            code: 'FILE_MISSING',
            message_bn: 'কোনো স্ক্রিনশট বা ছবি পাওয়া যায়নি।',
            message_en: 'No image file uploaded.',
          },
        },
        { status: 400 }
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: {
            code: 'FILE_TOO_LARGE',
            message_bn: 'ছবির সাইজ ৮ মেগাবাইটের বেশি হতে পারবে না।',
            message_en: 'Image size exceeds 8MB limit.',
          },
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: {
            code: 'API_KEY_MISSING',
            message_bn: 'Gemini API Key কনফিগার করা হয়নি।',
            message_en: 'GEMINI_API_KEY is missing in .env.',
          },
        },
        { status: 503 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const ai = new GoogleGenAI({ apiKey });

    // Latest Gemini 3.x vision models
    const visionModels = [
      process.env.VISION_MODEL || 'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
    ];

    const uniqueVisionModels = Array.from(new Set(visionModels.filter(Boolean)));

    let extractedText = '';

    for (const model of uniqueVisionModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'Transcribe verbatim all readable text from this screenshot or message in Bangla or English. Do not add any conversational remarks, explanations or markdown block formatting. Only output the exact text extracted.',
                },
                {
                  inlineData: {
                    data: base64Data,
                    mimeType,
                  },
                },
              ],
            },
          ],
        });

        extractedText = response.text?.trim() || '';
        if (extractedText) {
          console.log(`✅ Vision OCR succeeded using model: ${model}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Vision model ${model} failed:`, err?.message || err);
      }
    }

    if (!extractedText) {
      throw new Error('ছবি থেকে কোনো লেখা পড়তে পারেনি।');
    }

    return NextResponse.json({
      text: extractedText,
      language: 'bn-mixed',
      note_bn: 'আমরা এটুকু পড়তে পেরেছি। ভুল থাকলে ঠিক করে আবার যাচাই করুন।',
    });
  } catch (error: any) {
    console.error('API /v1/extract error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'OCR_FAILED',
          message_bn: error?.message || 'ছবি থেকে লেখা পড়তে সমস্যা হয়েছে। অনুগ্রহ করে লেখাটি ম্যানুয়ালি টাইপ বা কপি করুন।',
          message_en: 'Failed to extract text from image.',
        },
      },
      { status: 500 }
    );
  }
}
