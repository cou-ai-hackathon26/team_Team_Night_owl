import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

/**
 * Screenshot text extraction endpoint (P0.5, Spec 7 & 4.2)
 * Accepts multipart/form-data with image
 * NEVER stores the image to disk (Spec 10.3)
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

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: {
            code: 'FILE_TOO_LARGE',
            message_bn: 'ছবির সাইজ ৫ মেগাবাইটের বেশি হতে পারবে না।',
            message_en: 'Image size exceeds 5MB limit.',
          },
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const visionModel = process.env.VISION_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      return NextResponse.json(
        {
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message_bn: 'ছবি বিশ্লেষণের সেবা বর্তমানে অনুপলব্ধ। অনুগ্রহ করে লেখা কপি করে পেস্ট করুন।',
            message_en: 'Vision AI service is not configured.',
          },
        },
        { status: 503 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: visionModel,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Transcribe verbatim all readable text from this screenshot or message. Do not add explanations or formatting. Only output the exact text extracted.',
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

    const extractedText = response.text?.trim() || '';

    return NextResponse.json({
      text: extractedText,
      language: 'bn-mixed',
      note_bn: 'আমরা এটুকু পড়তে পেরেছি। ভুল থাকলে ঠিক করে আবার যাচাই করুন।',
    });
  } catch (error) {
    console.error('API /v1/extract error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'OCR_FAILED',
          message_bn: 'ছবি থেকে লেখা পড়তে সমস্যা হয়েছে। অনুগ্রহ করে লেখাটি ম্যানুয়ালি টাইপ বা কপি করুন।',
          message_en: 'Failed to extract text from image.',
        },
      },
      { status: 500 }
    );
  }
}
