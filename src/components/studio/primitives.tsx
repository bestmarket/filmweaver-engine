import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("glass-panel rounded-2xl", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "font-display text-[0.7rem] font-medium tracking-[0.35em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Panel className="p-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Panel>
  );
}

const STATUS_STYLES: Record<string, string> = {
  QUEUED: "bg-muted text-muted-foreground",
  PROCESSING: "bg-accent/15 text-accent",
  RETRYING: "bg-warning/15 text-warning",
  COMPLETED: "bg-success/15 text-success",
  FAILED: "bg-destructive/15 text-destructive",
  CANCELLED: "bg-secondary text-secondary-foreground",
  DRAFT: "bg-secondary text-secondary-foreground",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-semibold tracking-wide uppercase",
        STATUS_STYLES[status] ?? "bg-secondary text-secondary-foreground",
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-input bg-surface/60 px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring";
