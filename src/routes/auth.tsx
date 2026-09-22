import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Film, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  Eyebrow,
  Field,
  Panel,
  PrimaryButton,
  inputClass,
} from "@/components/studio/primitives";
import { fetchSession, signIn, signUp } from "@/lib/api/auth.functions";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).catch("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — AI Movie Studio" },
      {
        name: "description",
        content: "Sign in to AI Movie Studio to direct, storyboard and render your films.",
      },
      { property: "og:title", content: "Sign in — AI Movie Studio" },
      { property: "og:description", content: "Access your AI film studio." },
    ],
  }),
  beforeLoad: async () => {
    const session = await fetchSession();
    if (session) throw redirect({ to: "/studio" });
  },
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const isSignUp = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const doSignIn = useServerFn(signIn);
  const doSignUp = useServerFn(signUp);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isSignUp) {
        return doSignUp({ data: { email, password, displayName } });
      }
      return doSignIn({ data: { email, password } });
    },
    onSuccess: () => {
      toast.success(isSignUp ? "Studio account created" : "Welcome back");
      void navigate({ to: "/studio" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message.replace(/^Error:\s*/, ""));
    },
  });

  return (
    <main className="hero-aura relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Film className="size-5" />
          </span>
          <Eyebrow className="mt-5">AI Movie Studio</Eyebrow>
          <h1 className="mt-3 text-3xl font-semibold">
            {isSignUp ? "Open your studio" : "Back to the set"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignUp
              ? "Create an account and start with 250 production credits."
              : "Sign in to continue your production."}
          </p>
        </div>

        <Panel className="p-7">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            {isSignUp ? (
              <Field label="Name">
                <input
                  className={inputClass}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ava Directorson"
                  autoComplete="name"
                />
              </Field>
            ) : null}

            <Field label="Email">
              <input
                className={inputClass}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                autoComplete="email"
              />
            </Field>

            <Field
              label="Password"
              hint={
                isSignUp
                  ? "At least 10 characters, with upper and lower case letters and a number."
                  : undefined
              }
            >
              <input
                className={inputClass}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)
                }
                placeholder="••••••••••"
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </Field>

            <PrimaryButton type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isSignUp ? "Create account" : "Sign in"}
            </PrimaryButton>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "New to the studio?"}{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() =>
                void navigate({
                  to: "/auth",
                  search: { mode: isSignUp ? "signin" : "signup" },
                })
              }
            >
              {isSignUp ? "Sign in" : "Create one"}
            </button>
          </p>
        </Panel>
      </div>
    </main>
  );
}
