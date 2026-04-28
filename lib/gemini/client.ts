const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

export async function callGemini(prompt: string): Promise<string | undefined> {
  if (!GEMINI_API_KEY) return undefined;

  try {
    const endpoints = ["v1", "v1beta"] as const;
    const modelsToTry = [GEMINI_MODEL, GEMINI_MODEL.endsWith("-latest") ? GEMINI_MODEL : `${GEMINI_MODEL}-latest`];

    for (const apiVersion of endpoints) {
      for (const model of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
          }),
        });

        if (!response.ok) {
          // If the model isn't available on this endpoint, try the next combination.
          if (response.status === 404) continue;
          const err = await response.json().catch(() => undefined);
          console.error("[Gemini] API error:", err ?? { status: response.status });
          return undefined;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text;
      }
    }

    return undefined;
  } catch (error) {
    console.warn("[Gemini] call failed", error);
    return undefined;
  }
}
