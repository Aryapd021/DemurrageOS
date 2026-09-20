"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  formatFn?: (val: number) => string;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1.4,
  className,
  formatFn,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const obj = useRef({ val: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const target = { val: 0 };

    gsap.to(target, {
      val: value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        if (!ref.current) return;
        const rounded = Math.round(target.val);
        const formatted = formatFn
          ? formatFn(rounded)
          : rounded.toLocaleString("en-IN");
        ref.current.textContent = `${prefix}${formatted}${suffix}`;
      },
    });

    return () => {
      gsap.killTweensOf(target);
    };
  }, [value, prefix, suffix, duration, formatFn]);

  return (
    <span ref={ref} className={cn(className)}>
      {prefix}
      {formatFn ? formatFn(value) : value.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
