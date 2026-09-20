"use client";

import React, { useEffect, useRef } from "react";

export default function FullPageVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Handle browser autoplay policy
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      {/* ── Background Video from Pinterest Pin (https://in.pinterest.com/pin/680747299985247299/) ── */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover object-center opacity-70"
      >
        <source src="/videos/landing-bg.mp4" type="video/mp4" />
      </video>

      {/* ── Dark Translucent Scrim for High-Contrast Text Legibility ── */}
      <div className="absolute inset-0 bg-[#060a12]/55 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#060a12]/30 via-transparent to-[#060a12]/70 pointer-events-none" />
    </div>
  );
}
