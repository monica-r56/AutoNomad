const LANGCHAIN_ENDPOINT = process.env.LANGCHAIN_ENDPOINT;
const LANGCHAIN_API_KEY = process.env.LANGCHAIN_API_KEY;
const LANGCHAIN_PROJECT = process.env.LANGCHAIN_PROJECT;

export interface TraceEvent {
  node: string;
  status: "start" | "success" | "error";
  meta?: Record<string, unknown>;
  error?: string;
}

export async function sendTrace(event: TraceEvent) {
  if (!LANGCHAIN_ENDPOINT || !LANGCHAIN_API_KEY) return;

  const payload = {
    project: LANGCHAIN_PROJECT,
    event,
  };

  try {
    const response = await fetch(LANGCHAIN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LANGCHAIN_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok && response.status !== 403 && response.status !== 404) {
      console.warn(`[LangSmith] Trace failed with status ${response.status}`);
    }
  } catch (error) {
    // Silence network errors to avoid cluttering console
  }
}
