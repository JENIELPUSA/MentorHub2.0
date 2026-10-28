import { forwardRef, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";

import { navbarLinks } from "@/constants";

import logoLight from "@/assets/logo-light.svg";
import logoDark from "../assets/bipsulogo.png";

import { cn } from "@/utils/cn";
import { useAuth } from "../contexts/AuthContext";

import PropTypes from "prop-types";

export const Sidebar = forwardRef(({ collapsed, onLogout }, ref) => {
    const { logout, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        if (onLogout) {
            await onLogout();
        }
        logout();
        navigate("/login");
    };

    // Dapat tugma ang paths dito sa navbarLinks at sa App.jsx routes
    const rolePermissions = {
        admin: [
            "/dashboard",
            "/dashboard/Add-User",
            "/dashboard/Add-Subject",
            "/dashboard/archived",
            "/dashboard/logs-audit", "/dashboard/my-researchGroups","/dashboard/proposedTopics", "/dashboard/defense-calendar","/dashboard/propose-title",
            
        ],
        panelist: [
            "/dashboard",
            "/dashboard/my-researchGroups",
            "/dashboard/defense-calendar", "/dashboard/proposedTopics",
        ],
        subject_instructor: [
            "/dashboard",
            "/dashboard/Add-User",
            "/dashboard/Add-Subject",
            "/dashboard/defense_schedule",
            "/dashboard/archived", "/dashboard/propose-title"
        ],
        student: [
            "/dashboard",
            "/dashboard/myproject",
            "/dashboard/manuscript-upload"
        ],
        adviser: [
            "/dashboard",
            "/dashboard/defense_schedule",
            "/dashboard/archived","/dashboard/propose-title"
          
        ],
    };

    const allowedPaths = rolePermissions[role] ?? [];
    const isAllowed = (path) => allowedPaths.includes(path);

    const isLinkActive = (path) => {
        if (path === "/dashboard") {
            return location.pathname === "/dashboard";
        }
        return (
            location.pathname === path ||
            location.pathname.startsWith(path + "/")
        );
    };

    return (
        <aside
            ref={ref}
            className={cn(
                // ⭐ BLUE THEME: dark blue gradient background
                "fixed z-[100] flex h-full w-[240px] flex-col overflow-hidden",
                "bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900",
                "border-r border-blue-700/50 shadow-xl",
                "[transition:_width_300ms_cubic-bezier(0.4,_0,_0.2,_1),_left_300ms_cubic-bezier(0.4,_0,_0.2,_1)]",
                collapsed ? "md:w-[70px] md:items-center" : "md:w-[240px]",
                collapsed ? "max-md:-left-full" : "max-md:left-0"
            )}
        >
            {/* ═══════════════════════════════════════════════════ */}
            {/* 🎬 CINEMATIC BACKGROUND — BIPSU LOGO (ghost)      */}
            {/* ═══════════════════════════════════════════════════ */}
            <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none select-none z-0"
            >
                {/* Main ghost logo — malaki, nasa gitna, naka-rotate */}
                <img
                    src={logoDark}
                    alt=""
                    draggable="false"
                    className="
                        absolute
                        left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[280px] h-[280px]
                        object-contain
                        opacity-[0.07]
                        mix-blend-screen
                        rotate-[-12deg]
                        blur-[0.5px]
                    "
                    style={{
                        filter:
                            'drop-shadow(0 0 60px rgba(255,255,255,0.35)) brightness(2.4) saturate(0.3)',
                    }}
                />

                {/* Secondary ghost — mas maliit, sa ibaba, mirrored */}
                <img
                    src={logoDark}
                    alt=""
                    draggable="false"
                    className="
                        absolute
                        right-[-30%] bottom-[-10%]
                        w-[220px] h-[220px]
                        object-contain
                        opacity-[0.05]
                        mix-blend-screen
                        rotate-[18deg]
                        blur-[2px]
                    "
                    style={{
                        filter: 'brightness(2.5) saturate(0.2)',
                    }}
                />

                {/* Cinematic spotlight — top-center glow */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(circle at 50% 15%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 30%, rgba(0,0,0,0) 60%)',
                    }}
                />

                {/* Vignette — edge darkening */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(10,15,40,0.55) 100%)',
                    }}
                />

                {/* Film grain */}
                <svg
                    className="absolute inset-0 w-full h-full opacity-[0.05] mix-blend-overlay"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <filter id="sidebar-grain">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.9"
                            numOctaves="2"
                            stitchTiles="stitch"
                        />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#sidebar-grain)" />
                </svg>
            </div>

            {/* ═══════════════════════════════════════════════════ */}
            {/* ⭐ LOGO HEADER — TEXT ONLY, CENTERED                */}
            {/* ═══════════════════════════════════════════════════ */}
            <div className="relative z-10 flex items-center justify-center p-3 border-b border-blue-700/40">
                {!collapsed ? (
                    <p className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-300 whitespace-nowrap">
                        BiPSU MentorHUB
                    </p>
                ) : (
                    <p className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-300">
                        M
                    </p>
                )}
            </div>

            {/* Navigation Links */}
            <div className="relative z-10 flex flex-1 w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden p-3 [scrollbar-width:_thin] scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-transparent">
                {navbarLinks.map((navbarLink) => {
                    const visibleLinks = navbarLink.links.filter((link) =>
                        isAllowed(link.path)
                    );

                    if (visibleLinks.length === 0) return null;

                    return (
                        <nav
                            key={navbarLink.title}
                            className={cn("sidebar-group", collapsed && "md:items-center")}
                        >
                            <p
                                className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider text-blue-300 mb-2 px-1",
                                    collapsed && "md:w-[45px] md:text-center md:text-[8px]"
                                )}
                            >
                                {navbarLink.title}
                            </p>
                            {visibleLinks.map((link) => {
                                const active = isLinkActive(link.path);

                                return (
                                    <NavLink
                                        key={link.label}
                                        to={link.path}
                                        className={cn(
                                            "flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium text-blue-100 transition-all duration-200",
                                            "hover:bg-blue-700/60 hover:text-white",
                                            active &&
                                            "bg-amber-400 text-blue-900 shadow-[0_4px_12px_rgba(251,191,36,0.35)] hover:bg-amber-300 hover:text-blue-900",
                                            collapsed && "md:w-[45px] md:justify-center md:px-0"
                                        )}
                                    >
                                        <link.icon
                                            size={22}
                                            className="flex-shrink-0"
                                        />
                                        {!collapsed && (
                                            <p className="whitespace-nowrap">{link.label}</p>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </nav>
                    );
                })}
            </div>

            {/* Logout button */}
            {!collapsed && (
                <div className="relative z-10 p-3 border-t border-blue-700/40">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium text-blue-100 transition-all duration-200 hover:bg-red-500/80 hover:text-white"
                    >
                        <LogOut size={22} className="flex-shrink-0" />
                        <p className="whitespace-nowrap">Logout</p>
                    </button>
                </div>
            )}
        </aside>
    );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapsed: PropTypes.bool,
    onLogout: PropTypes.func,
};