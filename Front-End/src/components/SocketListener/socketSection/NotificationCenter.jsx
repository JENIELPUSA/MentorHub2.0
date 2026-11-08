// components/SocketListener/NotificationCenter.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

// =========================================================
// VARIANT STYLES
// =========================================================
const VARIANT_STYLES = {
    success: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        textColor: "text-emerald-900",
        Icon: CheckCircle2,
    },
    error: {
        bg: "bg-rose-50",
        border: "border-rose-200",
        iconBg: "bg-rose-100",
        iconColor: "text-rose-600",
        textColor: "text-rose-900",
        Icon: AlertCircle,
    },
    warning: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        textColor: "text-amber-900",
        Icon: AlertTriangle,
    },
    info: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        textColor: "text-blue-900",
        Icon: Info,
    },
};

// =========================================================
// GLOBAL EVENT BUS — para makapag-push kahit saan
// =========================================================
const listeners = new Set();

/**
 * Push notification from ANY component.
 * Usage: notify({ variant: "success", title: "...", message: "..." })
 */
export const notify = (notification) => {
    listeners.forEach((fn) => fn(notification));
};

/**
 * Shorthand helpers (optional, convenience)
 */
export const notifySuccess = (title, message) =>
    notify({ variant: "success", title, message });
export const notifyError = (title, message) =>
    notify({ variant: "error", title, message });
export const notifyWarning = (title, message) =>
    notify({ variant: "warning", title, message });
export const notifyInfo = (title, message) =>
    notify({ variant: "info", title, message });

// =========================================================
// COMPONENT
// =========================================================
export default function NotificationCenter({ maxVisible = 5, defaultDuration = 4000 }) {
    const [notifications, setNotifications] = useState([]);
    const idRef = useRef(0);

    // ---------------------------------------------------------
    // Remove
    // ---------------------------------------------------------
    const remove = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    // ---------------------------------------------------------
    // Add (via event bus)
    // ---------------------------------------------------------
    useEffect(() => {
        const handlePush = (notification) => {
            const id = ++idRef.current;
            const item = {
                id,
                variant: "info",
                duration: defaultDuration,
                ...notification,
            };

            setNotifications((prev) => {
                const next = [...prev, item];
                // Cap para hindi mag-overflow sa screen
                return next.slice(-maxVisible);
            });

            // Auto-dismiss
            setTimeout(() => remove(id), item.duration);
        };

        listeners.add(handlePush);
        return () => {
            listeners.delete(handlePush);
        };
    }, [remove, defaultDuration, maxVisible]);

    // ---------------------------------------------------------
    // Render
    // ---------------------------------------------------------
    if (!notifications.length) return null;

    return (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {notifications.map((n) => {
                const style = VARIANT_STYLES[n.variant] || VARIANT_STYLES.info;
                const { Icon } = style;

                return (
                    <div
                        key={n.id}
                        className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg ${style.bg} ${style.border} animate-[ncSlideIn_0.2s_ease-out]`}
                    >
                        <div className={`p-1.5 rounded-lg shrink-0 ${style.iconBg}`}>
                            <Icon className={`w-4 h-4 ${style.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            {n.title && (
                                <p className={`text-sm font-bold ${style.textColor}`}>
                                    {n.title}
                                </p>
                            )}
                            {n.message && (
                                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
                                    {n.message}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => remove(n.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition shrink-0"
                            aria-label="Dismiss"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
            <style jsx>{`
                @keyframes ncSlideIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}