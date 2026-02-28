import React, { useEffect, useRef } from 'react';

/**
 * TravelBackground — pure CSS + SVG animated travel scene
 * Zero network requests, renders instantly, runs on CPU composite layer
 * Designed for the MyTripSplitter dark theme
 */
const TravelBackground: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Subtle pointer-tracking aurora tilt (desktop only)
    useEffect(() => {
        const el = containerRef.current;
        if (!el || window.innerWidth < 768) return;
        const handleMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 12;
            const y = (e.clientY / window.innerHeight - 0.5) * 8;
            el.style.transform = `translate(${x}px, ${y}px)`;
        };
        window.addEventListener('mousemove', handleMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMove);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
            {/* ── Deep aurora blobs ─────────────────────────────────── */}
            <div ref={containerRef} className="absolute inset-0 will-change-transform" style={{ transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
                <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[55%] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(182,19,236,0.13) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'auroraFloat1 18s ease-in-out infinite' }} />
                <div className="absolute top-[30%] right-[-15%] w-[55%] h-[50%] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.11) 0%, transparent 70%)', filter: 'blur(70px)', animation: 'auroraFloat2 22s ease-in-out infinite' }} />
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'auroraFloat3 26s ease-in-out infinite' }} />
            </div>

            {/* ── Mountain silhouette (SVG, inline, zero network) ───── */}
            <svg
                viewBox="0 0 375 180"
                className="absolute bottom-0 left-0 w-full"
                preserveAspectRatio="none"
                style={{ opacity: 0.07 }}
            >
                {/* Far mountains */}
                <polygon points="0,180 60,80 130,120 200,60 280,110 340,70 375,100 375,180"
                    fill="url(#mtnGradFar)" />
                {/* Near mountains */}
                <polygon points="0,180 40,130 100,100 160,140 230,95 300,130 375,105 375,180"
                    fill="url(#mtnGradNear)" />
                {/* Wave strip at base */}
                <path d="M0,175 Q94,165 188,175 Q282,185 375,172 L375,180 L0,180 Z"
                    fill="rgba(182,19,236,0.15)" />
                <defs>
                    <linearGradient id="mtnGradFar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#b613ec" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.2" />
                    </linearGradient>
                    <linearGradient id="mtnGradNear" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#0A0A0F" stopOpacity="0.8" />
                    </linearGradient>
                </defs>
            </svg>

            {/* ── Grid texture overlay ───────────────────────────────── */}
            <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                backgroundSize: '48px 48px',
                maskImage: 'radial-gradient(ellipse 80% 60% at 50% 100%, transparent 30%, black 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 100%, transparent 30%, black 100%)',
            }} />

            {/* ── Floating travel icons (SVG emoji-style, CSS animated) ── */}
            <FloatingIcons />

            {/* ── Starfield ─────────────────────────────────────────── */}
            <Starfield />
        </div>
    );
};

const ICONS = [
    { emoji: '🏔️', size: 18, x: '8%', y: '20%', delay: '0s', dur: '12s' },
    { emoji: '✈️', size: 16, x: '82%', y: '12%', delay: '2s', dur: '16s' },
    { emoji: '🏕️', size: 15, x: '72%', y: '55%', delay: '4s', dur: '14s' },
    { emoji: '🌊', size: 17, x: '18%', y: '65%', delay: '1s', dur: '18s' },
    { emoji: '🚵', size: 14, x: '55%', y: '18%', delay: '3s', dur: '20s' },
    { emoji: '⛺', size: 13, x: '40%', y: '72%', delay: '5s', dur: '15s' },
    { emoji: '🌄', size: 16, x: '90%', y: '75%', delay: '0.5s', dur: '22s' },
    { emoji: '🧭', size: 13, x: '28%', y: '35%', delay: '6s', dur: '17s' },
];

const FloatingIcons: React.FC = () => (
    <>
        {ICONS.map((icon, i) => (
            <div
                key={i}
                className="absolute select-none"
                style={{
                    left: icon.x,
                    top: icon.y,
                    fontSize: icon.size,
                    opacity: 0.12,
                    animation: `iconFloat ${icon.dur} ease-in-out infinite`,
                    animationDelay: icon.delay,
                    filter: 'grayscale(0.3)',
                }}
            >
                {icon.emoji}
            </div>
        ))}
    </>
);

// 40 deterministic stars so they don't shift on re-render
const STARS = Array.from({ length: 40 }, (_, i) => ({
    x: ((i * 37 + 13) % 97).toFixed(1),
    y: ((i * 53 + 7) % 85).toFixed(1),
    r: (0.8 + (i % 3) * 0.4).toFixed(1),
    opacity: (0.15 + (i % 4) * 0.07).toFixed(2),
    dur: `${3 + (i % 5)}s`,
    delay: `${(i % 7) * 0.6}s`,
}));

const Starfield: React.FC = () => (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6 }}>
        {STARS.map((s, i) => (
            <circle
                key={i}
                cx={`${s.x}%`}
                cy={`${s.y}%`}
                r={s.r}
                fill="white"
                opacity={s.opacity}
                style={{ animation: `starTwinkle ${s.dur} ease-in-out infinite`, animationDelay: s.delay }}
            />
        ))}
    </svg>
);

export default TravelBackground;
