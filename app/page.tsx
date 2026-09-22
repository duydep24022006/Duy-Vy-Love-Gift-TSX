"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Heart, RotateCcw, Sparkles, Volume2, VolumeX } from "lucide-react";

type Phase = "intro" | "opening" | "universe";

const loveNotes = [
  "Duy yêu Vy", "Vy là điều tuyệt vời nhất", "Duy ♥ Vy", "Luôn ở bên nhau nhé",
  "Yêu em thật nhiều", "Nụ cười của Vy thật xinh", "Mình cùng nhau thật lâu",
  "Chúc bé luôn vui vẻ", "Thương Vy nhất", "Duy sẽ luôn bên Vy",
  "Our little universe", "Forever & always",
];
const heartColors = ["#ff225d", "#ff4f86", "#ff0a54", "#ff85a8", "#ff477e"];

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 91.73 + salt * 47.19) * 43758.5453;
  return Math.round((value - Math.floor(value)) * 100000) / 100000;
}

function playChime() {
  try {
    const AudioContextClass = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.13, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.4);
    gain.connect(ctx.destination);
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(ctx.currentTime + index * 0.13);
      oscillator.stop(ctx.currentTime + 2.3);
    });
  } catch { /* Visuals remain available if audio is blocked. */ }
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [soundOn, setSoundOn] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stars = useMemo(() => Array.from({ length: 72 }, (_, i) => ({
    id: i, left: seeded(i, 1) * 100, top: seeded(i, 2) * 100,
    size: 1 + seeded(i, 3) * 2.6, delay: seeded(i, 4) * 5,
    duration: 2.2 + seeded(i, 5) * 4,
  })), []);

  const floatingNotes = useMemo(() => Array.from({ length: 38 }, (_, i) => ({
    id: i, text: loveNotes[i % loveNotes.length], x: 4 + seeded(i, 11) * 88,
    y: 7 + seeded(i, 12) * 84, z: -850 + seeded(i, 13) * 1050,
    rotate: -18 + seeded(i, 14) * 36, scale: 0.72 + seeded(i, 15) * 0.75,
    delay: seeded(i, 16) * -14, duration: 10 + seeded(i, 17) * 9,
    pink: seeded(i, 18) > 0.42,
  })), []);

  const hearts = useMemo(() => Array.from({ length: 34 }, (_, i) => ({
    id: i, left: seeded(i, 21) * 100, top: seeded(i, 22) * 100,
    size: 12 + seeded(i, 23) * 28, delay: seeded(i, 24) * -10,
    duration: 5 + seeded(i, 25) * 7, color: heartColors[i % heartColors.length],
  })), []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const openGift = useCallback(() => {
    if (phase !== "intro") return;
    setPhase("opening");
    if (soundOn) playChime();
    timerRef.current = setTimeout(() => setPhase("universe"), 1250);
  }, [phase, soundOn]);

  const replay = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("intro");
  };

  return (
    <main className="love-page" data-phase={phase}>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="star-field" aria-hidden="true">
        {stars.map((star) => <i key={star.id} className="star" style={{
          left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size,
          animationDelay: `${star.delay}s`, animationDuration: `${star.duration}s`,
        }} />)}
      </div>

      <section className={`intro-scene ${phase === "intro" ? "is-visible" : ""}`} aria-hidden={phase !== "intro"}>
        <p className="eyebrow"><Sparkles size={15} /> Món quà nhỏ dành riêng cho Vy</p>
        <h1>Vy ơi, Duy có điều<br /><span>muốn gửi đến em</span></h1>
        <p className="intro-copy">Chạm vào món quà và bước vào thế giới nhỏ của chúng mình nhé.</p>
        <button className="gift-button" onClick={openGift} aria-label="Mở món quà dành cho Vy">
          <span className="gift-aura" />
          <span className="gift-box">
            <span className="gift-lid"><span className="gift-bow"><i /><i /></span></span>
            <span className="gift-body"><span className="gift-ribbon" /><Heart className="gift-heart" fill="currentColor" /></span>
          </span>
          <span className="tap-hint">Chạm để mở <span>♥</span></span>
        </button>
        <div className="signature">Duy <Heart size={14} fill="currentColor" /> Vy</div>
      </section>

      <section className={`opening-scene ${phase === "opening" ? "is-visible" : ""}`} aria-hidden={phase !== "opening"}>
        <div className="burst-ring" /><div className="burst-ring ring-two" />
        <Heart className="burst-heart" fill="currentColor" />
        <p>Mở ra một chút yêu thương…</p>
      </section>

      <section className={`universe-scene ${phase === "universe" ? "is-visible" : ""}`} aria-hidden={phase !== "universe"}>
        <div className="vortex" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="note-space" aria-hidden="true">
          {floatingNotes.map((note) => <span key={note.id} className={`floating-note ${note.pink ? "pink" : "white"}`} style={{
            left: `${note.x}%`, top: `${note.y}%`, "--z": `${note.z}px`, "--rot": `${note.rotate}deg`,
            "--scale": note.scale, animationDelay: `${note.delay}s`, animationDuration: `${note.duration}s`,
          } as React.CSSProperties}>{note.text}</span>)}
        </div>
        <div className="heart-space" aria-hidden="true">
          {hearts.map((heart) => <Heart key={heart.id} className="flying-heart" fill="currentColor" style={{
            left: `${heart.left}%`, top: `${heart.top}%`, width: heart.size, height: heart.size,
            color: heart.color, animationDelay: `${heart.delay}s`, animationDuration: `${heart.duration}s`,
          }} />)}
        </div>
        <div className="love-card">
          <div className="orbit" aria-hidden="true"><i /><i /><i /></div>
          <span className="mini-label">FROM DUY, WITH LOVE</span>
          <h2>Duy <Heart aria-hidden="true" fill="currentColor" /> Vy</h2>
          <p>Cảm ơn em đã bước vào cuộc đời anh và làm những ngày bình thường trở nên thật đặc biệt.</p>
          <strong>Yêu em thật nhiều!</strong>
          <span className="forever">Hôm nay · Ngày mai · Và thật lâu sau nữa</span>
        </div>
        <div className="controls">
          <button onClick={replay} aria-label="Xem lại từ đầu"><RotateCcw size={18} /> <span>Xem lại</span></button>
          <button onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}>
            {soundOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
        </div>
      </section>
    </main>
  );
}
