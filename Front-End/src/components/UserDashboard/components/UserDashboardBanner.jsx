import React from 'react';
import { CheckCircle2, Sparkles, User, Calendar, BookOpen, Users } from 'lucide-react';

import bipsulogo from '../../../assets/bipsulogo.png';

const UserDashboardBanner = ({
    displayData,
    role,
    first_name,
    last_name,
}) => {
    // ✅ Personalized greeting base sa oras
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const fullName = `${first_name || ''} ${last_name || ''}`.trim() || 'Student';

    const roleLabel = role
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : 'Student';

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white p-6 sm:p-10 shadow-2xl shadow-blue-900/30 border border-white/10 my-6">

            {/* ═══════════════════════════════════════════════════ */}
            {/* 🎬 CINEMATIC BACKGROUND — BIPSU LOGO              */}
            {/* ═══════════════════════════════════════════════════ */}
            <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none select-none"
                style={{ zIndex: 0 }}
            >
                {/* Main logo — malaki, naka-rotate, naka-blend sa gradient */}
                <img
                    src={bipsulogo}
                    alt=""
                    draggable="false"
                    className="
                        absolute
                        right-[-6%] sm:right-[-4%] md:right-[2%]
                        top-1/2 -translate-y-1/2
                        w-[280px] h-[280px]
                        sm:w-[360px] sm:h-[360px]
                        md:w-[420px] md:h-[420px]
                        object-contain
                        opacity-[0.10]
                        mix-blend-screen
                        rotate-[-8deg]
                        blur-[0.5px]
                    "
                    style={{
                        filter: 'drop-shadow(0 0 60px rgba(255,255,255,0.25)) brightness(2.2) saturate(0.4)',
                    }}
                />

                {/* Secondary ghost — mas maliit, mirrored, sa kaliwang side para balanced */}
                <img
                    src={bipsulogo}
                    alt=""
                    draggable="false"
                    className="
                        absolute
                        left-[-10%] bottom-[-20%]
                        w-[220px] h-[220px] sm:w-[300px] sm:h-[300px]
                        object-contain
                        opacity-[0.05]
                        mix-blend-screen
                        rotate-[12deg]
                        blur-[2px]
                    "
                    style={{
                        filter: 'brightness(2.5) saturate(0.2)',
                    }}
                />

                {/* Cinematic spotlight — radial gradient na nag-ce-center sa logo */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(circle at 78% 50%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 25%, rgba(0,0,0,0) 55%)',
                    }}
                />

                {/* Vignette — para lumalim ang edges parang film */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(15,23,42,0.45) 100%)',
                    }}
                />

                {/* Subtle film grain (SVG noise) */}
                <svg
                    className="absolute inset-0 w-full h-full opacity-[0.06] mix-blend-overlay"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <filter id="cinegrain">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.9"
                            numOctaves="2"
                            stitchTiles="stitch"
                        />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#cinegrain)" />
                </svg>
            </div>

            {/* Decorative blobs sa background (above logo, below content) */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none z-[1]" />
            <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none z-[1]" />
            <div className="absolute right-1/3 top-0 w-32 h-32 bg-purple-400/15 rounded-full blur-2xl pointer-events-none z-[1]" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* LEFT — Welcome greeting */}
                <div className="space-y-3 flex-1 min-w-0">
                    {/* Top badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-yellow-400 to-amber-400 text-blue-950 shadow-md shadow-yellow-500/20 flex items-center gap-1.5 border border-yellow-300/50">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-950" /> Active Group
                        </span>

                        {role && (
                            <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-sm flex items-center gap-1.5 capitalize">
                                <User className="w-3.5 h-3.5 text-yellow-300" /> {roleLabel}
                            </span>
                        )}

                        <span className="px-3 py-1 rounded-xl text-xs font-medium bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-sm flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-yellow-300" /> {today}
                        </span>
                    </div>

                    {/* Welcome heading */}
                    <div>
                        <p className="text-sm text-blue-100/90 font-medium flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
                            {getGreeting()},
                        </p>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mt-1 leading-tight drop-shadow-sm">
                            Welcome, <span className="text-yellow-300 drop-shadow">{fullName}</span>!
                        </h1>
                        <p className="text-sm text-blue-100/80 mt-1.5 max-w-xl">
                            Here's an overview of your academic group activity and progress.
                        </p>
                    </div>
                </div>

    
            </div>
        </div>
    );
};

export default UserDashboardBanner;