/**
 * Provider registry — the single place the application resolves a provider for
 * a capability. Adding a provider means registering an adapter here; no other
 * module changes.
 */
import {
  geminiImageProvider,
  geminiLlmProvider,
  geminiVideoProvider,
} from "@/lib/providers/adapters/gemini.server";
import { cloudStorageProvider } from "@/lib/providers/adapters/supabase-storage.server";
import { pendingMusicProvider, pendingVoiceProvider } from "@/lib/providers/adapters/unconfigured";
import type {
  AnyProvider,
  ImageProvider,
  LlmProvider,
  MusicProvider,
  ProviderKind,
  StorageProvider,
  VideoProvider,
  VoiceProvider,
} from "@/lib/providers/types";
import { ProviderNotConfiguredError } from "@/lib/providers/types";

type Registry = Record<ProviderKind, { default: string; providers: Record<string, AnyProvider> }>;

const registry: Registry = {
  LLM: { default: "gemini", providers: { gemini: geminiLlmProvider } },
  IMAGE: { default: "gemini", providers: { gemini: geminiImageProvider } },
  VIDEO: { default: "gemini", providers: { gemini: geminiVideoProvider } },
  VOICE: { default: "elevenlabs", providers: { elevenlabs: pendingVoiceProvider } },
  MUSIC: { default: "stability", providers: { stability: pendingMusicProvider } },
  STORAGE: { default: "supabase", providers: { supabase: cloudStorageProvider } },
};

function resolve(kind: ProviderKind, name?: string): AnyProvider {
  const entry = registry[kind];
  const key = name ?? entry.default;
  const provider = entry.providers[key];
  if (!provider) throw new ProviderNotConfiguredError(kind, key);
  return provider;
}

export const getLlmProvider = (name?: string) => resolve("LLM", name) as LlmProvider;
export const getImageProvider = (name?: string) => resolve("IMAGE", name) as ImageProvider;
export const getVideoProvider = (name?: string) => resolve("VIDEO", name) as VideoProvider;
export const getVoiceProvider = (name?: string) => resolve("VOICE", name) as VoiceProvider;
export const getMusicProvider = (name?: string) => resolve("MUSIC", name) as MusicProvider;
export const getStorageProvider = (name?: string) => resolve("STORAGE", name) as StorageProvider;

export function describeProviders(): {
  kind: ProviderKind;
  name: string;
  isDefault: boolean;
  configured: boolean;
}[] {
  return (Object.keys(registry) as ProviderKind[]).flatMap((kind) =>
    Object.values(registry[kind].providers).map((provider) => ({
      kind,
      name: provider.name,
      isDefault: provider.name === registry[kind].default,
      configured: provider.isConfigured(),
    })),
  );
}
