import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clapperboard,
  Film,
  Layers,
  ShieldCheck,
  Sparkles,
  Wand2,
  Workflow,
  Gauge,
} from "lucide-react";

import { Eyebrow, Panel } from "@/components/studio/primitives";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Movie Studio — Write, storyboard and generate films" },
      {
        name: "description",
        content:
          "AI Movie Studio turns an idea into a script, storyboard, shot list and finished footage with a single production pipeline.",
      },
      { property: "og:title", content: "AI Movie Studio" },
      {
        property: "og:description",
        content: "Turn an idea into a finished film with one AI production pipeline.",
      },
    ],
  }),
  component: Landing,
});

const CAPABILITIES = [
  {
    icon: Wand2,
    title: "Story engine",
    body: "Loglines, treatments and full scene-by-scene scripts drafted with Gemini and kept consistent across every revision.",
  },
  {
    icon: Layers,
    title: "Character & world bible",
    body: "Characters, locations and visual references stay locked so every generated frame looks like the same film.",
  },
  {
    icon: Clapperboard,
    title: "Shot-level control",
    body: "Break scenes into shots with camera language, duration and dialogue before a single frame is rendered.",
  },
  {
    icon: Workflow,
    title: "Resilient render pipeline",
    body: "Every render is a tracked job with retries, cancellation and credit holds — nothing silently disappears.",
  },
  {
    icon: ShieldCheck,
    title: "Isolated by design",
    body: "Your projects, assets and billing are reachable only by you. Admin tooling never reads customer content.",
  },
  {
    icon: Gauge,
    title: "Transparent credits",
    body: "Credits are reserved before work starts and settled after it finishes, with a full ledger you can audit.",
  },
];

const PIPELINE = [
  { step: "01", title: "Idea", body: "A logline, a genre, a mood." },
  { step: "02", title: "Script", body: "Scenes, beats and dialogue." },
  { step: "03", title: "Storyboard", body: "Key frames for every shot." },
  { step: "04", title: "Render", body: "Footage, voice and score." },
];

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="hero-aura pointer-events-none absolute inset-0" aria-hidden />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Film className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            AI Movie Studio
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Start creating
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Phase 1 — production foundation online
        </span>
        <h1 className="mx-auto mt-8 max-w-4xl text-5xl leading-[1.05] font-semibold sm:text-6xl lg:text-7xl">
          <span className="text-gradient">Direct entire films</span>
          <br />
          from a single idea.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          A studio-grade pipeline for AI filmmaking: script, cast, storyboard, shoot and score —
          orchestrated in one place, with the consistency a real production demands.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="glow-ring inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Create your studio account
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-medium transition hover:bg-secondary"
          >
            I already have an account
          </Link>
        </div>

        <Panel className="sheen mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
          {PIPELINE.map((stage) => (
            <div key={stage.step} className="bg-surface/40 p-6 text-left">
              <p className="font-display text-xs tracking-[0.3em] text-primary">{stage.step}</p>
              <p className="mt-3 font-display text-lg font-semibold">{stage.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stage.body}</p>
            </div>
          ))}
        </Panel>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
        <Eyebrow className="text-center">Built like a studio, not a toy</Eyebrow>
        <h2 className="mx-auto mt-4 max-w-2xl text-center text-3xl font-semibold sm:text-4xl">
          The foundation under every frame
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((item) => (
            <Panel key={item.title} className="p-6 transition hover:border-primary/30">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
                <item.icon className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </Panel>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>AI Movie Studio</p>
          <p>Movie generation tools arrive in Phase 2.</p>
        </div>
      </footer>
    </main>
  );
}
