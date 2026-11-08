import { createContext, useState, useCallback, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { authToken, user } = useContext(AuthContext);

    const BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;
    const userId = user?._id || "6a8cadef8328c34dffc6f620";

    const authHeaders = useMemo(
        () => ({ Authorization: `Bearer ${authToken}` }),
        [authToken]
    );

    // ==========================================
    // DISPLAY NOTIFICATIONS (SHOW ALL / HIDE ALL)
    // ==========================================
    const displayNotifications = useCallback(async ({ showAll = false, hideAll = false } = {}) => {
        try {
            setIsLoading(true);

            let url = `${BASE_URL}/api/v1/notifications`;

            if (showAll) {
                url += `?showAll=true`;
            } else if (hideAll) {
                url += `?hideAll=true`;
            }

            const res = await axios.get(url, { headers: authHeaders });

            if (res.data?.success) {
                if (hideAll) {
                    setNotifications(prev =>
                        prev.map(notif => ({ ...notif, isRead: true }))
                    );
                    setUnreadCount(0);
                } else {
                    setNotifications(res.data.data.notifications);
                    setUnreadCount(res.data.data.unreadCount || 0);
                }

                return {
                    success: true,
                    data: res.data.data,
                    message: res.data.message
                };
            }

            return { success: false };
        } catch (error) {
            console.error("Display Notifications Error:", error);
            return {
                success: false,
                error: error.response?.data?.message || "Error processing notification display",
            };
        } finally {
            setIsLoading(false);
        }
    }, [BASE_URL, authHeaders]);

    // ==========================================
    // 🆕 ADD NOTIFICATION (galing sa socket)
    // ==========================================
    const addNotification = useCallback((notif) => {
        console.log("[NotificationContext] ➕ addNotification:", notif);

        if (!notif) return;

        setNotifications((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            // dedupe by _id
            if (notif?._id && list.some((n) => n._id === notif._id)) {
                console.log("[NotificationContext] ⚠️ Duplicate — skip:", notif._id);
                return list;
            }
            return [notif, ...list];
        });

        // Increment unread count kung hindi pa read
        if (!notif.isRead) {
            setUnreadCount((c) => c + 1);
        }
    }, []);

    // ==========================================
    // ✅ MARK ONE AS READ (with backend sync)
    // ==========================================
    const markAsRead = useCallback(async (notificationId) => {
        console.log("[NotificationContext] ✅ markAsRead:", notificationId);

        if (!notificationId) return { success: false };

        // ---------- Optimistic update ----------
        let prevSnapshot = null;
        setNotifications((prev) => {
            prevSnapshot = prev;
            return prev.map((n) =>
                n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
            );
        });
        setUnreadCount((c) => Math.max(0, c - 1));

        try {
            const res = await axios.patch(
                `${BASE_URL}/api/v1/notifications/${notificationId}/mark-read`,
                {},
                { headers: authHeaders }
            );

            if (!res.data?.success) {
                throw new Error(res.data?.message || "Failed to mark as read");
            }

            // Sync unread count from backend (authoritative)
            if (typeof res.data?.data?.unreadCount === "number") {
                setUnreadCount(res.data.data.unreadCount);
            }

            return { success: true, data: res.data.data };
        } catch (error) {
            console.error("Mark As Read Error:", error);

            // ---------- Rollback on failure ----------
            if (prevSnapshot) setNotifications(prevSnapshot);
            setUnreadCount((c) => c + 1);

            return {
                success: false,
                error: error.response?.data?.message || error.message || "Failed to mark as read",
            };
        }
    }, [BASE_URL, authHeaders]);

    // ==========================================
    // ✅ MARK ALL AS READ (with backend sync)
    // ==========================================
    const markAllAsRead = useCallback(async () => {
        console.log("[NotificationContext] ✅ markAllAsRead");

        // ---------- Optimistic update ----------
        let prevSnapshot = null;
        setNotifications((prev) => {
            prevSnapshot = prev;
            return prev.map((n) => ({ ...n, isRead: true }));
        });
        const prevUnread = unreadCount;
        setUnreadCount(0);

        try {
            const res = await axios.patch(
                `${BASE_URL}/api/v1/notifications/mark-all-read`,
                {},
                { headers: authHeaders }
            );

            if (!res.data?.success) {
                throw new Error(res.data?.message || "Failed to mark all as read");
            }

            if (typeof res.data?.data?.unreadCount === "number") {
                setUnreadCount(res.data.data.unreadCount);
            }

            return { success: true, data: res.data.data };
        } catch (error) {
            console.error("Mark All As Read Error:", error);

            // ---------- Rollback on failure ----------
            if (prevSnapshot) setNotifications(prevSnapshot);
            setUnreadCount(prevUnread);

            return {
                success: false,
                error: error.response?.data?.message || error.message || "Failed to mark all as read",
            };
        }
    }, [BASE_URL, authHeaders, unreadCount]);

    // ==========================================
    // 🆕 DELETE NOTIFICATION
    // ==========================================
    const deleteNotification = useCallback((notificationId) => {
        console.log("[NotificationContext] 🗑️ deleteNotification:", notificationId);

        if (!notificationId) return;

        setNotifications((prev) => {
            const target = prev.find((n) => n._id === notificationId);
            if (target && !target.isRead) {
                setUnreadCount((c) => Math.max(0, c - 1));
            }
            return prev.filter((n) => n._id !== notificationId);
        });
    }, []);

    // ==========================================
    // INITIAL FETCH
    // ==========================================
    useEffect(() => {
        if (authToken && userId) {
            displayNotifications({});
        }
    }, [displayNotifications, authToken, userId]);

    // ==========================================
    // CONTEXT VALUE
    // ==========================================
    const value = useMemo(
        () => ({
            notifications,
            unreadCount,
            isLoading,
            displayNotifications,
            setNotifications,       // expose para sa fallback
            addNotification,
            markAsRead,             // now async + backend-synced
            markAllAsRead,          // now async + backend-synced
            deleteNotification,
        }),
        [
            notifications,
            unreadCount,
            isLoading,
            displayNotifications,
            addNotification,
            markAsRead,
            markAllAsRead,
            deleteNotification,
        ]
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};