import { forwardRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { navbarLinks } from "@/constants";

import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";

import { cn } from "@/utils/cn";
import { useAuth } from "../contexts/AuthContext";

import PropTypes from "prop-types";

export const Sidebar = forwardRef(({ collapsed, onLogout }, ref) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        if (onLogout) {
            await onLogout();
        }
        logout();
        navigate("/login");
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
                {navbarLinks.map((navbarLink) => (
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
                        {navbarLink.links.map((link) => (
                            <NavLink
                                key={link.label}
                                to={link.path}
                                className={({ isActive }) =>
                                    cn(
                                        // Default text and hover state (Blue text with Yellow/Amber accent background on hover)
                                        "flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-amber-50 hover:text-amber-600",
                                        // Active state (BiPSU Blue background with bright yellow text & custom soft shadow)
                                        isActive &&
                                            "bg-blue-700 text-yellow-300 shadow-[0_4px_12px_rgba(29,78,216,0.25)] hover:bg-blue-800 hover:text-yellow-300",
                                        collapsed && "md:w-[45px] md:justify-center md:px-0"
                                    )
                                }
                            >
                                <link.icon
                                    size={22}
                                    className="flex-shrink-0"
                                />
                                {!collapsed && <p className="whitespace-nowrap">{link.label}</p>}
                            </NavLink>
                        ))}
                    </nav>
                ))}
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
                    {!collapsed && <p className="whitespace-nowrap font-medium">Logout</p>}
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