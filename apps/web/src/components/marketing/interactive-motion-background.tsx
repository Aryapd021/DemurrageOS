"use client";

import React, { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  pulseSpeed: number;
}

interface ShippingRoute {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  cpX: number;
  cpY: number;
  progress: number;
  speed: number;
  color: string;
}

export default function InteractiveMotionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  useEffect(() => {
    // Ensure video plays reliably
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let width = 0;
    let height = 0;
    let time = 0;

    // Responsive setup
    function resize() {
      if (!canvas) return;
      width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.parentElement?.offsetHeight || window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx?.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Interactive Nodes (Telemetry data points)
    const nodeCount = 45;
    const nodes: Node[] = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1.2,
      alpha: Math.random() * 0.4 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }));

    // Dynamic Shipping Lane Arcs
    const routes: ShippingRoute[] = [
      { startX: 0.15, startY: 0.7, endX: 0.55, endY: 0.35, cpX: 0.3, cpY: 0.45, progress: 0.1, speed: 0.003, color: "rgba(56, 189, 248, 0.7)" },
      { startX: 0.55, startY: 0.35, endX: 0.85, endY: 0.6, cpX: 0.72, cpY: 0.4, progress: 0.6, speed: 0.0025, color: "rgba(217, 119, 6, 0.7)" },
      { startX: 0.2, startY: 0.4, endX: 0.78, endY: 0.75, cpX: 0.5, cpY: 0.65, progress: 0.4, speed: 0.002, color: "rgba(45, 212, 191, 0.7)" },
    ];

    // Mouse tracking for interactive waves
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", resize);
    resize();

    // Re-initialize node positions after resize
    nodes.forEach((n) => {
      n.x = Math.random() * width;
      n.y = Math.random() * height;
    });

    function draw() {
      if (!ctx) return;
      time += 0.015;

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // 1. Moving Atmospheric Ocean Wave Grid (Curved contour lines)
      ctx.lineWidth = 1;
      const waveCount = 5;
      for (let w = 0; w < waveCount; w++) {
        const baseY = height * (0.45 + w * 0.12);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(30, 58, 110, ${0.12 + w * 0.03})`;
        for (let x = 0; x <= width; x += 12) {
          // Distance from mouse creates interactive ripple
          const dx = x - mouseRef.current.x;
          const dy = baseY - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const mouseEffect = Math.max(0, 1 - dist / 220) * 18 * Math.sin(time * 3 - dist * 0.05);

          const y =
            baseY +
            Math.sin(x * 0.004 + time * 1.2 + w) * 14 +
            Math.cos(x * 0.008 - time * 0.8 + w * 2) * 8 +
            mouseEffect;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 2. Interactive Shipping Lane Arcs & Animated Cargo Packets
      for (const route of routes) {
        const sx = route.startX * width;
        const sy = route.startY * height;
        const ex = route.endX * width;
        const ey = route.endY * height;
        const cpx = route.cpX * width;
        const cpy = route.cpY * height;

        // Draw dotted flight/shipping path
        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = "rgba(100, 140, 200, 0.2)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cpx, cpy, ex, ey);
        ctx.stroke();
        ctx.restore();

        // Animate container cargo signal along quadratic Bezier curve
        route.progress = (route.progress + route.speed) % 1;
        const t = route.progress;
        // Bezier formula B(t) = (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
        const curX = Math.pow(1 - t, 2) * sx + 2 * (1 - t) * t * cpx + Math.pow(t, 2) * ex;
        const curY = Math.pow(1 - t, 2) * sy + 2 * (1 - t) * t * cpy + Math.pow(t, 2) * ey;

        // Glowing cargo packet beacon
        ctx.beginPath();
        ctx.arc(curX, curY, 3, 0, Math.PI * 2);
        ctx.fillStyle = route.color;
        ctx.shadowColor = route.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 3. Moving Telemetry Nodes with Interactive Web Connections
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Move nodes
        n.x += n.vx;
        n.y += n.vy;

        // Wrap boundaries smoothly
        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        // Mouse avoidance/repulsion
        const mdx = n.x - mouseRef.current.x;
        const mdy = n.y - mouseRef.current.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 120 && mDist > 0) {
          const force = (120 - mDist) / 120;
          n.x += (mdx / mDist) * force * 1.5;
          n.y += (mdy / mDist) * force * 1.5;
        }

        // Pulse size
        const currentAlpha = n.alpha * (0.7 + 0.3 * Math.sin(time * 2 + i));

        // Connect nearby nodes with subtle lines
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n.x - n2.x, n.y - n2.y);
          if (dist < 95) {
            ctx.strokeStyle = `rgba(148, 163, 184, ${(1 - dist / 95) * 0.12})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(203, 213, 225, ${currentAlpha})`;
        ctx.fill();
      }

      animFrame = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* ── Direct Video Layer from Pinterest Pin (Visibly distinct & moving) ── */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-60 mix-blend-screen"
      >
        <source src="/videos/hero-cinematic.mp4" type="video/mp4" />
      </video>

      {/* ── Interactive Kinetic Canvas (Waves, telemetry nodes, shipping lanes) ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* ── Subtle Top/Bottom Vignette to guarantee text legibility ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060a12]/80 via-transparent to-[#060a12] pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#060a12]/30 to-[#060a12]/85 pointer-events-none" />
    </div>
  );
}
