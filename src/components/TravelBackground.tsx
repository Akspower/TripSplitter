import React, { useEffect, useRef, memo } from 'react';

/**
 * TravelBackground — Premium abstract animated background
 * Zero network. GPU-composited (transform/opacity only).
 * No emojis. Pure glassmorphism + aurora + orbit dots.
 */
const TravelBackground: React.FC = () => {
    const auroraRef = useRef<HTMLDivElement>(null);

    // Pointer-tracking on desktop
    useEffect(() => {
        const el = auroraRef.current;
        if (!el || window.innerWidth < 768) return;
        const handle = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 16;
            const y = (e.clientY / window.innerHeight - 0.5) * 10;
            el.style.transform = `translate(${x}px, ${y}px)`;
        };
        window.addEventListener('mousemove', handle, { passive: true });
        return () => window.removeEventListener('mousemove', handle);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 will-change-transform" aria-hidden="true" style={{ contain: 'strict' }}>

            {/* ── Layer 1: Deep aurora blobs — vivid, slow drift ── */}
            <div ref={auroraRef} className="absolute inset-0 will-change-transform"
                style={{ transition: 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
                <div className="absolute rounded-full"
                    style={{ width: '70%', height: '60%', top: '-20%', left: '-15%', background: 'radial-gradient(circle at 40% 40%, rgba(182,19,236,0.18) 0%, rgba(79,70,229,0.08) 50%, transparent 75%)', filter: 'blur(60px)', animation: 'auroraFloat1 22s ease-in-out infinite' }} />
                <div className="absolute rounded-full"
                    style={{ width: '65%', height: '60%', top: '20%', right: '-20%', background: 'radial-gradient(circle at 60% 50%, rgba(79,70,229,0.15) 0%, rgba(6,182,212,0.06) 50%, transparent 75%)', filter: 'blur(70px)', animation: 'auroraFloat2 28s ease-in-out infinite' }} />
                <div className="absolute rounded-full"
                    style={{ width: '55%', height: '50%', bottom: '-15%', left: '20%', background: 'radial-gradient(circle at 50% 60%, rgba(6,182,212,0.09) 0%, rgba(182,19,236,0.05) 50%, transparent 75%)', filter: 'blur(80px)', animation: 'auroraFloat3 34s ease-in-out infinite' }} />
                {/* Extra warm accent top-right */}
                <div className="absolute rounded-full"
                    style={{ width: '40%', height: '35%', top: '5%', right: '10%', background: 'radial-gradient(circle, rgba(251,146,60,0.05) 0%, transparent 70%)', filter: 'blur(50px)', animation: 'auroraFloat2 18s ease-in-out infinite reverse' }} />
            </div>

            {/* ── Layer 2: Glassmorphism floating orbs ─────────── */}
            <GlassOrbs />

            {/* ── Layer 3: Orbiting dot ring ───────────────────── */}
            <OrbitRing />

            {/* ── Layer 4: Animated mesh grid ──────────────────── */}
            <div className="absolute inset-0" style={{
                backgroundImage: `
                    linear-gradient(rgba(182,19,236,0.025) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(182,19,236,0.025) 1px, transparent 1px)
                `,
                backgroundSize: '64px 64px',
                maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 0%, transparent 80%)',
                WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 0%, transparent 80%)',
                animation: 'meshDrift 40s linear infinite',
            }} />

            {/* ── Layer 5: Starfield ───────────────────────────── */}
            <Starfield />

            {/* ── Layer 6: Bottom vignette ─────────────────────── */}
            <div className="absolute inset-0" style={{
                background: 'linear-gradient(to bottom, transparent 50%, rgba(10,10,15,0.6) 100%)',
            }} />
        </div>
    );
};

/* Floating frosted-glass orbs — 6 at different depths & speeds */
const ORB_CONFIG = [
    { w: 220, h: 180, top: '8%', left: '5%', blur: 40, op: 0.035, dur: '25s', bc: 'rgba(182,19,236,0.6)', delay: '0s' },
    { w: 160, h: 160, top: '55%', left: '70%', blur: 30, op: 0.025, dur: '32s', bc: 'rgba(79,70,229,0.6)', delay: '-8s' },
    { w: 120, h: 120, top: '25%', left: '80%', blur: 20, op: 0.04, dur: '20s', bc: 'rgba(182,19,236,0.5)', delay: '-4s' },
    { w: 90, h: 90, top: '70%', left: '10%', blur: 16, op: 0.03, dur: '27s', bc: 'rgba(6,182,212,0.5)', delay: '-12s' },
    { w: 70, h: 70, top: '40%', left: '45%', blur: 12, op: 0.02, dur: '38s', bc: 'rgba(251,146,60,0.4)', delay: '-6s' },
    { w: 50, h: 50, top: '15%', left: '55%', blur: 8, op: 0.03, dur: '22s', bc: 'rgba(182,19,236,0.4)', delay: '-10s' },
];

const GlassOrbs: React.FC = () => (
    <>
        {ORB_CONFIG.map((o, i) => (
            <div
                key={i}
                className="absolute rounded-full"
                style={{
                    width: o.w, height: o.h,
                    top: o.top, left: o.left,
                    background: `radial-gradient(circle at 35% 35%, ${o.bc}, transparent 70%)`,
                    border: '1px solid rgba(255,255,255,0.04)',
                    opacity: o.op,
                    animation: `orbFloat ${o.dur} ease-in-out ${o.delay} infinite`,
                }}
            />
        ))}
    </>
);

/* Small glowing dot that orbits — represents a "journey in progress" */
const OrbitRing: React.FC = () => (
    <div className="absolute" style={{ top: '12%', right: '8%', width: 120, height: 120 }}>
        {/* Ring */}
        <div className="absolute inset-0 rounded-full"
            style={{ border: '1px solid rgba(182,19,236,0.1)', animation: 'ringPulse 4s ease-in-out infinite' }} />
        {/* Outer ring */}
        <div className="absolute rounded-full"
            style={{ inset: -20, border: '1px solid rgba(182,19,236,0.05)', animation: 'ringPulse 4s ease-in-out 0.5s infinite' }} />
        {/* Orbiting dot */}
        <div className="absolute w-2.5 h-2.5 rounded-full"
            style={{ top: '50%', left: '50%', marginTop: -5, marginLeft: 55, background: '#b613ec', boxShadow: '0 0 12px rgba(182,19,236,0.8)', animation: 'orbitSpin 6s linear infinite' }} />
        {/* Second slower dot */}
        <div className="absolute w-1.5 h-1.5 rounded-full"
            style={{ top: '50%', left: '50%', marginTop: -3, marginLeft: -80, background: '#818cf8', boxShadow: '0 0 8px rgba(129,140,248,0.6)', animation: 'orbitSpin 9s linear infinite reverse' }} />
    </div>
);

const STARS = Array.from({ length: 15 }, (_, i) => ({
    x: ((i * 41 + 17) % 97).toFixed(1), y: ((i * 61 + 5) % 85).toFixed(1),
    r: (0.7 + (i % 3) * 0.4).toFixed(1), op: (0.1 + (i % 4) * 0.05).toFixed(2),
    dur: `${3 + (i % 5)}s`, delay: `${(i % 7) * 0.7}s`,
}));

const Starfield: React.FC = () => (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
        {STARS.map((s, i) => (
            <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.op}
                style={{ animation: `starTwinkle ${s.dur} ease-in-out infinite`, animationDelay: s.delay }} />
        ))}
    </svg>
);

export default memo(TravelBackground);
