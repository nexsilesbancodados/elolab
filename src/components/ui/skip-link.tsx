import * as React from "react";
import { cn } from "@/lib/utils";

interface SkipLinkProps {
  targetId: string;
  children?: React.ReactNode;
  className?: string;
}

export function SkipLink({ targetId, children = "Ir para conteúdo principal", className }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]",
        "focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-all duration-200",
        className
      )}
    >
      {children}
    </a>
  );
}
