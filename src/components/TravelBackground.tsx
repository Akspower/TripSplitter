import React, { useEffect, useRef } from 'react';

// ALL trip styles represented — beach, hotel/luxury, backpacker/mountain, food, transport
const TRAVEL_PARTICLES = [
    { e: '🏖️', s: 16 }, { e: '✈️', s: 14 }, { e: '🏔️', s: 15 },
    { e: '🏨', s: 13 }, { e: '🍜', s: 14 }, { e: '🛵', s: 13 },
    { e: '🎒', s: 15 }, { e: '🌊', s: 16 }, { e: '🍹', s: 13 },
    { e: '⛺', s: 14 }, { e: '🗺️', s: 13 }, { e: '🧳', s: 15 },
    { e: '🌴', s: 16 }, { e: '🚗', s: 13 }, { e: '📸', s: 12 },
    { e: '🏄', s: 14 }, { e: '🌅', s: 15 }, { e: '💳', s: 12 },
    { e: '🎯', s: 12 }, { e: '🧭', s: 13 }, { e: '🎑', s: 14 },
    { e: '🚀', s: 12 }, { e: '🍛', s: 13 }, { e: '🌙', s: 14 },
];

// Deterministic config so particles don't jump on re-render
const PARTICLE_CONFIG = TRAVEL_PARTICLES.map((p, i) => ({
    ...p,
    x: `${(i * 100 / TRAVEL_PARTICLES.length + (i % 3) * 8) % 95}%`,
    duration: `${18 + (i % 7) * 3}s`,
    delay: `${-(i * 2.1 % 20)}s`,     // negative delay = already mid-fall on load
    opacity: 0.06 + (i % 4) * 0.025,
}));

// 36 deterministic stars
const STARS = Array.from({ length: 36 }, (_, i) => ({
    x: ((i * 41 + 17) % 97).toFixed(1),
    y: ((i * 61 + 5) % 88).toFixed(1),
    r: (0.7 + (i % 3) * 0.45).toFixed(1),
    op: (0.12 + (i % 4) * 0.06).toFixed(2),
    dur: `${3 + (i % 5)}s`,
    delay: `${(i % 7) * 0.7}s`,
}));

/**
 * TravelBackground — zero-network, pure CSS animated
 * Universal travel scene — works for beach, mountain, hotel, backpacker, food trips
 */
const TravelBackground: React.FC = () => {
    const auroraRef = useRef<HTMLDivElement>(null);

    // Pointer-tracking aurora parallax on desktop
    useEffect(() => {
        const el = auroraRef.current;
        if (!el || window.innerWidth < 768) return;
        const handleMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 14;
            const y = (e.clientY / window.innerHeight - 0.5) * 10;
            el.style.transform = `translate(${x}px, ${y}px)`;
        };
        window.addEventListener('mousemove', handleMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMove);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">

            {/* ── Aurora blobs — abstract, universal ──────────── */}
            <div ref={auroraRef} className="absolute inset-0 will-change-transform"
                style={{ transition: 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
                <div className="absolute top-[-20%] left-[-15%] w-[65%] h-[60%] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(182,19,236,0.12) 0%, transparent 70%)', filter: 'blur(70px)', animation: 'auroraFloat1 20s ease-in-out infinite' }} />
                <div className="absolute top-[25%] right-[-20%] w-[60%] h-[55%] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'auroraFloat2 25s ease-in-out infinite' }} />
                <div className="absolute bottom-[-15%] left-[15%] w-[55%] h-[45%] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)', filter: 'blur(90px)', animation: 'auroraFloat3 30s ease-in-out infinite' }} />
            </div>

            {/* ── Universal travel emoji rain ─────────────────────
                Covers: beach 🏖️, mountain 🏔️, hotel 🏨,
                backpacker 🎒, food 🍜, transport ✈️🛵🚗,
                luxury 🍹, photography 📸 — every trip style
            ────────────────────────────────────────────────── */}
            {PARTICLE_CONFIG.map((p, i) => (
                <div
                    key={i}
                    className="absolute select-none"
                    style={{
                        left: p.x,
                        top: '-4%',
                        fontSize: p.s,
                        opacity: p.opacity,
                        filter: 'blur(0.4px)',
                        willChange: 'transform',
                        animation: `particleFall ${p.duration} linear ${p.delay} infinite`,
                    }}
                >
                    {p.e}
                </div>
            ))}

            {/* ── Center fade — particles dissolve into the card ── */}
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse 75% 55% at 50% 60%, rgba(10,10,15,0.75) 0%, transparent 100%)',
            }} />

            {/* ── Starfield ──────────────────────────────────────── */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.45 }}>
                {STARS.map((s, i) => (
                    <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
                        fill="white" opacity={s.op}
                        style={{ animation: `starTwinkle ${s.dur} ease-in-out infinite`, animationDelay: s.delay }} />
                ))}
            </svg>
        </div>
    );
};

export default TravelBackground;
