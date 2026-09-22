/**
 * Placeholder adapters for provider slots that have an interface but no
 * integration yet (voice, music). They fail loudly rather than silently doing
 * nothing, and are swapped out by registering a real adapter.
 */
import { optionalEnv } from "@/lib/config/env.server";
import type { MusicProvider, VoiceProvider } from "@/lib/providers/types";
import { ProviderNotConfiguredError } from "@/lib/providers/types";

export const pendingVoiceProvider: VoiceProvider = {
  kind: "VOICE",
  name: "elevenlabs",
  isConfigured: () => optionalEnv("ELEVENLABS_API_KEY") !== undefined,
  async synthesize() {
    throw new ProviderNotConfiguredError("VOICE", "elevenlabs");
  },
};

export const pendingMusicProvider: MusicProvider = {
  kind: "MUSIC",
  name: "stability",
  isConfigured: () => optionalEnv("STABILITY_API_KEY") !== undefined,
  async compose() {
    throw new ProviderNotConfiguredError("MUSIC", "stability");
  },
};
