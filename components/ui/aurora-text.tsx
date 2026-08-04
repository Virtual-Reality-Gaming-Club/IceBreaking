"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function AuroraText({
  children,
  className,
  as: Component = "span",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  [key: string]: any;
}) {
  return (
    <Component
      className={cn(
        "relative inline-block bg-[length:200%_auto] bg-clip-text text-transparent animate-aurora",
        className?.includes("from-")
          ? className
          : cn("bg-gradient-to-r from-violet-500 via-indigo-400 via-cyan-400 to-purple-500", className)
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
