"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  Moon,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Flame,
  Send,
} from "lucide-react";

type Phase = "intro" | "opening" | "moonlight";

interface CustomLantern {
  id: number;
  x: number;
  speed: number;
  size: number;
  type: "sky" | "star";
  wish: string;
}

const midAutumnWishes = [
  "Trăng rằm sáng nhất đêm nay, nhưng nụ cười của Vy còn sáng hơn! ✨",
  "Chia Vy nửa cái bánh thập cẩm, còn nửa trái tim Duy thì gửi trọn cho em luôn! 🥮",
  "Đêm rằm có Chị Hằng, Chú Cuội, còn Duy thì chỉ muốn ở cạnh Vy thôi! 🌙",
  "Bé Vy bớt bướng lại một xíu nha, nhưng mà bướng cỡ nào Duy cũng thương! 🐰",
  "Rước đèn cùng Duy qua hết mùa trăng này đến thật nhiều mùa trăng sau nữa nhé! 🏮",
  "Công chúa thỏ ngọc của Duy hôm nay đã ăn bánh Trung Thu chưa nè? ♥",
  "Ước cho Vy luôn vui vẻ, đáng yêu và mãi bên cạnh Duy!",
  "Vy bướng thế này chỉ có mỗi Duy đủ kiên nhẫn chiều chuộng thôi đó nha! 😜",
];

const rabbitQuotes = [
  "Vy ơi đừng bướng nữa nha, thỏ méch Duy đó! 🐰",
  "Chia Vy một miếng bánh dẻo siêu ngọt nè! 🥮",
  "Duy bảo là thương Vy nhất trên đời luôn á! ♥",
  "Tối nay đi rước đèn với Duy nhớ nắm tay chặt nha! 🏮",
  "Bé Vy hôm nay xinh hơn cả Chị Hằng Nga luôn! ✨",
  "Thỏ chúc Vy Trung Thu ấm áp và ngập tràn hạnh phúc!",
];

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 91.73 + salt * 47.19) * 43758.5453;
  return Math.round((value - Math.floor(value)) * 100000) / 100000;
}

// Pentatonic Asian chime melody for Mid-Autumn
function playMidAutumnSound(variant: "open" | "hop" | "lantern" | "kiss" = "open") {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const gain = ctx.createGain();

    if (variant === "hop") {
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      gain.connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18); // A5
      osc.connect(gain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
      return;
    }

    if (variant === "lantern") {
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
      gain.connect(ctx.destination);
      [659.25, 987.77].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + 0.85);
      });
      return;
    }

    if (variant === "kiss") {
      // Nốt nhạc lãng mạn — E major arpeggio thượng thăng
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.11, ctx.currentTime + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
      gain.connect(ctx.destination);
      [659.25, 783.99, 987.77, 1174.66, 1318.51].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + 1.7);
      });
      return;
    }

    // Default opening chime: G4, A4, C5, D5, E5, G5 (Pentatonic melody)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8);
    gain.connect(ctx.destination);
    [392.0, 440.0, 523.25, 587.33, 659.25, 783.99].forEach((freq, index) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(ctx.currentTime + index * 0.14);
      osc.stop(ctx.currentTime + 2.6);
    });
  } catch {
    /* Audio fallback */
  }
}

// Continuous Pentatonic Asian Music Engine (Fallback / Ambient Synthesizer BGM)
class AmbientBgmEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private timer: number | null = null;

  start() {
    if (this.isPlaying) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(0.05, this.ctx.currentTime + 1.2);
      this.gainNode.connect(this.ctx.destination);
      this.isPlaying = true;

      const scale = [392.0, 440.0, 493.88, 587.33, 659.25, 783.99, 880.0, 987.77, 1174.66];
      let step = 0;

      const tick = () => {
        if (!this.isPlaying || !this.ctx || !this.gainNode) return;
        const freq = scale[step % scale.length];
        step = (step + (Math.random() > 0.4 ? 1 : 2)) % scale.length;

        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        noteGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.04 + Math.random() * 0.03, this.ctx.currentTime + 0.12);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.2);

        osc.connect(noteGain);
        noteGain.connect(this.gainNode);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 2.3);

        const delay = 480 + Math.random() * 520;
        this.timer = window.setTimeout(tick, delay);
      };

      tick();
    } catch {
      /* Fallback */
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
        setTimeout(() => {
          this.ctx?.close();
          this.ctx = null;
        }, 450);
      } catch {}
    }
  }
}

