import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

// ─── Spinner ────────────────────────────────────────────────

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const spinnerSizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };

export function Spinner({ size = "md", label, className }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className || ""}`}>
      <Loader2 className={`animate-spin text-primary ${spinnerSizes[size]}`} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

// ─── Full page loading ──────────────────────────────────────

interface PageLoadingProps {
  logo?: ReactNode;
  message?: string;
}

export function PageLoading({ logo, message = "Carregando..." }: PageLoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {logo ? (
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-6"
        >
          {logo}
        </motion.div>
      ) : (
        <Spinner size="lg" className="mb-4" />
      )}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-muted-foreground"
      >
        {message}
      </motion.p>
    </div>
  );
}

// ─── Skeleton variations ────────────────────────────────────

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 ${className || ""}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl skeleton-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 skeleton-pulse" />
          <div className="h-3 w-1/2 skeleton-pulse" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 skeleton-pulse" />
        <div className="h-3 w-4/5 skeleton-pulse" />
        <div className="h-3 w-3/5 skeleton-pulse" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-3 border-b border-border flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 skeleton-pulse flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="px-6 py-4 border-b border-border/50 flex gap-4">
          {Array.from({ length: cols }).map((_, col) => (
            <div key={col} className={`h-4 skeleton-pulse flex-1 ${col === 0 ? "w-1/4" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 w-20 skeleton-pulse" />
            <div className="w-10 h-10 rounded-xl skeleton-pulse" />
          </div>
          <div className="h-7 w-24 skeleton-pulse mb-2" />
          <div className="h-3 w-16 skeleton-pulse" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 skeleton-pulse" />
      <SkeletonStats />
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard className="h-80" />
        <SkeletonCard className="h-80" />
      </div>
      <SkeletonTable />
    </div>
  );
}

// ─── Progress loading ───────────────────────────────────────

interface ProgressLoadingProps {
  progress: number;
  message?: string;
  subMessage?: string;
}

export function ProgressLoading({ progress, message, subMessage }: ProgressLoadingProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
          <motion.circle
            cx="18" cy="18" r="16" fill="none"
            stroke="hsl(var(--primary))" strokeWidth="2"
            strokeLinecap="round" strokeDasharray="100.5"
            animate={{ strokeDashoffset: 100.5 - (progress / 100) * 100.5 }}
            transition={{ duration: 0.3 }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
          {Math.round(progress)}%
        </span>
      </div>
      {message && <p className="text-sm font-medium">{message}</p>}
      {subMessage && <p className="text-xs text-muted-foreground">{subMessage}</p>}
    </div>
  );
}
