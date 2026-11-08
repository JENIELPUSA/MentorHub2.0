import { useContext, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import socket from "../../../socket.js";
import { SectionContext } from "../../contexts/SectionContext/SectionContext.jsx";
import {
    SOCKET_EVENTS,
    registerSectionSocketHandlers,
} from "./socketSection/socketSection.jsx";
import {
    registerNotificationSocketHandlers,
} from "./socketSection/socketNotification.jsx";
import {
    registerDefenseSocketHandlers,
} from "./socketSection/socketDefense.jsx";
import { NotificationContext } from "../../contexts/NotificationContext/NotificationContext.jsx";
import { GroupContext } from "../../contexts/GroupNameContext/GroupNameContext.jsx";

const SocketListener = () => {
    const { role, userId } = useAuth();
    const { fetchSections } = useContext(SectionContext);
    const { getGroupForDefense } = useContext(GroupContext);  // ✅ kunin

    // 🔥 Kunin lahat ng kailangan mula sa NotificationContext
    const {
        setNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useContext(NotificationContext);

    // =========================================================
    // CONNECTION LIFECYCLE
    // =========================================================
    useEffect(() => {
        if (!userId || !role) return;

        if (!socket.connected) socket.connect();

        const handleConnect = () => {
            console.log("[Socket] ✅ Connected:", socket.id);
            socket.emit(SOCKET_EVENTS.REGISTER_USER, userId, role);
        };
        const handleDisconnect = (reason) => {
            console.log("[Socket] ❌ Disconnected:", reason);
        };
        const handleConnectError = (err) => {
            console.error("[Socket] ❌ CONNECT_ERROR:", err?.message);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);

        if (socket.connected) {
            socket.emit(SOCKET_EVENTS.REGISTER_USER, userId, role);
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
        };
    }, [userId, role]);

    // =========================================================
    // SECTION LISTENERS
    // =========================================================
    useEffect(() => {
        if (!userId || !role) return;

        const cleanup = registerSectionSocketHandlers({
            userId,
            role,
            fetchSections,
            notify: ({ type, message }) => {
                console.log("[Socket] Section update:", type, message);
            },
        });

        return cleanup;
    }, [userId, role, fetchSections]);

    // =========================================================
    // 🔔 NOTIFICATION LISTENERS — SPECIFIC USER LANG
    // =========================================================
    useEffect(() => {
        if (!userId || !role) return;

        console.log("[SocketListener] 🔔 Registering notification handlers for user:", userId);

        const cleanup = registerNotificationSocketHandlers({
            socket,

            onNotification: (notif) => {
                console.log("[SocketListener] 🔔 onNotification →", notif);

                if (typeof addNotification === "function") {
                    addNotification(notif);
                } else if (typeof setNotifications === "function") {
                    setNotifications((prev) => {
                        if (!Array.isArray(prev)) return [notif];
                        if (notif?._id && prev.some((n) => n._id === notif._id)) {
                            return prev;
                        }
                        return [notif, ...prev];
                    });
                } else {
                    console.warn("[SocketListener] ⚠️ Walang addNotification/setNotifications sa context");
                }
            },

            onRead: (payload) => {
                console.log("[SocketListener] ✅ onRead →", payload);
                if (typeof markAsRead === "function") {
                    markAsRead(payload?.notificationId);
                }
            },

            onAllRead: () => {
                console.log("[SocketListener] ✅ onAllRead");
                if (typeof markAllAsRead === "function") {
                    markAllAsRead();
                }
            },

            onDeleted: (payload) => {
                console.log("[SocketListener] 🗑️ onDeleted →", payload);
                if (typeof deleteNotification === "function") {
                    deleteNotification(payload?.notificationId);
                }
            },
        });

        return cleanup;
    }, [
        userId,
        role,
        addNotification,
        setNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    ]);

    // =========================================================
    // 🛡️ DEFENSE LISTENERS — CRUD only
    // =========================================================
    useEffect(() => {
        if (!userId || !role) return;

        console.log("[SocketListener] 🛡️ Registering defense handlers for user:", userId);

        const cleanup = registerDefenseSocketHandlers({
            userId,
            role,
            getGroupForDefense,  // ✅ ito lang — walang fetchDefenses
            notify: ({ type, message }) => {
                console.log("[SocketListener] 🛡️ Defense update:", type, message);
            },
        });

        return cleanup;
    }, [userId, role, getGroupForDefense]);

    return null;
};

export default SocketListener;