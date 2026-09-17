import { useTheme } from "@/hooks/use-theme";
import { Bell, Moon, Sun, X, FileText, CheckCircle, AlertCircle, Clock, Users } from "lucide-react";
import profileImg from "@/assets/profile-image.jpg";
import PropTypes from "prop-types";
import { useContext, useState, useEffect } from "react";
import { NotificationContext } from "../contexts/NotificationContext/NotificationContext";

export const Header = () => {
    const { theme, setTheme } = useTheme();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const { 
        notifications = [], 
        unreadCount = 0, 
        isLoading = false, 
        displayNotifications 
    } = useContext(NotificationContext) || {};



    console.log("notifications",notifications)

    // Fetch unread notifications on mount
    useEffect(() => {
        if (displayNotifications) {
            displayNotifications({});
        }
    }, [displayNotifications]);

    const handleToggle = async () => {
        setIsNotificationOpen(!isNotificationOpen);
        if (!isNotificationOpen && displayNotifications) {
            // Show all notifications when opening
            await displayNotifications({ showAll: true });
        }
    };

    const handleHideAll = async () => {
        if (displayNotifications) {
            await displayNotifications({ hideAll: true });
            setIsNotificationOpen(false);
        }
    };

    const handleRefresh = async () => {
        if (displayNotifications) {
            await displayNotifications({});
        }
    };

    const getTypeIcon = (title) => {
        if (title?.includes("Approved")) return <CheckCircle size={16} />;
        if (title?.includes("Rejected")) return <AlertCircle size={16} />;
        if (title?.includes("Updated")) return <Clock size={16} />;
        if (title?.includes("Comment")) return <Users size={16} />;
        return <FileText size={16} />;
    };

    const getTypeColor = (title) => {
        if (title?.includes("Approved")) return "bg-green-500";
        if (title?.includes("Rejected")) return "bg-red-500";
        if (title?.includes("Updated")) return "bg-yellow-500";
        if (title?.includes("Comment")) return "bg-purple-500";
        return "bg-blue-500";
    };

    const getPriorityColor = (priority) => {
        const colors = {
            "High": "text-red-500",
            "Normal": "text-blue-500",
            "Low": "text-gray-500",
            "Urgent": "text-red-600",
        };
        return colors[priority] || "text-gray-500";
    };

    const getTimeAgo = (dateString) => {
        if (!dateString) return "Just now";
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <header className="relative z-10 flex h-[60px] items-center justify-end bg-white px-4 shadow-md transition-colors dark:bg-slate-900">
            {/* RIGHT SIDE - Theme, Notifications, Profile */}
            <div className="flex items-center gap-x-3">
                {/* Theme Toggle */}
                <button
                    className="btn-ghost size-10"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                >
                    <Sun size={20} className="dark:hidden" />
                    <Moon size={20} className="hidden dark:block" />
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button
                        className="btn-ghost size-10 relative"
                        title="Notifications"
                        onClick={handleToggle}
                    >
                        <Bell size={20} />
                        {/* Notification Badge */}
                        {unreadCount > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                        {isLoading && (
                            <span className="absolute -right-1 -bottom-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotificationOpen && (
                        <div className="absolute right-0 mt-2 w-96 max-h-[500px] overflow-hidden rounded-lg bg-white shadow-xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        Notifications
                                    </h3>
                                    {unreadCount > 0 && (
                                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                            {unreadCount} unread
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleHideAll}
                                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Hide All
                                        </button>
                                    )}
                                    <button
                                        onClick={handleRefresh}
                                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                        title="Refresh"
                                    >
                                        Refresh
                                    </button>
                                    <button
                                        onClick={() => setIsNotificationOpen(false)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Notification List */}
                            <div className="max-h-[400px] overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : !notifications || notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                        <Bell size={40} className="text-slate-300 dark:text-slate-600 mb-2" />
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            No notifications
                                        </p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif._id || notif.id}
                                            className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-700/50 ${
                                                !notif.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                            }`}
                                        >
                                            {/* Type icon */}
                                            <div className="mt-1 flex-shrink-0">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(notif.title)} text-white`}>
                                                    {getTypeIcon(notif.title)}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                        {notif.title}
                                                    </p>
                                                    {!notif.isRead && (
                                                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-600" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                        {getTimeAgo(notif.createdAt)}
                                                    </span>
                                                    {notif.priority && (
                                                        <span className={`text-[10px] font-medium ${getPriorityColor(notif.priority)}`}>
                                                            • {notif.priority}
                                                        </span>
                                                    )}
                                                    {notif.actionUrl && (
                                                        <span className="text-[10px] text-blue-500 dark:text-blue-400">
                                                            • View
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            {notifications && notifications.length > 0 && !isLoading && (
                                <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 text-center">
                                    <button 
                                        onClick={() => displayNotifications && displayNotifications({ showAll: true })}
                                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        View all notifications
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Profile */}
                <button className="size-10 overflow-hidden rounded-full border-2 border-slate-200 dark:border-slate-700">
                    <img
                        src={profileImg}
                        alt="Profile image"
                        className="size-full object-cover"
                    />
                </button>
            </div>
        </header>
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