// components/SocketListener/socketNotification/socketNotification.jsx

export const NOTIFICATION_EVENTS = {
  NEW: "notification:new",
  READ: "notification:read",
  ALL_READ: "notification:all-read",
  DELETED: "notification:deleted",
};

// =========================================================
// REGISTER HANDLERS
// =========================================================
export const registerNotificationSocketHandlers = ({
  socket,
  notify,
  onNotification,
  onRead,
  onAllRead,
  onDeleted,
}) => {
  if (!socket) {
    console.warn("[Socket] Walang socket instance — skip notification handlers");
    return () => {};
  }

  const handleNew = (notif) => {
    console.log("[Socket] 🔔 notification:new", notif);

    // 1. Toast
    if (typeof notify === "function") {
      notify({
        variant: mapTypeToVariant(notif.type),
        title: notif.title || "New Notification",
        message: notif.message || "",
      });
    }

    // 2. Update bell / list
    if (typeof onNotification === "function") {
      onNotification(notif);
    }

    // 3. Browser notification (optional)
    if (typeof window !== "undefined" && "Notification" in window) {
      if (window.Notification.permission === "granted") {
        try {
          new window.Notification(notif.title || "New Notification", {
            body: notif.message || "",
            icon: "/favicon.ico",
            tag: notif._id || notif.referenceId,
          });
        } catch (e) {
          // silent
        }
      }
    }
  };

  // ---------------------------------------------------------
  // ✅ READ
  // ---------------------------------------------------------
  const handleRead = (payload) => {
    console.log("[Socket] ✅ notification:read", payload);
    if (typeof onRead === "function") onRead(payload);
  };

  // ---------------------------------------------------------
  // ✅ ALL READ
  // ---------------------------------------------------------
  const handleAllRead = (payload) => {
    console.log("[Socket] ✅ notification:all-read", payload);
    if (typeof onAllRead === "function") onAllRead(payload);
  };

  // ---------------------------------------------------------
  // 🗑️ DELETED
  // ---------------------------------------------------------
  const handleDeleted = (payload) => {
    console.log("[Socket] 🗑️ notification:deleted", payload);
    if (typeof onDeleted === "function") onDeleted(payload);
  };

  socket.on(NOTIFICATION_EVENTS.NEW, handleNew);
  socket.on(NOTIFICATION_EVENTS.READ, handleRead);
  socket.on(NOTIFICATION_EVENTS.ALL_READ, handleAllRead);
  socket.on(NOTIFICATION_EVENTS.DELETED, handleDeleted);

  // ---------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------
  return () => {
    socket.off(NOTIFICATION_EVENTS.NEW, handleNew);
    socket.off(NOTIFICATION_EVENTS.READ, handleRead);
    socket.off(NOTIFICATION_EVENTS.ALL_READ, handleAllRead);
    socket.off(NOTIFICATION_EVENTS.DELETED, handleDeleted);
  };
};

// =========================================================
// HELPERS
// =========================================================
function mapTypeToVariant(type) {
  if (!type) return "info";
  const t = String(type).toLowerCase();
  if (t.includes("error") || t.includes("reject") || t.includes("fail")) return "error";
  if (t.includes("warning") || t.includes("reminder")) return "warning";
  if (t.includes("success") || t.includes("approv")) return "success";
  return "info";
}