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
            "/dashboard/propose-title",
            "/dashboard/archived",
            "/dashboard/logs-audit"
        ],
        panelist: [
            "/dashboard",
            "/dashboard/propose-title",
            "/dashboard/archived"
        ],
        subject_instructor: [
            "/dashboard",
            "/dashboard/Add-User",
            "/dashboard/Add-Subject",
            "/dashboard/propose-title",
            "/dashboard/defense_schedule",
            "/dashboard/archived"
        ],
        student: [
            "/dashboard",
            "/dashboard/propose-title",
        ],
        adviser: [
            "/dashboard",
            "/dashboard/propose-title",
            "/dashboard/defense_schedule",
            "/dashboard/archived"
        ],
    };

    // Get allowed paths for current role (fallback to empty array)
    const allowedPaths = rolePermissions[role] ?? [];

    // Helper to check if a link path is allowed
    const isAllowed = (path) => allowedPaths.includes(path);

    // - "/dashboard" → exact match lang (para hindi mag-active sa ibang routes)
    // - ibang paths → exact match o prefix match (para active pa rin sa sub-routes)
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
                "fixed z-[100] flex h-full w-[240px] flex-col overflow-x-hidden bg-white border-r border-slate-200 [transition:_width_300ms_cubic-bezier(0.4,_0,_0.2,_1),_left_300ms_cubic-bezier(0.4,_0,_0.2,_1)]",
                collapsed ? "md:w-[70px] md:items-center" : "md:w-[240px]",
                collapsed ? "max-md:-left-full" : "max-md:left-0"
            )}
        >
            {/* Logo Section */}
            <div className="flex gap-x-3 p-3 items-center">
                <img
                    src={logoDark}
                    alt="BiPSU Logo"
                    className="h-8 w-auto"
                />
                {!collapsed && (
                    <p className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-amber-500">
                        BiPSU MentorHUB
                    </p>
                )}
            </div>

            {/* Navigation Links */}
            <div className="flex flex-1 w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden p-3 [scrollbar-width:_thin] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {navbarLinks.map((navbarLink) => {
                    // Filter links based on role permission
                    const visibleLinks = navbarLink.links.filter((link) =>
                        isAllowed(link.path)
                    );

                    // Skip rendering the group if no links are visible
                    if (visibleLinks.length === 0) return null;

                    return (
                        <nav
                            key={navbarLink.title}
                            className={cn("sidebar-group", collapsed && "md:items-center")}
                        >
                            <p
                                className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1",
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
                                            // Default text and hover state
                                            "flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-amber-50 hover:text-amber-600",
                                            // Active state (BiPSU Blue background with bright yellow text)
                                            active &&
                                            "bg-blue-700 text-yellow-300 shadow-[0_4px_12px_rgba(29,78,216,0.25)] hover:bg-blue-800 hover:text-yellow-300",
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

            {/* Logout Section */}
            <div className="border-t border-slate-200 p-3 w-full">
                <button
                    onClick={handleLogout}
                    className={cn(
                        "flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 w-full",
                        collapsed && "md:w-[45px] md:justify-center md:px-0"
                    )}
                >
                    <LogOut size={22} className="flex-shrink-0" />
                    {!collapsed && (
                        <p className="whitespace-nowrap font-medium">Logout</p>
                    )}
                </button>
            </div>
        </aside>
    );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapsed: PropTypes.bool,
    onLogout: PropTypes.func,
};