import React from "react";
import { DeliveryMode } from "@demurrageos/shared-types";
import { cn } from "@/lib/utils";
import { Zap, ArrowRightLeft, Building } from "lucide-react";

interface DeliveryModeBadgeProps {
  mode: DeliveryMode;
  hasFallback?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DeliveryModeBadge({
  mode,
  hasFallback = false,
  size = "md",
  className,
}: DeliveryModeBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  if (hasFallback) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <span
          className={cn(
            "font-bold uppercase tracking-wider rounded-md border flex items-center gap-1.5 bg-amber-50 text-amber-800 border-amber-300 shadow-sm",
            sizeClasses[size]
          )}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>DPD → CFS FALLBACK</span>
        </span>
      </div>
    );
  }

  if (mode === "DPD_DIRECT") {
    return (
      <span
        className={cn(
          "font-bold uppercase tracking-wider rounded-md border flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm",
          sizeClasses[size],
          className
        )}
      >
        <Zap className="w-3.5 h-3.5 text-emerald-600" />
        <span>DPD DIRECT</span>
      </span>
    );
  }

  if (mode === "DPD_CFS") {
    return (
      <span
        className={cn(
          "font-bold uppercase tracking-wider rounded-md border flex items-center gap-1.5 bg-sky-50 text-sky-800 border-sky-300 shadow-sm",
          sizeClasses[size],
          className
        )}
      >
        <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" />
        <span>DPD VIA CFS</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-bold uppercase tracking-wider rounded-md border flex items-center gap-1.5 bg-slate-100 text-slate-800 border-slate-300 shadow-sm",
        sizeClasses[size],
        className
      )}
    >
      <Building className="w-3.5 h-3.5 text-slate-600" />
      <span>CFS ROUTE</span>
    </span>
  );
}
