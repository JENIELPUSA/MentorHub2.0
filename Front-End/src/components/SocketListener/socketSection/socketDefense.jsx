import socket from "../../../../socket";

// =========================================================
// SOCKET EVENT CONSTANTS — defense-specific lang
// (REGISTER_USER, SEND_MESSAGE ay nasa SOCKET_EVENTS na)
// =========================================================
export const DEFENSE_SOCKET_EVENTS = {
    // Defense assignment CRUD events
    DEFENSE_CREATED: "defense:created",
    DEFENSE_UPDATED: "defense:updated",
    DEFENSE_DELETED: "defense:deleted",
    DEFENSE_CANCELLED: "defense:cancelled",
    ADMIN_DEFENSE_CREATED: "admin:defense:created",
    FACULTY_DEFENSE_CREATED: "faculty:defense:created",
    STUDENT_DEFENSE_CREATED: "student:defense:created",
};

// =========================================================
// NORMALIZE DEFENSE PAYLOAD
// =========================================================
export const normalizeDefensePayload = (payload) => {
    if (!payload) return null;

    // Support both direct payload and wrapped `data` payload
    const raw = payload?.data || payload || {};

    const assignmentId =
        raw?._id ||
        raw?.id ||
        raw?.assignmentId ||
        null;

    const groupIds = Array.isArray(raw?.groupIds)
        ? raw.groupIds
              .map((g) => (typeof g === "object" ? g._id || g.id : g))
              .filter(Boolean)
        : raw?.groupId
            ? [raw.groupId]
            : [];

    const panelistIds = Array.isArray(raw?.panelistIds)
        ? raw.panelistIds
              .map((p) => (typeof p === "object" ? p._id || p.id : p))
              .filter(Boolean)
        : raw?.panelistId
            ? [raw.panelistId]
            : [];

    return {
        assignmentId,
        // ✅ Idinagdag: para malaman kung saan galing (DefenseAssignment vs ProposedTitle)
        sourceType: raw?.sourceType || payload?.sourceType || "DefenseAssignment",

        // ✅ Idinagdag: proposed title fields (para sa UpdateProposedTitle emit)
        title: raw?.title || null,
        status: raw?.status || null,

        date: raw?.date || null,
        startTime: raw?.startTime || raw?.timeRange?.start || null,
        endTime: raw?.endTime || raw?.timeRange?.end || null,
        location: raw?.location || null,
        activityType: raw?.activityType || null,
        groupIds,
        panelistIds,
        createdBy: raw?.createdBy || payload?.createdBy || null,
        timestamp: payload?.timestamp || raw?.timestamp || new Date().toISOString(),
        raw: payload,
    };
};

