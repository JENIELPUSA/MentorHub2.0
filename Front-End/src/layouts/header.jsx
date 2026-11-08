import {
    Bell, X, FileText, CheckCircle, AlertCircle,
    Clock, Users, LogOut, Lock, ArrowLeftRight, CheckCheck,
} from "lucide-react";
import PropTypes from "prop-types";
import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { NotificationContext } from "../contexts/NotificationContext/NotificationContext";
import ChangePassword from "../components/Login/UpdatePassword";
import ConfirmationModal from "../components/ReusableFolder/ConfirmationModal";
import { useAuth } from "../contexts/AuthContext";

export const Header = () => {
    const { logout, role, email, first_name, last_name, switchRole } = useAuth();
    const navigate = useNavigate();

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isSwitchingRole, setIsSwitchingRole] = useState(false);
    const [isSwitchConfirmOpen, setIsSwitchConfirmOpen] = useState(false);
    const [switchError, setSwitchError] = useState(null);

    const [markingIds, setMarkingIds] = useState(() => new Set());
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    const profileRef = useRef(null);
    const notificationRef = useRef(null);

    const dummyProfile = {
        firstName: "Juan",
        lastName: "Dela Cruz",
        email: "juan.delacruz@example.com",
        image: "https://i.pravatar.cc/150?img=12",
    };

    const displayFirstName = first_name || dummyProfile.firstName;
    const displayLastName = last_name || dummyProfile.lastName;
    const displayEmail = email || dummyProfile.email;
    const displayImage = dummyProfile.image;

    const {
        notifications = [],
        unreadCount = 0,
        isLoading = false,
        displayNotifications,
        markAsRead,
        markAllAsRead,
    } = useContext(NotificationContext) || {};

    const roleLower = String(role || "").toLowerCase();
    const isSwitchableRole = roleLower === "adviser" || roleLower === "panelist";
    const targetRole = roleLower === "adviser" ? "panelist" : "adviser";

    // ---- Click-outside for profile ----
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ---- Click-outside for notifications ----
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setIsNotificationOpen(false);
            }
        };
        if (isNotificationOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isNotificationOpen]);

    const handleToggle = () => setIsNotificationOpen((v) => !v);

    const handleHideAll = async () => {
        if (displayNotifications) {
            await displayNotifications({ hideAll: true });
            setIsNotificationOpen(false);
        }
    };

    const handleRefresh = async () => {
        if (displayNotifications) await displayNotifications({});
    };

    const handleMarkAllAsRead = async () => {
        if (!markAllAsRead || isMarkingAll) return;
        setIsMarkingAll(true);
        try {
            const res = await markAllAsRead();
            if (!res?.success) {
                console.warn("[Header] markAllAsRead failed:", res?.error);
            }
        } finally {
            setIsMarkingAll(false);
        }
    };

    const handleMarkOneAsRead = async (e, notificationId) => {
        e?.stopPropagation();
        if (!markAsRead || !notificationId) return;
        if (markingIds.has(notificationId)) return;

        setMarkingIds((prev) => {
            const next = new Set(prev);
            next.add(notificationId);
            return next;
        });

        try {
            const res = await markAsRead(notificationId);
            if (!res?.success) {
                console.warn("[Header] markAsRead failed:", res?.error);
            }
        } finally {
            setMarkingIds((prev) => {
                const next = new Set(prev);
                next.delete(notificationId);
                return next;
            });
        }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.isRead && markAsRead) {
            markAsRead(notif._id).catch?.((err) => {
                console.warn("[Header] markAsRead failed:", err);
            });
        }
        if (notif.actionUrl) {
            navigate(notif.actionUrl);
            setIsNotificationOpen(false);
        }
    };

    const handleChangePassword = () => {
        setIsProfileOpen(false);
        setIsChangePasswordOpen(true);
    };

    const handleLogout = () => {
        setIsProfileOpen(false);
        logout();
    };

    const handleCloseChangePassword = () => setIsChangePasswordOpen(false);

    const handleSwitchRoleClick = () => {
        if (!targetRole || isSwitchingRole) return;
        setIsProfileOpen(false);
        setSwitchError(null);
        setIsSwitchConfirmOpen(true);
    };

    const handleConfirmSwitch = async () => {
        if (!targetRole) return;

        setIsSwitchingRole(true);
        setSwitchError(null);

        try {
            const result = await switchRole(targetRole);

            if (result.success) {
                setIsSwitchConfirmOpen(false);
                setIsSwitchingRole(false);
                setTimeout(() => logout(), 150);
                return;
            }

            setSwitchError(result.message || "Failed to switch role.");
        } catch (err) {
            setSwitchError(err.message || "Something went wrong.");
        } finally {
            setIsSwitchingRole(false);
        }
    };

    const handleCancelSwitch = () => {
        if (isSwitchingRole) return;
        setIsSwitchConfirmOpen(false);
        setSwitchError(null);
    };

    const getTypeIcon = (title) => {
        if (title?.includes("Approved")) return <CheckCircle size={14} />;
        if (title?.includes("Rejected")) return <AlertCircle size={14} />;
        if (title?.includes("Updated") || title?.includes("Revision")) return <Clock size={14} />;
        if (title?.includes("Comment")) return <Users size={14} />;
        return <FileText size={14} />;
    };

    const getTypeColor = (title) => {
        if (title?.includes("Approved")) return "bg-emerald-500";
        if (title?.includes("Rejected")) return "bg-rose-500";
        if (title?.includes("Updated") || title?.includes("Revision")) return "bg-amber-500";
        if (title?.includes("Comment")) return "bg-violet-500";
        return "bg-blue-500";
    };

    const getPriorityColor = (priority) => {
        const colors = {
            High: "text-rose-600",
            Normal: "text-blue-600",
            Low: "text-slate-500",
            Urgent: "text-rose-700",
        };
        return colors[priority] || "text-slate-500";
    };

    const getTimeAgo = (dateString) => {
        if (!dateString) return "Just now";
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((new Date() - date) / (1000 * 60));
        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
        return date.toLocaleDateString();
    };

    const roleBadgeColor =
        roleLower === "panelist"
            ? "bg-violet-50 text-violet-700 ring-violet-200"
            : roleLower === "adviser"
              ? "bg-amber-50 text-amber-700 ring-amber-200"
              : "bg-slate-50 text-slate-600 ring-slate-200";

    const confirmMessage = switchError
        ? `❌ ${switchError}`
        : `Are you sure you want to switch from "${roleLower}" to "${targetRole}"? You will be logged out and need to log in again with the new role.`;

    const hasUnread = unreadCount > 0;

    return (
        <>
            <header className="relative z-30 flex h-16 items-center justify-end border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md transition-colors">
                <div className="flex items-center gap-1.5">

                    {/* ───────── Role badge + switch ───────── */}
                    {role && (
                        <div className="mr-1 hidden items-center gap-2 sm:flex">
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${roleBadgeColor}`}
                            >
                                {roleLower}
                            </span>

                            {isSwitchableRole && (
                                <button
                                    onClick={handleSwitchRoleClick}
                                    disabled={isSwitchingRole}
                                    className="group inline-flex items-center gap-1.5 rounded-full border border-blue-900 bg-blue-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:bg-blue-950 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                                >
                                    <ArrowLeftRight
                                        size={12}
                                        className={isSwitchingRole ? "animate-spin" : "transition-transform group-hover:rotate-180"}
                                    />
                                    <span className="capitalize">
                                        {isSwitchingRole ? "Switching…" : `Switch to ${targetRole}`}
                                    </span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* ───────── Divider ───────── */}
                    <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

                    {/* ───────── Notifications ───────── */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={handleToggle}
                            title="Notifications"
                            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                            aria-expanded={isNotificationOpen}
                            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                            {isLoading && (
                                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                                </span>
                            )}
                        </button>

                        {isNotificationOpen && (
                            <div
                                role="menu"
                                className="absolute right-0 mt-2 z-50 w-[380px] origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-150"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Notifications
                                        </h3>
                                        {unreadCount > 0 && (
                                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setIsNotificationOpen(false)}
                                        aria-label="Close notifications"
                                        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                {/* Quick actions bar */}
                                <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-2 text-[11px]">
                                    {hasUnread && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            disabled={isMarkingAll}
                                            className="inline-flex items-center gap-1 font-semibold text-blue-600 transition-colors hover:text-blue-800 focus:outline-none focus-visible:underline disabled:cursor-wait disabled:opacity-50"
                                        >
                                            <CheckCheck size={12} className={isMarkingAll ? "animate-pulse" : ""} />
                                            {isMarkingAll ? "Marking…" : "Mark all read"}
                                        </button>
                                    )}
                                    {hasUnread && (
                                        <>
                                            <span className="h-3 w-px bg-slate-200" />
                                            <button
                                                onClick={handleHideAll}
                                                className="font-medium text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus-visible:underline"
                                            >
                                                Hide all
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={handleRefresh}
                                        className="ml-auto font-medium text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus-visible:underline"
                                    >
                                        Refresh
                                    </button>
                                </div>

                                {/* List */}
                                <div className="max-h-[380px] overflow-y-auto overscroll-contain">
                                    {isLoading ? (
                                        <div className="space-y-3 p-4">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="flex animate-pulse items-start gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-200" />
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="h-3 w-3/4 rounded bg-slate-200" />
                                                        <div className="h-2.5 w-full rounded bg-slate-100" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : !notifications || notifications.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                                <Bell size={20} className="text-slate-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">
                                                You're all caught up
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                No new notifications
                                            </p>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => {
                                            const isMarking = markingIds.has(notif._id);
                                            return (
                                                <button
                                                    key={notif._id || notif.id}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`group flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 ${
                                                        !notif.isRead ? "bg-blue-50/40" : ""
                                                    }`}
                                                >
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        <div
                                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm ${getTypeColor(
                                                                notif.title
                                                            )}`}
                                                        >
                                                            {getTypeIcon(notif.title)}
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p
                                                                className={`truncate text-sm ${
                                                                    !notif.isRead
                                                                        ? "font-semibold text-slate-900"
                                                                        : "font-medium text-slate-700"
                                                                }`}
                                                            >
                                                                {notif.title}
                                                            </p>
                                                            {!notif.isRead && (
                                                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                                                            )}
                                                        </div>
                                                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                                                            {notif.message}
                                                        </p>
                                                        <div className="mt-1.5 flex items-center gap-2">
                                                            <span className="text-[10px] font-medium text-slate-400">
                                                                {getTimeAgo(notif.createdAt)}
                                                            </span>
                                                            {notif.priority && (
                                                                <span
                                                                    className={`text-[10px] font-semibold ${getPriorityColor(
                                                                        notif.priority
                                                                    )}`}
                                                                >
                                                                    • {notif.priority}
                                                                </span>
                                                            )}
                                                            {!notif.isRead && (
                                                                <span
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    onClick={(e) => handleMarkOneAsRead(e, notif._id)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter" || e.key === " ") {
                                                                            e.preventDefault();
                                                                            handleMarkOneAsRead(e, notif._id);
                                                                        }
                                                                    }}
                                                                    className="ml-auto inline-flex cursor-pointer items-center gap-1 text-[10px] font-semibold text-blue-600 opacity-0 transition-opacity hover:text-blue-800 focus:opacity-100 focus:outline-none group-hover:opacity-100"
                                                                >
                                                                    <CheckCircle
                                                                        size={10}
                                                                        className={isMarking ? "animate-pulse" : ""}
                                                                    />
                                                                    {isMarking ? "Marking…" : "Mark read"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Footer */}
                                {notifications && notifications.length > 0 && !isLoading && (
                                    <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-center">
                                        <button
                                            onClick={() =>
                                                displayNotifications && displayNotifications({ showAll: true })
                                            }
                                            className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800 focus:outline-none focus-visible:underline"
                                        >
                                            View all notifications
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ───────── Divider ───────── */}
                    <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

                    {/* ───────── Profile ───────── */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileOpen((v) => !v)}
                            title="Profile menu"
                            aria-label="Profile menu"
                            aria-expanded={isProfileOpen}
                            className="group inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 transition-all hover:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                            <img
                                src={displayImage}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        </button>

                        {isProfileOpen && (
                            <div
                                role="menu"
                                className="absolute right-0 mt-2 z-50 w-64 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-150"
                            >
                                {/* Profile header */}
                                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                                    <img
                                        src={displayImage}
                                        alt="Profile"
                                        className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                            {displayFirstName} {displayLastName}
                                        </p>
                                        <p className="truncate text-xs text-slate-500">
                                            {displayEmail}
                                        </p>
                                    </div>
                                </div>

                                {/* Role section */}
                                {role && (
                                    <div className="border-b border-slate-100 px-4 py-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-medium text-slate-500">
                                                Current role
                                            </span>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${roleBadgeColor}`}
                                            >
                                                {roleLower}
                                            </span>
                                        </div>

                                        {isSwitchableRole && (
                                            <button
                                                onClick={handleSwitchRoleClick}
                                                disabled={isSwitchingRole}
                                                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-900 bg-blue-900 px-3 py-2 text-xs font-semibold capitalize text-white shadow-sm transition-all hover:bg-blue-950 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                                            >
                                                <ArrowLeftRight
                                                    size={13}
                                                    className={isSwitchingRole ? "animate-spin" : ""}
                                                />
                                                <span>
                                                    {isSwitchingRole ? "Switching…" : `Switch to ${targetRole}`}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="p-1">
                                    <button
                                        onClick={handleChangePassword}
                                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:bg-slate-100"
                                    >
                                        <Lock size={15} className="text-slate-400" />
                                        <span>Change password</span>
                                    </button>
                                </div>

                                <div className="border-t border-slate-100 p-1">
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 focus:outline-none focus-visible:bg-rose-50"
                                    >
                                        <LogOut size={15} />
                                        <span>Log out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <ChangePassword isOpen={isChangePasswordOpen} onClose={handleCloseChangePassword} />

            <ConfirmationModal
                isOpen={isSwitchConfirmOpen}
                onClose={handleCancelSwitch}
                onConfirm={handleConfirmSwitch}
                title={switchError ? "Switch Failed" : "Switch Role?"}
                message={confirmMessage}
                confirmText={
                    switchError ? "Try Again" : isSwitchingRole ? "Switching…" : "Switch & Logout"
                }
                cancelText="Cancel"
                isLoading={isSwitchingRole}
                variant={switchError ? "danger" : "info"}
                confirmIcon={<ArrowLeftRight className="w-4 h-4" />}
            />
        </>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
};

Header.defaultProps = {
    collapsed: false,
    setCollapsed: null,
};