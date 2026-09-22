/**
 * Gemini adapter — the initial LLM / image / video integration.
 *
 * Calls go through the Lovable AI Gateway server-side; the credential is read
 * inside each call so it is never captured at module scope or shipped anywhere
 * near the client.
 */
import { optionalEnv, requireEnv } from "@/lib/config/env.server";
import type {
  ImageProvider,
  LlmProvider,
  ProviderResult,
  VideoProvider,
} from "@/lib/providers/types";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export const GEMINI_MODELS = {
  llm: "google/gemini-3.8-flash",
  image: "google/gemini-3.1-flash-image",
  video: "google/gemini-omni-1.1-flash",
} as const;

function credential(): string {
  return requireEnv("LOVABLE_API_KEY");
}

function configured(): boolean {
  return optionalEnv("LOVABLE_API_KEY") !== undefined;
}

async function gatewayFetch(path: string, body: unknown): Promise<Response> {
  return fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": credential(),
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify(body),
  });
}

async function readSseText(response: Response): Promise<string> {
  const body = response.body;
  if (!body) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        text += event.choices?.[0]?.delta?.content ?? "";
      } catch {
        /* partial frame — ignored */
      }
    }
  }
  return text;
}

async function failFast(response: Response, label: string): Promise<never> {
  const detail = await response.text().catch(() => "");
  throw new Error(`${label} failed (${response.status}): ${detail.slice(0, 500)}`);
}

export const geminiLlmProvider: LlmProvider = {
  kind: "LLM",
  name: "gemini",
  isConfigured: configured,
  async complete({ messages, model }) {
    const startedAt = Date.now();
    const chosen = model ?? GEMINI_MODELS.llm;
    const response = await gatewayFetch("/chat/completions", {
      model: chosen,
      messages,
      stream: true,
    });
    if (!response.ok) await failFast(response, "Gemini text generation");
    const text = await readSseText(response);
    return {
      data: { text },
      usage: {
        units: Math.ceil(text.length / 4),
        unitType: "tokens",
        model: chosen,
        latencyMs: Date.now() - startedAt,
      },
      providerName: "gemini",
    } satisfies ProviderResult<{ text: string }>;
  },
};

export const geminiImageProvider: ImageProvider = {
  kind: "IMAGE",
  name: "gemini",
  isConfigured: configured,
  async generate({ prompt, model }) {
    const startedAt = Date.now();
    const chosen = model ?? GEMINI_MODELS.image;
    const response = await gatewayFetch("/images/generations", { model: chosen, prompt, n: 1 });
    if (!response.ok) await failFast(response, "Gemini image generation");
    const payload = (await response.json()) as { data?: { b64_json?: string; url?: string }[] };
    return {
      data: {
        images: (payload.data ?? []).map((item) => ({
          ...(item.b64_json !== undefined && { base64: item.b64_json }),
          ...(item.url !== undefined && { url: item.url }),
        })),
      },
      usage: {
        units: payload.data?.length ?? 0,
        unitType: "images",
        model: chosen,
        latencyMs: Date.now() - startedAt,
      },
      providerName: "gemini",
    };
  },
};

export const geminiVideoProvider: VideoProvider = {
  kind: "VIDEO",
  name: "gemini",
  isConfigured: configured,
  async createJob({ prompt, model, durationSeconds }) {
    const startedAt = Date.now();
    const chosen = model ?? GEMINI_MODELS.video;
    const response = await gatewayFetch("/videos", {
      model: chosen,
      input: { prompt, ...(durationSeconds ? { duration_seconds: durationSeconds } : {}) },
    });
    if (!response.ok) await failFast(response, "Gemini video generation");
    const payload = (await response.json()) as { id?: string };
    return {
      data: { externalJobId: payload.id ?? "" },
      usage: {
        units: durationSeconds ?? 0,
        unitType: "seconds",
        model: chosen,
        latencyMs: Date.now() - startedAt,
      },
      providerName: "gemini",
    };
  },
  async getJob(externalJobId) {
    const startedAt = Date.now();
    const response = await fetch(`${GATEWAY}/videos/${externalJobId}`, {
      headers: { "Lovable-API-Key": credential(), "X-Lovable-AIG-SDK": "fetch" },
    });
    if (!response.ok) await failFast(response, "Gemini video status");
    const payload = (await response.json()) as {
      status?: string;
      output?: { url?: string };
      error?: { message?: string };
    };
    const status =
      payload.status === "completed"
        ? "completed"
        : payload.status === "failed"
          ? "failed"
          : "pending";
    return {
      data: {
        status,
        ...(payload.output?.url !== undefined && { videoUrl: payload.output.url }),
        ...(payload.error?.message !== undefined && { error: payload.error.message }),
      },
      usage: { units: 0, unitType: "seconds", latencyMs: Date.now() - startedAt },
      providerName: "gemini",
    };
  },
};
