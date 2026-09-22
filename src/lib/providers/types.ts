/**
 * Provider abstraction.
 *
 * Application code depends only on these interfaces. Provider-specific logic
 * (Gemini, ElevenLabs, storage backends, …) lives in adapter modules under
 * src/lib/providers/adapters and is reachable only through the registry.
 */

export type ProviderKind = "LLM" | "IMAGE" | "VIDEO" | "VOICE" | "MUSIC" | "STORAGE";

export type ProviderUsage = {
  units: number;
  unitType: "tokens" | "images" | "seconds" | "characters" | "bytes";
  model?: string;
  latencyMs?: number;
};

export type ProviderResult<T> = {
  data: T;
  usage: ProviderUsage;
  providerName: string;
};

export type BaseProvider = {
  readonly kind: ProviderKind;
  readonly name: string;
  /** False when the provider's credentials are not configured in this environment. */
  isConfigured(): boolean;
};

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmProvider = BaseProvider & {
  readonly kind: "LLM";
  complete(input: {
    messages: LlmMessage[];
    model?: string;
    maxOutputHint?: string;
  }): Promise<ProviderResult<{ text: string }>>;
};

export type ImageProvider = BaseProvider & {
  readonly kind: "IMAGE";
  generate(input: {
    prompt: string;
    model?: string;
    aspectRatio?: string;
  }): Promise<ProviderResult<{ images: { base64?: string; url?: string }[] }>>;
};

export type VideoProvider = BaseProvider & {
  readonly kind: "VIDEO";
  createJob(input: {
    prompt: string;
    model?: string;
    durationSeconds?: number;
    imageUrl?: string;
  }): Promise<ProviderResult<{ externalJobId: string }>>;
  getJob(externalJobId: string): Promise<
    ProviderResult<{
      status: "pending" | "completed" | "failed";
      videoUrl?: string;
      error?: string;
    }>
  >;
};

export type VoiceProvider = BaseProvider & {
  readonly kind: "VOICE";
  synthesize(input: {
    text: string;
    voiceId?: string;
  }): Promise<ProviderResult<{ audioBase64?: string; url?: string }>>;
};

export type MusicProvider = BaseProvider & {
  readonly kind: "MUSIC";
  compose(input: {
    prompt: string;
    durationSeconds?: number;
  }): Promise<ProviderResult<{ audioBase64?: string; url?: string }>>;
};

export type StorageProvider = BaseProvider & {
  readonly kind: "STORAGE";
  put(input: {
    path: string;
    body: ArrayBuffer | Uint8Array | Blob;
    contentType?: string;
  }): Promise<ProviderResult<{ path: string }>>;
  signedUrl(path: string, expiresInSeconds?: number): Promise<ProviderResult<{ url: string }>>;
};

export type AnyProvider =
  | LlmProvider
  | ImageProvider
  | VideoProvider
  | VoiceProvider
  | MusicProvider
  | StorageProvider;

export class ProviderNotConfiguredError extends Error {
  readonly kind: ProviderKind;
  readonly providerName: string;
  constructor(kind: ProviderKind, providerName: string) {
    super(`${kind} provider "${providerName}" is not configured in this environment.`);
    this.name = "ProviderNotConfiguredError";
    this.kind = kind;
    this.providerName = providerName;
  }
}