// =========================================================
// REGISTER DEFENSE SOCKET HANDLERS
// Returns cleanup function.
// =========================================================
export const registerDefenseSocketHandlers = ({
    userId,
    role,
    getGroupForDefense,       // () => Promise<void> — refetch defense list
    notify,              // ({ type, message, data? }) => void — toast / in-app notification
    onDefenseCreated,    // (defense) => void — optional custom handler
    onDefenseUpdated,    // (defense) => void — optional
    onDefenseDeleted,    // (defense) => void — optional
    onDefenseCancelled,  // (defense) => void — optional
} = {}) => {
    // ---------------------------------------------------------
    // SAFE HELPERS
    // ---------------------------------------------------------
    const safeNotify = (type, message, data) => {
        if (typeof notify === "function") notify({ type, message, data });
    };

    const safeCall = (fn, ...args) => {
        if (typeof fn === "function") {
            try {
                return fn(...args);
            } catch (err) {
                console.error("[socketDefense] handler error:", err);
            }
        }
    };

    // =========================================================
    // ✅ SAFE FETCH — with retry kung "Fetch in progress"
    //    (ScheduleContext has fetchInProgress lock)
    // =========================================================
    const safeFetch = async (params, retryCount = 0) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY_MS = 500;

        if (typeof getGroupForDefense !== "function") {
            console.warn("⚠️  [socketDefense] getGroupForDefense is not a function");
            return;
        }

        try {
            const result = await getGroupForDefense(params);

            // ✅ Kung "Fetch in progress" (lock sa ScheduleContext), retry
            if (
                result &&
                !result.success &&
                result.error === "Fetch in progress" &&
                retryCount < MAX_RETRIES
            ) {
                console.log(
                    `⏳ [socketDefense] Fetch in progress, retrying in ${RETRY_DELAY_MS}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`
                );

                setTimeout(() => {
                    safeFetch(params, retryCount + 1);
                }, RETRY_DELAY_MS);

                return;
            }

            if (result && !result.success) {
                console.warn(
                    "⚠️  [socketDefense] getGroupForDefense failed:",
                    result.error
                );
            } else {
                console.log("✅ [socketDefense] getGroupForDefense successful");
            }
        } catch (err) {
            console.error("[socketDefense] getGroupForDefense error:", err);
        }
    };

    // ---------------------------------------------------------
    // DEFENSE CREATED
    // ---------------------------------------------------------
    const handleDefenseCreated = (payload) => {
        const n = normalizeDefensePayload(payload);

        console.log("[DEFENSE_CREATED]", {
            ...n,
            currentUser: userId,
            currentRole: role,
        });

        try {
            safeFetch();
            safeNotify(
                "defense-created",
                `New ${n?.activityType || "defense"} scheduled on ${n?.date || "TBD"}`
            );
            safeCall(onDefenseCreated, n);
        } catch (err) {
            console.error("[DEFENSE_CREATED] error:", err);
        }
    };

    // ---------------------------------------------------------
    // DEFENSE UPDATED
    // ---------------------------------------------------------
    const handleDefenseUpdated = (payload) => {
        const n = normalizeDefensePayload(payload);

        console.log("[DEFENSE_UPDATED]", {
            ...n,
            currentUser: userId,
            currentRole: role,
        });

        try {
            safeFetch();
            safeNotify(
                "defense-updated",
                `${n?.activityType || "Defense"} on ${n?.date || "TBD"} updated`
            );
            safeCall(onDefenseUpdated, n);
        } catch (err) {
            console.error("[DEFENSE_UPDATED] error:", err);
        }
    };

    // ---------------------------------------------------------
    // DEFENSE DELETED
    // ---------------------------------------------------------
    const handleDefenseDeleted = (payload) => {
        const n = normalizeDefensePayload(payload);

        console.log("[DEFENSE_DELETED]", {
            ...n,
            currentUser: userId,
            currentRole: role,
        });

        try {
            safeFetch();
            safeNotify(
                "defense-deleted",
                `${n?.activityType || "Defense"} on ${n?.date || "TBD"} deleted`
            );
            safeCall(onDefenseDeleted, n);
        } catch (err) {
            console.error("[DEFENSE_DELETED] error:", err);
        }
    };

    // ---------------------------------------------------------
    // DEFENSE CANCELLED
    // ---------------------------------------------------------
    const handleDefenseCancelled = (payload) => {
        const n = normalizeDefensePayload(payload);

        console.log("[DEFENSE_CANCELLED]", {
            ...n,
            currentUser: userId,
            currentRole: role,
        });

        try {
            safeFetch();
            safeNotify(
                "defense-cancelled",
                `${n?.activityType || "Defense"} on ${n?.date || "TBD"} was cancelled`
            );
            safeCall(onDefenseCancelled, n);
        } catch (err) {
            console.error("[DEFENSE_CANCELLED] error:", err);
        }
    };

    // ---------------------------------------------------------
    // ROLE-SPECIFIC BROADCASTS (optional)
    // ---------------------------------------------------------
    const handleAdminDefenseCreated = (payload) => {
        const n = normalizeDefensePayload(payload);
        console.log("[ADMIN_DEFENSE_CREATED]", {
            ...n,
            currentUser: userId,
            currentRole: role,
        });
        safeCall(onDefenseCreated, n);
    };

    const handleFacultyDefenseCreated = (payload) => {
        const n = normalizeDefensePayload(payload);
        console.log("[FACULTY_DEFENSE_CREATED]", {
            ...n,
            currentUser: userId,
            currentRole: role,
        });
        safeCall(onDefenseCreated, n);
    };

    const handleStudentDefenseCreated = (payload) => {
        const n = normalizeDefensePayload(payload);
        console.log("[STUDENT_DEFENSE_CREATED]", {
            ...n,
            currentUser: userId,
            currentRole: role,
        });
        safeCall(onDefenseCreated, n);
    };

    // ---------------------------------------------------------
    // REGISTER ALL LISTENERS
    // ---------------------------------------------------------
    socket.on(DEFENSE_SOCKET_EVENTS.DEFENSE_CREATED, handleDefenseCreated);
    socket.on(DEFENSE_SOCKET_EVENTS.DEFENSE_UPDATED, handleDefenseUpdated);
    socket.on(DEFENSE_SOCKET_EVENTS.DEFENSE_DELETED, handleDefenseDeleted);
    socket.on(DEFENSE_SOCKET_EVENTS.DEFENSE_CANCELLED, handleDefenseCancelled);
    socket.on(DEFENSE_SOCKET_EVENTS.ADMIN_DEFENSE_CREATED, handleAdminDefenseCreated);
    socket.on(DEFENSE_SOCKET_EVENTS.FACULTY_DEFENSE_CREATED, handleFacultyDefenseCreated);
    socket.on(DEFENSE_SOCKET_EVENTS.STUDENT_DEFENSE_CREATED, handleStudentDefenseCreated);

    // ---------------------------------------------------------
    // CLEANUP
    // ---------------------------------------------------------
    return () => {
        socket.off(DEFENSE_SOCKET_EVENTS.DEFENSE_CREATED, handleDefenseCreated);
        socket.off(DEFENSE_SOCKET_EVENTS.DEFENSE_UPDATED, handleDefenseUpdated);
        socket.off(DEFENSE_SOCKET_EVENTS.DEFENSE_DELETED, handleDefenseDeleted);
        socket.off(DEFENSE_SOCKET_EVENTS.DEFENSE_CANCELLED, handleDefenseCancelled);
        socket.off(DEFENSE_SOCKET_EVENTS.ADMIN_DEFENSE_CREATED, handleAdminDefenseCreated);
        socket.off(DEFENSE_SOCKET_EVENTS.FACULTY_DEFENSE_CREATED, handleFacultyDefenseCreated);
        socket.off(DEFENSE_SOCKET_EVENTS.STUDENT_DEFENSE_CREATED, handleStudentDefenseCreated);
    };
};