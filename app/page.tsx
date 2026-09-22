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
function playMidAutumnSound(variant: "open" | "hop" | "lantern" = "open") {
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

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const openCelebration = useCallback(() => {
    if (phase !== "intro") return;
    setPhase("opening");
    if (soundOn) playMidAutumnSound("open");
    timerRef.current = setTimeout(() => setPhase("moonlight"), 1300);
  }, [phase, soundOn]);

  const replay = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("intro");
    setExtraLanterns([]);
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

        {/* 3. CƠN MƯA THIÊN ĐĂNG & ĐÈN ÔNG SAO BAY LÊN */}
        <div className="lantern-sky-field" aria-hidden="true">
          {defaultLanterns.map((l) => (
            <div
              key={l.id}
              className={`floating-lantern-item lantern-${l.type}`}
              style={{
                left: `${l.left}%`,
                animationDuration: `${l.duration}s`,
                animationDelay: `${l.delay}s`,
              }}
            >
              {l.type === "sky" ? (
                <div className="sky-lantern-box" style={{ width: l.size, height: l.size * 1.3 }}>
                  <span className="lantern-flame" />
                  <span className="lantern-text">Vy ♥</span>
                </div>
              ) : (
                <div className="star-lantern-shape" style={{ fontSize: `${l.size}px` }}>
                  🏮
                </div>
              )}
            </div>
          ))}

          {/* Extra lanterns thả thủ công khi người dùng bấm */}
          {extraLanterns.map((l) => (
            <div
              key={l.id}
              className={`floating-lantern-item extra-lantern lantern-${l.type}`}
              style={{
                left: `${l.x}%`,
                animationDuration: `${l.speed}s`,
              }}
            >
              <div className="sky-lantern-box" style={{ width: l.size, height: l.size * 1.3 }}>
                <span className="lantern-flame" />
                <span className="lantern-text">Duy ♥ Vy</span>
              </div>
            </div>
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

        {/* 5. DẢI THƯ TRĂNG RẰM TINH TẾ (GỌN GÀNG, KHÔNG ÁN NGỮ GIỮA MÀN HÌNH) */}
        {showScrollNote ? (
          <div className="moon-ribbon-scroll">
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
        ) : (
          <button
            className="btn-reopen-scroll"
            onClick={() => setShowScrollNote(true)}
          >
            📜 Xem thiệp chúc Trung Thu của Duy
          </button>
        )}

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
    </main>
  );
}
