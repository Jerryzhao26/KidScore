/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface CoinParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  scaleX: number;
  scaleSpeed: number;
  gravity: number;
  bounce: number;
  bouncesLeft: number;
  color: string;
  borderColor: string;
  innerColor: string;
}

interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export default function CoinShower() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coinsRef = useRef<CoinParticle[]>([]);
  const sparklesRef = useRef<SparkleParticle[]>([]);
  const isAnimatingRef = useRef<boolean>(false);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas dimensions safely
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const updateAndDraw = () => {
      const coins = coinsRef.current;
      const sparkles = sparklesRef.current;

      // If nothing to animate, clear once and stop loop
      if (coins.length === 0 && sparkles.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isAnimatingRef.current = false;
        animFrameIdRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw and update sparkles (simplified lightweight rendering)
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparkles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 2. Draw and update coins
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];

        // Apply physics
        c.vy += c.gravity;
        c.x += c.vx;
        c.y += c.vy;

        // Bounce on floor
        if (c.y + c.radius > canvas.height) {
          c.y = canvas.height - c.radius;
          if (c.bouncesLeft > 0 && Math.abs(c.vy) > 2) {
            c.vy = -c.vy * c.bounce;
            c.vx *= 0.7;
            c.bouncesLeft--;
          } else {
            // Settle quickly and disappear
            coins.splice(i, 1);
            continue;
          }
        }

        // Keep inside horizontal walls
        if (c.x - c.radius < 0) {
          c.x = c.radius;
          c.vx = -c.vx * 0.7;
        } else if (c.x + c.radius > canvas.width) {
          c.x = canvas.width - c.radius;
          c.vx = -c.vx * 0.7;
        }

        // Update 3D spin simulation
        c.rotation += c.rotationSpeed;
        c.scaleX += c.scaleSpeed;
        if (c.scaleX > 1) {
          c.scaleX = 1;
          c.scaleSpeed = -c.scaleSpeed;
        } else if (c.scaleX < -1) {
          c.scaleX = -1;
          c.scaleSpeed = -c.scaleSpeed;
        }

        // Lightweight 2D/3D coin render (NO expensive ctx.fillText)
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.scale(c.scaleX, 1);

        // Outer rim
        ctx.beginPath();
        ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
        ctx.fillStyle = c.borderColor;
        ctx.fill();

        // Inner core
        ctx.beginPath();
        ctx.arc(0, 0, c.radius * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = c.innerColor;
        ctx.fill();

        // Center dot detail
        ctx.beginPath();
        ctx.arc(0, 0, c.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = c.borderColor;
        ctx.fill();

        ctx.restore();
      }

      if (isAnimatingRef.current) {
        animFrameIdRef.current = requestAnimationFrame(updateAndDraw);
      }
    };

    const startAnimationIfNeeded = () => {
      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true;
        animFrameIdRef.current = requestAnimationFrame(updateAndDraw);
      }
    };

    // Trigger handler
    const handleCoinShowerEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ count?: number; x?: number; y?: number }>;
      const { count = 10, x = window.innerWidth / 2, y = window.innerHeight / 2 } = customEvent.detail || {};

      // Limit particle counts to prevent lag
      const spawnCount = Math.min(count, 12);
      const newCoins = coinsRef.current;
      const newSparkles = sparklesRef.current;

      const GOLD_SHADES = [
        { border: '#b45309', inner: '#fbbf24', coin: '#f59e0b' },
        { border: '#92400e', inner: '#fef08a', coin: '#fbbf24' },
      ];

      // Spawn coins
      for (let i = 0; i < spawnCount; i++) {
        const shade = GOLD_SHADES[i % GOLD_SHADES.length];
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        const magnitude = Math.random() * 10 + 8;

        newCoins.push({
          x,
          y,
          vx: Math.cos(angle) * magnitude,
          vy: Math.sin(angle) * magnitude,
          radius: Math.random() * 5 + 10,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          scaleX: Math.random() * 2 - 1,
          scaleSpeed: 0.1,
          gravity: 0.5,
          bounce: 0.4,
          bouncesLeft: 2,
          color: shade.coin,
          borderColor: shade.border,
          innerColor: shade.inner,
        });
      }

      // Spawn moderate sparkles
      const SPARKLE_COLORS = ['#fde047', '#fef08a', '#ffffff', '#34d399'];
      for (let i = 0; i < spawnCount * 1.5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const magnitude = Math.random() * 5 + 2;
        newSparkles.push({
          x,
          y,
          vx: Math.cos(angle) * magnitude,
          vy: Math.sin(angle) * magnitude - 2,
          size: Math.random() * 3 + 2,
          color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
          alpha: 1.0,
          decay: 0.03 + Math.random() * 0.02,
        });
      }

      startAnimationIfNeeded();
    };

    window.addEventListener('trigger-coin-shower', handleCoinShowerEvent);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('trigger-coin-shower', handleCoinShowerEvent);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      id="coin-shower-canvas"
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
    />
  );
}

// Helper utility to easily fire coin showers from anywhere in the app
export function triggerCoinShower(count: number = 10, x?: number, y?: number) {
  const event = new CustomEvent('trigger-coin-shower', {
    detail: { count, x, y },
  });
  window.dispatchEvent(event);
}