const bgmEngine = new AmbientBgmEngine();

// Canvas Engine Xử Lý Trái Tim Hạt Đỏ (Ảnh 2) & Vệt Đuôi Trái Tim Theo Đuôi Thỏ Bay Rộng Màn Hình (Ảnh 1)
function LoveParticleCanvas({
  isActive,
  onPlayKissSound,
  onShowBanner,
  onComplete,
}: {
  isActive: boolean;
  onPlayKissSound: () => void;
  onShowBanner: () => void;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const startTime = performance.now();
    let lastTime = performance.now();
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Dynamic Trail Particles for Flying Bunny (Ảnh 1)
    const trailParticles: Array<{
      x: number;
      y: number;
      size: number;
      alpha: number;
      vx: number;
      vy: number;
      char: string;
      life: number;
      maxLife: number;
    }> = [];

    // 450 Glowing Red Particle Hearts for Image 2 Heart Cloud
    const heartCloudParticles: Array<{
      targetX: number;
      targetY: number;
      size: number;
      color: string;
      alpha: number;
    }> = [];

    const heartColors = [
      "#ff0044",
      "#ff1744",
      "#d50000",
      "#ff4081",
      "#ff5252",
      "#e91e63",
      "#ff0022",
      "#ff3366",
      "#c2185b",
    ];

    for (let i = 0; i < 450; i++) {
      const t = Math.random() * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)
      );

      const fillFactor = Math.sqrt(Math.random());
      const rScale = Math.min(width, height) * 0.016;

      heartCloudParticles.push({
        targetX: hx * fillFactor * rScale + (Math.random() - 0.5) * 16,
        targetY: hy * fillFactor * rScale + (Math.random() - 0.5) * 16,
        size: Math.random() * 5.5 + 2.5,
        color: heartColors[Math.floor(Math.random() * heartColors.length)],
        alpha: 0.85 + Math.random() * 0.15,
      });
    }

    // Physics Lerp Position State for Rabbit
    let curX = width / 2;
    let curY = height * 0.44;
    let curScale = 1.0;

    let kissSoundFired = false;
    let bannerFired = false;
    let completeFired = false;
    let explosionStartTime = 0;

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      if (isActive) {
        const cx = width / 2;
        const cy = height * 0.44;

        let targetX = cx;
        let targetY = cy;
        let targetScale = 1.0;
        let emoji = "🐰";
        let isOrbiting = false;

        // Stage Timeline:
        // 0.0s - 2.5s: Orbit flying wide screen (Stage 1 - EXACTLY 1 ROTATION)
        // 2.5s - 3.2s: Swoop into exact center (Stage 2)
        // 3.2s - 3.7s: Stop in center & pucker face 😚 (Stage 3 - Pause)
        // 3.7s - 5.8s: Red particle heart explosion erupts from rabbit mouth in center (Stage 4)
        // 5.0s: Banner drops down from top (Stage 5)
        // 5.8s: Complete (Stage 6)

        if (elapsed < 2.5) {
          // STAGE 1: Orbit Flying Wide Screen (1 Single Elegant Orbit)
          isOrbiting = true;
          const tProgress = elapsed / 2.5;
          const easedProgress = Math.sin(tProgress * Math.PI * 0.5);
          const angle = easedProgress * Math.PI * 2; // EXACTLY 1 Rotation!

          const rx = width * 0.42;
          const ry = height * 0.34;

          targetX = cx + Math.cos(angle) * rx;
          targetY = cy + Math.sin(angle) * ry;

          const depthFactor = (Math.sin(angle) + 1) / 2; // 0 to 1
          const zoomPulse = Math.sin(elapsed * 10) * 0.08;
          targetScale = 0.45 + depthFactor * 1.65 + zoomPulse; // 0.45x -> 2.18x depth zoom
          emoji = "🐰";
        } else if (elapsed < 3.2) {
          // STAGE 2: Smooth Swoop into Exact Center
          isOrbiting = true;
          targetX = cx;
          targetY = cy;
          targetScale = 1.85;
          emoji = "🐰";
        } else if (elapsed < 3.7) {
          // STAGE 3: Stop gracefully in center, turn to Kiss Face 😚, sound trigger
          targetX = cx;
          targetY = cy + Math.sin((elapsed - 3.2) * 8) * 5; // Gentle hover bobbing
          targetScale = 2.05;
          emoji = "😚";

          if (!kissSoundFired) {
            kissSoundFired = true;
            onPlayKissSound();
          }
        } else if (elapsed < 5.8) {
          // STAGE 4: Red Heart Explosion Erupts from Rabbit Mouth in Center!
          targetX = cx;
          targetY = cy + Math.sin((elapsed - 3.7) * 6) * 4;
          targetScale = 2.0;
          emoji = elapsed - 3.7 > 1.2 ? "🥰" : "😚";

          if (!explosionStartTime) explosionStartTime = now;
          const kElapsed = (now - explosionStartTime) / 1000;

          const scaleFactor = 0.2 + Math.pow(kElapsed, 0.85) * 1.45;
          const globalAlpha = Math.max(0, 1 - Math.pow(kElapsed / 2.0, 1.4));

          ctx.save();
          ctx.translate(curX, curY); // Burst directly from center / rabbit mouth!

          heartCloudParticles.forEach((p) => {
            const px = p.targetX * scaleFactor;
            const py = p.targetY * scaleFactor;
            const a = p.alpha * globalAlpha;

            if (a > 0.01) {
              ctx.save();
              ctx.globalAlpha = a;
              ctx.fillStyle = p.color;
              ctx.shadowColor = "#ff0044";
              ctx.shadowBlur = Math.round(12 * (1 + scaleFactor * 0.4));

              ctx.beginPath();
              ctx.arc(px, py, p.size * (0.85 + scaleFactor * 0.25), 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          });

          ctx.restore();

          // Stage 5: Banner trigger at ~5.0s
          if (elapsed >= 5.0 && !bannerFired) {
            bannerFired = true;
            onShowBanner();
          }
        } else {
          // Stage 6: Complete
          if (!completeFired) {
            completeFired = true;
            onComplete();
          }
        }

        // Ultra-smooth 60fps/120fps physics lerp smoothing
        const lerpFactor = 1 - Math.exp(-14 * dt);
        const prevX = curX;
        const prevY = curY;

        curX += (targetX - curX) * lerpFactor;
        curY += (targetY - curY) * lerpFactor;
        curScale += (targetScale - curScale) * lerpFactor;

        // Emit Heart Tail Particles when rabbit is flying/swooping
        if (isOrbiting) {
          const dx = curX - prevX;
          const dy = curY - prevY;
          const speed = Math.hypot(dx, dy);

          if (speed > 0.8) {
            const trailChars = ["❤️", "💖", "💕", "❣️"];
            const count = curScale > 1.2 ? 3 : 2;
            for (let k = 0; k < count; k++) {
              trailParticles.push({
                x: curX - dx * 0.8 + (Math.random() - 0.5) * 14,
                y: curY - dy * 0.8 + (Math.random() - 0.5) * 14,
                size: (Math.random() * 8 + 14) * curScale,
                alpha: 0.95,
                vx: -dx * 0.25 + (Math.random() - 0.5) * 1.5,
                vy: -dy * 0.25 + (Math.random() - 0.5) * 1.5,
                char: trailChars[Math.floor(Math.random() * trailChars.length)],
                life: 0,
                maxLife: 0.6 + Math.random() * 0.3,
              });
            }
          }
        }

        // Draw Bunny Emoji on Canvas with high-res glow & depth
        if (elapsed < 6.4) {
          ctx.save();
          const bunnyFontSize = Math.max(22, Math.round(50 * curScale));
          ctx.font = `${bunnyFontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
          ctx.shadowColor = elapsed >= 3.7 ? "#ff4081" : "#ffe082";
          ctx.shadowBlur = Math.round(14 + curScale * 16);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(emoji, curX, curY);
          ctx.restore();
        }
      }

      // Render & update trail particles (fade out in ~0.6s - 0.9s)
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life += dt;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        p.size *= 0.97;

        if (p.alpha <= 0 || p.life >= p.maxLife) {
          trailParticles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = "#ff004d";
        ctx.shadowBlur = 12;
        ctx.font = `${p.size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        ctx.fillText(p.char, p.x, p.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isActive, onPlayKissSound, onShowBanner, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 34,
      }}
    />
  );
}

// Chiếc lồng đèn có thể cầm chuột hoặc ngón tay để kéo đi khắp màn hình
function DraggableLantern({
  type,
  size,
  initialLeft,
  duration,
  delay = 0,
  text,
}: {
  id?: number | string;
  type: "sky" | "star";
  size: number;
  initialLeft: number;
  duration: number;
  delay?: number;
  text?: string;
}) {
  const [isHeld, setIsHeld] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const grabOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const el = elRef.current;
    if (!el) return;
    e.stopPropagation();
    e.preventDefault();

    const rect = el.getBoundingClientRect();
    grabOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setPos({ x: rect.left, y: rect.top });
    setIsHeld(true);
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isHeld) return;
    setPos({
      x: e.clientX - grabOffset.current.x,
      y: e.clientY - grabOffset.current.y,
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isHeld) return;
    setIsHeld(false);
    try {
      elRef.current?.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      ref={elRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`floating-lantern-item lantern-${type} ${isHeld ? "is-held" : ""}`}
      style={
        isHeld && pos
          ? {
              position: "fixed",
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              bottom: "auto",
              animation: "none",
              zIndex: 999,
              cursor: "grabbing",
              touchAction: "none",
            }
          : pos
          ? {
              position: "fixed",
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              bottom: "auto",
              animation: `lanternFloatFromCurrent ${duration * 0.75}s linear infinite`,
              zIndex: 8,
              cursor: "grab",
              touchAction: "none",
            }
          : {
              left: `${initialLeft}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              cursor: "grab",
              touchAction: "none",
            }
      }
      title="Chạm hoặc kéo lồng đèn để di chuyển theo tay / chuột"
    >
      {type === "sky" ? (
        <div className="sky-lantern-box" style={{ width: size, height: size * 1.3 }}>
          <span className="lantern-flame" />
          <span className="lantern-text">{text || "Vy ♥"}</span>
          {isHeld && <span className="lantern-drag-halo" />}
        </div>
      ) : (
        <div className="star-lantern-shape" style={{ fontSize: `${size}px` }}>
          🏮
          {isHeld && <span className="lantern-drag-halo" />}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [soundOn, setSoundOn] = useState(true);
  const [rabbitMessage, setRabbitMessage] = useState(
    "Vy ơi chạm vào thỏ đi nè! 🐰"
  );
  const [rabbitHopCount, setRabbitHopCount] = useState(0);
  const [extraLanterns, setExtraLanterns] = useState<CustomLantern[]>([]);
  const [activeWishIndex, setActiveWishIndex] = useState(0);
  const [showScrollNote, setShowScrollNote] = useState(true);
  const [isRabbitFlying, setIsRabbitFlying] = useState(false);
  const [isRabbitKissing, setIsRabbitKissing] = useState(false);
  const [showBannerCard, setShowBannerCard] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Background stars
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: seeded(i, 1) * 100,
        top: seeded(i, 2) * 85,
        size: 1 + seeded(i, 3) * 2.2,
        delay: seeded(i, 4) * 4,
        duration: 2 + seeded(i, 5) * 4,
      })),
    []
  );

  // Floating Sky Lanterns (Thiên Đăng & Đèn Ông Sao)
  const defaultLanterns = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: 4 + seeded(i, 11) * 90,
        size: 26 + seeded(i, 12) * 22,
        duration: 10 + seeded(i, 13) * 10, // 10s - 20s
        delay: seeded(i, 14) * -16,
        swayDuration: 3 + seeded(i, 15) * 3,
        type: (seeded(i, 16) > 0.45 ? "sky" : "star") as "sky" | "star",
        wish: midAutumnWishes[i % midAutumnWishes.length],
      })),
    []
  );

  // Golden Fireflies (Đom đóm mùa thu)
  const fireflies = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: seeded(i, 21) * 100,
        top: 20 + seeded(i, 22) * 75,
        size: 2 + seeded(i, 23) * 4,
        duration: 4 + seeded(i, 24) * 5,
        delay: seeded(i, 25) * -8,
      })),
    []
  );

  // Shooting Stars (Sao băng)
  const shootingStars = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        id: i,
        top: 8 + seeded(i, 31) * 30,
        left: 20 + seeded(i, 32) * 60,
        delay: 2 + seeded(i, 33) * 9,
        duration: 2 + seeded(i, 34) * 2,
      })),
    []
  );

  // Intro rising sparkle particles
  const introParticles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: 4 + seeded(i, 91) * 92,
        size: 3 + seeded(i, 92) * 8,
        delay: seeded(i, 93) * 7,
        duration: 5 + seeded(i, 94) * 5,
      })),
    []
  );

  useEffect(() => {
    if (soundOn && phase !== "intro") {
      if (bgmAudioRef.current) {
        bgmAudioRef.current
          .play()
          .then(() => {
            bgmEngine.stop();
          })
          .catch(() => {
            bgmEngine.start();
          });
      } else {
        bgmEngine.start();
      }
    } else {
      bgmAudioRef.current?.pause();
      bgmEngine.stop();
    }

    return () => {
      bgmEngine.stop();
    };
  }, [soundOn, phase]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
    bgmEngine.stop();
  }, []);

  const openCelebration = useCallback(() => {
    if (phase !== "intro") return;
    setPhase("opening");
    if (soundOn) {
      playMidAutumnSound("open");
      if (bgmAudioRef.current) {
        bgmAudioRef.current.play().catch(() => {
          bgmEngine.start();
        });
      } else {
        bgmEngine.start();
      }
    }
    timerRef.current = setTimeout(() => {
      setPhase("moonlight");
      setIsRabbitFlying(true);
      setShowBannerCard(false);
    }, 1300);
  }, [phase, soundOn]);

  const replay = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
    setPhase("intro");
    setExtraLanterns([]);
    setIsRabbitFlying(false);
    setIsRabbitKissing(false);
    setShowBannerCard(false);
    setShowScrollNote(true);
  };

  // Click on Rabbit interaction
  const interactRabbit = () => {
    setRabbitHopCount((prev) => prev + 1);
    const randomIndex = Math.floor(Math.random() * rabbitQuotes.length);
    setRabbitMessage(rabbitQuotes[randomIndex]);
    if (soundOn) playMidAutumnSound("hop");
  };

  // Release a new sky lantern
  const releaseLantern = () => {
    if (soundOn) playMidAutumnSound("lantern");
    const newLantern: CustomLantern = {
      id: Date.now(),
      x: 10 + Math.random() * 80,
      speed: 12 + Math.random() * 6,
      size: 32 + Math.random() * 18,
      type: Math.random() > 0.5 ? "sky" : "star",
      wish: midAutumnWishes[Math.floor(Math.random() * midAutumnWishes.length)],
    };
    setExtraLanterns((prev) => [...prev.slice(-15), newLantern]);
    // Also cycle wish in ribbon
    setActiveWishIndex((prev) => (prev + 1) % midAutumnWishes.length);
  };

  return (
    <main className="autumn-page" data-phase={phase}>
      {/* Ambient glowing moonlight fog */}
      <div className="moon-ambient moon-ambient-gold" />
      <div className="moon-ambient moon-ambient-violet" />

      {/* Starry Night Sky */}
      <div className="star-field" aria-hidden="true">
        {stars.map((star) => (
          <i
            key={star.id}
            className="autumn-star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Shooting Stars */}
      <div className="shooting-stars-field" aria-hidden="true">
        {shootingStars.map((s) => (
          <div
            key={s.id}
            className="shooting-star"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* ================= PHASE 1: MỞ HỘI TRĂNG RẰM ================= */}
      <section
        className={`intro-scene ${phase === "intro" ? "is-visible" : ""}`}
        aria-hidden={phase !== "intro"}
      >
        {/* Hào quang mặt trăng hậu cảnh */}
        <div className="intro-bg-moon" aria-hidden="true" />
        {/* Đèn lồng trang trí nền */}
        <div className="intro-lanterns-bg" aria-hidden="true">
          <span className="intro-lantern il-1">🏮</span>
          <span className="intro-lantern il-2">🏮</span>
          <span className="intro-lantern il-3">🏮</span>
          <span className="intro-lantern il-4">🥮</span>
        </div>
        {/* Hạt sáng vàng bay lên */}
        <div className="intro-particles-field" aria-hidden="true">
          {introParticles.map((p) => (
            <span
              key={p.id}
              className="intro-particle"
              style={{
                left: `${p.left}%`,
                width: p.size,
                height: p.size,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
        </div>
        <p className="autumn-eyebrow">
          <Sparkles size={16} /> Đêm Rằm Tháng 8 · Trung Thu Yêu Thương
        </p>
        <h1 className="intro-title">
          Vy ơi, cùng Duy
          <br />
          <span>đón Tết Trung Thu nhé!</span>
        </h1>
        <p className="intro-copy">
          Đêm nay trăng tròn và sáng nhất. Chạm vào chiếc đèn lồng để thắp sáng
          không gian trăng rằm của chúng mình nha.
        </p>

        {/* Lồng đèn thắp sáng - Star Lantern Button */}
        <button
          className="lantern-starter-button"
          onClick={openCelebration}
          aria-label="Thắp sáng đèn lồng Trung Thu"
        >
          <span className="starter-aura" />
          <div className="lantern-prop">
            <div className="prop-handle" />
            <div className="prop-star-lantern">
              <span className="star-core">🏮</span>
              <span className="tassel tassel-left" />
              <span className="tassel tassel-mid" />
              <span className="tassel tassel-right" />
            </div>
          </div>
          <span className="tap-hint">
            <Flame size={15} /> Thắp sáng & Ngắm Trăng <span>♥</span>
          </span>
        </button>

        <div className="autumn-signature">
          Duy <Heart size={14} fill="currentColor" /> Vy · Mùa Trăng Đoàn Viên
        </div>
      </section>

      {/* ================= PHASE 2: ÁNH TRĂNG BÙNG NỔ ================= */}
      <section
        className={`opening-scene ${phase === "opening" ? "is-visible" : ""}`}
        aria-hidden={phase !== "opening"}
      >
        <div className="moon-burst" />
        <div className="moon-ring-burst" />
        <span className="big-lantern-icon">🏮</span>
        <p className="opening-text">Ánh trăng rằm đang soi sáng…</p>
      </section>

      {/* ================= PHASE 3: KHÔNG GIAN ĐÊM RẰM TRUNG THU ================= */}
      <section
        className={`moonlight-scene ${phase === "moonlight" ? "is-visible" : ""}`}
        aria-hidden={phase !== "moonlight"}
      >
        {/* Canvas Engine Xử Lý Trái Tim Hạt Đỏ (Ảnh 2) & Đuôi Trái Tim Thỏ Bay (Ảnh 1) */}
        <LoveParticleCanvas
          isActive={isRabbitFlying}
          onPlayKissSound={() => {
            if (soundOn) playMidAutumnSound("kiss");
          }}
          onShowBanner={() => {
            setShowBannerCard(true);
            if (soundOn) playMidAutumnSound("lantern");
          }}
          onComplete={() => {
            setIsRabbitFlying(false);
          }}
        />

        {/* 1. MẶT TRĂNG RẰM KHỔNG LỒ (VÀNG RỰC RỠ, HÀO QUANG ÁM ÁP) */}
        <div className="full-moon-container" onClick={interactRabbit} title="Chạm vào trăng rằm">
          <div className="moon-glow-outer" />
          <div className="moon-glow-inner" />
          <div className="full-moon">
            <div className="moon-crater crater-1" />
            <div className="moon-crater crater-2" />
            <div className="moon-crater crater-3" />
            <div className="moon-crater crater-4" />
          </div>
          {/* Mây bồng bềnh lướt qua trăng */}
          <div className="moon-cloud cloud-top" />
          <div className="moon-cloud cloud-bottom" />
        </div>


        {/* 2. CHÚ THỎ NGỌC TINH NGHỊCH (NGỒI TRÊN MÂY) */}
        {!isRabbitFlying && !isRabbitKissing && (
          <div
            className={`jade-rabbit-container ${rabbitHopCount > 0 ? "is-hopping" : ""}`}
            key={rabbitHopCount}
            onClick={interactRabbit}
            title="Chạm vào Thỏ Ngọc để trêu nhé!"
          >
            <div className="rabbit-speech-bubble">
              <span>{rabbitMessage}</span>
            </div>

            <div className="rabbit-cloud-stand">
              <div className="cloud-bubble cb-1" />
              <div className="cloud-bubble cb-2" />
              <div className="cloud-bubble cb-3" />
            </div>

            <div className="rabbit-body">
              <div className="rabbit-ear ear-left">
                <span className="ear-inner" />
              </div>
              <div className="rabbit-ear ear-right">
                <span className="ear-inner" />
              </div>
              <div className="rabbit-head">
                <span className="rabbit-eye eye-left" />
                <span className="rabbit-eye eye-right" />
                <span className="rabbit-blush blush-left" />
                <span className="rabbit-blush blush-right" />
                <span className="rabbit-nose" />
              </div>
              <div className="rabbit-torso">
                <span className="mini-mooncake">🥮</span>
              </div>
              <div className="rabbit-tail" />
            </div>
            <span className="rabbit-hint-badge">Chạm vào em nè 🐰</span>
          </div>
        )}

        {/* 3. CƠN MƯA THIÊN ĐĂNG & ĐÈN ÔNG SAO BAY LÊN (CẦM KÉO DI CHUYỂN THEO TAY/CHUỘT) */}
        <div className="lantern-sky-field">
          {defaultLanterns.map((l) => (
            <DraggableLantern
              key={l.id}
              id={l.id}
              type={l.type}
              size={l.size}
              initialLeft={l.left}
              duration={l.duration}
              delay={l.delay}
              text="Vy ♥"
            />
          ))}

          {/* Extra lanterns thả thủ công khi người dùng bấm */}
          {extraLanterns.map((l) => (
            <DraggableLantern
              key={l.id}
              id={l.id}
              type={l.type}
              size={l.size}
              initialLeft={l.x}
              duration={l.speed}
              text="Duy ♥ Vy"
            />
          ))}
        </div>

        {/* 4. ĐOM ĐÓM BAY DẬP DỜN */}
        <div className="fireflies-field" aria-hidden="true">
          {fireflies.map((f) => (
            <div
              key={f.id}
              className="firefly-particle"
              style={{
                left: `${f.left}%`,
                top: `${f.top}%`,
                width: `${f.size}px`,
                height: `${f.size}px`,
                animationDuration: `${f.duration}s`,
                animationDelay: `${f.delay}s`,
              }}
            />
          ))}
        </div>

        {/* 5. DẢI THƯ TRĂNG RẰM — Rơi từ trên xuống, có sợi dây nối ở giữa, đung đưa lũng lẳng ngay giữa màn hình */}
        {showBannerCard && showScrollNote ? (
          <div className="moon-ribbon-scroll hanging-banner-drop">
            {/* Sợi dây treo lụa hồng/vàng nối từ đỉnh màn hình xuống phần giữa cạnh trên banner */}
            <div className="banner-hanging-string">
              <span className="string-ring" />
              <span className="string-line" />
            </div>

            <div className="scroll-header">
              <span className="tag-season">TẾT TRUNG THU · ĐÊM RẰM ĐOÀN VIÊN</span>
              <button
                className="btn-toggle-scroll"
                onClick={() => setShowScrollNote(false)}
                title="Thu gọn lời chúc"
              >
                ✕
              </button>
            </div>

            <h2 className="couple-heading">
              Duy <Heart className="heading-heart" fill="currentColor" /> Vy
            </h2>

            <p className="main-autumn-wish">
              {midAutumnWishes[activeWishIndex]}
            </p>

            <div className="scroll-footer">
              <button
                className="btn-action-lantern"
                onClick={releaseLantern}
                title="Thả một ngọn đèn trời bay lên"
              >
                <Send size={15} /> Thả đèn ước nguyện
              </button>

              <button
                className="btn-action-rabbit"
                onClick={interactRabbit}
                title="Trêu chọc Thỏ Ngọc"
              >
                🐰 Trêu Thỏ Ngọc
              </button>
            </div>
          </div>
        ) : showBannerCard ? (
          <button
            className="btn-reopen-scroll"
            onClick={() => setShowScrollNote(true)}
          >
            📜 Xem thiệp chúc Trung Thu của Duy
          </button>
        ) : null}

        {/* Nút điều khiển góc phải */}
        <div className="controls">
          <button onClick={replay} aria-label="Xem lại từ đầu" title="Xem lại từ đầu">
            <RotateCcw size={18} /> <span>Xem lại</span>
          </button>
          <button
            onClick={() => setSoundOn((value) => !value)}
            aria-label={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
            title={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {soundOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
        </div>
      </section>

      {/* Nhạc nền romantic lofi piano + Pentatonic Web Audio synth fallback */}
      <audio
        ref={bgmAudioRef}
        loop
        preload="auto"
        src="https://assets.mixkit.co/music/preview/mixkit-romantic-piano-126.mp3"
      />
    </main>
  );
}
