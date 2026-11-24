import { GoogleGenAI } from '@google/genai';

/**
 * Verify Models Script (Spec 5.3.3)
 * Calls provider's model list endpoint and checks that LLM_MODEL, VISION_MODEL exist.
 */

async function verifyModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ Warning: GEMINI_API_KEY is not set. Cannot verify models.');
    process.exit(0);
  }

  const llmModel = process.env.LLM_MODEL || 'gemini-3.5-flash-lite';
  const visionModel = process.env.VISION_MODEL || 'gemini-3.5-flash-lite';

  console.log('--- Verifying Configured Gemini Models ---');
  console.log(`Checking models: LLM="${llmModel}", VISION="${visionModel}"`);

  const ai = new GoogleGenAI({ apiKey });

  // Test content generation with configured models
  let hasFailure = false;

  for (const [role, modelName] of [
    ['LLM', llmModel],
    ['VISION', visionModel],
  ]) {
    try {
      const res = await ai.models.generateContent({
        model: modelName,
        contents: 'ping',
      });
      if (res && res.text) {
        console.log(`✅ ${role} Model verified: "${modelName}" is reachable and active.`);
      }
    } catch (err: any) {
      console.error(`❌ ${role} Model error for "${modelName}":`, err?.message || err);
      hasFailure = true;
    }
  }

  if (hasFailure) {
    console.error('Model verification failed for one or more configured models.');
    process.exit(1);
  } else {
    console.log('✅ All configured models are verified with active API key.');
    process.exit(0);
  }
}

verifyModels();
