import socket from "../../../../socket";

// =========================================================
// SOCKET EVENT CONSTANTS
// =========================================================
export const SOCKET_EVENTS = {
    REGISTER_USER: "register-user",
    SEND_MESSAGE: "send-message",

    SECTION_CREATED: "section:created",
    SECTION_UPDATED: "section:updated",
    SECTION_DELETED: "section:deleted",
    ADMIN_SECTION_CREATED: "admin:section:created",
    FACULTY_SECTION_CREATED: "faculty:section:created",
};

// =========================================================
// NORMALIZE SECTION PAYLOAD
// =========================================================
export const normalizeSectionPayload = (payload) => {
    if (!payload) return null;

    const raw = payload?.data || {};
    const sectionId = raw?._id || raw?.id || null;

    const subjectId =
        payload?.subjectId ||
        raw?.subjectId?._id ||
        raw?.subjectId ||
        null;

    return {
        sectionId,
        sectionName: raw?.name || raw?.title || null,
        subjectId,
        createdBy: payload?.createdBy || null,
        timestamp: payload?.timestamp || new Date().toISOString(),
        raw: payload,
    };
};

// =========================================================
// REGISTER SECTION SOCKET HANDLERS
// Returns cleanup function.
// =========================================================
export const registerSectionSocketHandlers = ({
    userId,
    role,
    fetchSections,
    notify,
}) => {
    const safeNotify = (type, message) => {
        if (typeof notify === "function") notify({ type, message });
    };

    // ---------------------------------------------------------
    // SECTION CREATED
    // ---------------------------------------------------------
    const handleSectionCreated = (payload) => {
        const n = normalizeSectionPayload(payload);

        console.log("[SECTION_CREATED]", {
            ...n,
            currentUser: userId,
            currentRole: role,
        });

        try {
            fetchSections({ subjectId: n.subjectId });
            safeNotify(
                "section-created",
                `New section "${n.sectionName || "Untitled"}" created`
            );
        } catch (err) {
            console.error("[SECTION_CREATED] fetchSections error:", err);
        }
    };

    // ---------------------------------------------------------
    // SECTION UPDATED
    // ---------------------------------------------------------
    const handleSectionUpdated = (payload) => {
        const n = normalizeSectionPayload(payload);

        console.log("[SECTION_UPDATED]", {
            ...n,
            currentUser: userId,
            currentRole: role,
        });

        try {
            fetchSections({ sectionId: n.sectionId });
            safeNotify(
                "section-updated",
                `Section "${n.sectionName || "Untitled"}" updated`
            );
        } catch (err) {
            console.error("[SECTION_UPDATED] fetchSections error:", err);
        }
    };

    // ---------------------------------------------------------
    // SECTION DELETED
    // ---------------------------------------------------------
    const handleSectionDeleted = (payload) => {
        const n = normalizeSectionPayload(payload);

        console.log("[SECTION_DELETED]", {
            ...n,
            currentUser: userId,
            currentRole: role,
        });

        try {
            fetchSections();
            safeNotify(
                "section-deleted",
                `Section "${n.sectionName || "Untitled"}" deleted`
            );
        } catch (err) {
            console.error("[SECTION_DELETED] fetchSections error:", err);
        }
    };

    // ---------------------------------------------------------
    // ADMIN SECTION CREATED
    // ---------------------------------------------------------
    const handleAdminSectionCreated = (payload) => {
        const n = normalizeSectionPayload(payload);
        console.log("[ADMIN_SECTION_CREATED]", {
            ...n,
            currentUser: userId,
            currentRole: role,
        });
    };

    // ---------------------------------------------------------
    // FACULTY SECTION CREATED
    // ---------------------------------------------------------
    const handleFacultySectionCreated = (payload) => {
        const n = normalizeSectionPayload(payload);
        console.log("[FACULTY_SECTION_CREATED]", {
            ...n,
            currentUser: userId,
            currentRole: role,
        });
    };

    // ---------------------------------------------------------
    // REGISTER ALL LISTENERS
    // ---------------------------------------------------------
    socket.on(SOCKET_EVENTS.SECTION_CREATED, handleSectionCreated);
    socket.on(SOCKET_EVENTS.SECTION_UPDATED, handleSectionUpdated);
    socket.on(SOCKET_EVENTS.SECTION_DELETED, handleSectionDeleted);
    socket.on(SOCKET_EVENTS.ADMIN_SECTION_CREATED, handleAdminSectionCreated);
    socket.on(SOCKET_EVENTS.FACULTY_SECTION_CREATED, handleFacultySectionCreated);

    // ---------------------------------------------------------
    // CLEANUP
    // ---------------------------------------------------------
    return () => {
        socket.off(SOCKET_EVENTS.SECTION_CREATED, handleSectionCreated);
        socket.off(SOCKET_EVENTS.SECTION_UPDATED, handleSectionUpdated);
        socket.off(SOCKET_EVENTS.SECTION_DELETED, handleSectionDeleted);
        socket.off(SOCKET_EVENTS.ADMIN_SECTION_CREATED, handleAdminSectionCreated);
        socket.off(SOCKET_EVENTS.FACULTY_SECTION_CREATED, handleFacultySectionCreated);
    };
};