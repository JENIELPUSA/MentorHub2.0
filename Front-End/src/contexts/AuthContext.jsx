import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../components/ReusableFolder/axiosinstance";

export const AuthContext = createContext();

// ============================================================
//  HELPER — Avatar URL builder
// ============================================================
const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

const buildAvatarUrl = (avatar) => {
    if (!avatar?.url) return null;
    if (/^https?:\/\//i.test(avatar.url)) return avatar.url;
    return `${API_BASE_URL}${avatar.url}`;
};

// ── Helper: safely read array from localStorage ──
const readMultiRoleFromStorage = () => {
    try {
        const raw = localStorage.getItem("multiplerole");
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

//  Helper: safely read avatar from localStorage
const readAvatarFromStorage = () => {
    try {
        const raw = localStorage.getItem("avatar");
        return raw ? JSON.parse(raw) : { url: "", public_id: "" };
    } catch {
        return { url: "", public_id: "" };
    }
};

const writeMultiRoleToStorage = (arr) => {
    try {
        const safe = Array.isArray(arr) ? arr : [];
        localStorage.setItem("multiplerole", JSON.stringify(safe));
        return safe;
    } catch (err) {
        console.error("Failed to save multiplerole:", err);
        return [];
    }
};

const writeAvatarToStorage = (avatar) => {
    try {
        const safe =
            avatar && typeof avatar === "object"
                ? { url: avatar.url || "", public_id: avatar.public_id || "" }
                : { url: "", public_id: "" };
        localStorage.setItem("avatar", JSON.stringify(safe));
        return safe;
    } catch (err) {
        console.error("Failed to save avatar:", err);
        return { url: "", public_id: "" };
    }
};

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem("token") || null);
    const [role, setRole] = useState(localStorage.getItem("role") || null);
    const [multiplerole, setMultiplerole] = useState(readMultiRoleFromStorage());
    const [email, setEmail] = useState(localStorage.getItem("email") || null);
    const [first_name, setfirst_name] = useState(localStorage.getItem("first_name") || null);
    const [last_name, setlast_name] = useState(localStorage.getItem("last_name") || null);
    const [contact_number, setcontact_number] = useState(localStorage.getItem("contact_number") || null);
    const [userId, setUserID] = useState(localStorage.getItem("userId") || null);
    const [linkId, setlinkId] = useState(localStorage.getItem("linkId") || null);
    const [Designatedzone, setDesignatedzone] = useState(localStorage.getItem("Designatedzone") || null);
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
    const [referredBy, setReferredBy] = useState(localStorage.getItem("referredBy") || null);
    const [avatar, setAvatar] = useState(readAvatarFromStorage());

    //  Sync axios header
    useEffect(() => {
        if (authToken) {
            axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
        } else {
            delete axiosInstance.defaults.headers.common["Authorization"];
        }
    }, [authToken]);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
    }, [theme]);

    //  Cross-tab sync
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === "role" && e.newValue) setRole(e.newValue);
            if (e.key === "multiplerole" && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    setMultiplerole(Array.isArray(parsed) ? parsed : []);
                } catch { }
            }
            if (e.key === "token" && e.newValue) setAuthToken(e.newValue);
            if (e.key === "token" && e.newValue === null) {
                setAuthToken(null);
                setRole(null);
                setMultiplerole([]);
            }
            if (e.key === "avatar") {
                if (e.newValue === null) {
                    setAvatar({ url: "", public_id: "" });
                } else {
                    try {
                        const parsed = JSON.parse(e.newValue);
                        setAvatar(parsed || { url: "", public_id: "" });
                    } catch { }
                }
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    // =========================================================
    // LOGIN
    // =========================================================
    const login = async (inputEmail, password) => {
        try {
            const res = await axiosInstance.post(
                "/api/v1/authentication/login",
                { email: inputEmail, password }
            );

            if (res.data.status === "Success") {
                const {
                    token, role, multiplerole,
                    email: serverEmail, first_name, last_name,
                    contact_number, userId, linkId, Designatedzone,
                    theme, referredBy, avatar: serverAvatar,
                } = res.data;

                const safeMulti = Array.isArray(multiplerole) ? multiplerole : [];
                const safeAvatar = serverAvatar || { url: "", public_id: "" };

                localStorage.setItem("token", token);
                localStorage.setItem("authToken", token);
                localStorage.setItem("role", role);
                writeMultiRoleToStorage(safeMulti);
                localStorage.setItem("email", serverEmail || "");
                localStorage.setItem("first_name", first_name || "");
                localStorage.setItem("last_name", last_name || "");
                localStorage.setItem("contact_number", contact_number || "");
                localStorage.setItem("userId", userId || "");
                localStorage.setItem("linkId", linkId || "");
                localStorage.setItem("Designatedzone", Designatedzone || "");
                localStorage.setItem("theme", theme || "light");
                localStorage.setItem("referredBy", referredBy || "");
                writeAvatarToStorage(safeAvatar);

                setAuthToken(token);
                setRole(role);
                setMultiplerole(safeMulti);
                setEmail(serverEmail);
                setfirst_name(first_name);
                setlast_name(last_name);
                setcontact_number(contact_number);
                setUserID(userId);
                setlinkId(linkId);
                setDesignatedzone(Designatedzone);
                setTheme(theme || "light");
                setReferredBy(referredBy || "");
                setAvatar(safeAvatar);

                axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

                return { success: true, role, userId, multiplerole: safeMulti };
            }

            return {
                success: false,
                message: res.data?.message || "Login failed",
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "Login failed",
            };
        }
    };

    // =========================================================
    // SWITCH ROLE
    // =========================================================
    const switchRole = async (targetRole) => {
        if (!targetRole) return { success: false, message: "targetRole is required." };

        const target = String(targetRole).toLowerCase();
        if (target !== "adviser" && target !== "panelist") {
            return { success: false, message: "Invalid target role." };
        }

        if (Array.isArray(multiplerole) && multiplerole.length > 0) {
            if (!multiplerole.includes(target)) {
                return {
                    success: false,
                    message: `You are not allowed to switch to "${target}".`,
                };
            }
        }

        const prevToken = authToken;
        const prevRole = role;
        const prevMulti = [...multiplerole];

        try {
            const res = await axiosInstance.post(
                "/api/v1/authentication/switch-role",
                { targetRole: target, userId }
            );

            if (res.data.success) {
                const { token, role: newRole, multiplerole: newMulti, previousRole } = res.data;
                const safeMulti = Array.isArray(newMulti)
                    ? newMulti
                    : prevMulti.includes(target)
                        ? prevMulti
                        : [...prevMulti.filter((r) => r !== prevRole), newRole];

                localStorage.setItem("token", token);
                localStorage.setItem("authToken", token);
                localStorage.setItem("role", newRole);
                writeMultiRoleToStorage(safeMulti);

                setAuthToken(token);
                setRole(newRole);
                setMultiplerole(safeMulti);

                axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

                return {
                    success: true,
                    role: newRole,
                    previousRole,
                    multiplerole: safeMulti,
                    message: res.data.message,
                };
            }

            return { success: false, message: res.data.message || "Failed to switch role." };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "Failed to switch role.",
            };
        }
    };

    // =========================================================
    //  UPDATE AVATAR — same pattern sa foodUpdateItem
    // =========================================================
    const updateAvatar = async (file) => {
        if (!file) {
            return { success: false, message: "No file provided." };
        }

        try {
            const formData = new FormData();

            //  I-append ang file — field name "avatar"
            formData.append("avatar", file);

            //  Optional: iba pang fields kung kailangan
            // formData.append("userId", userId);

            console.log("[updateAvatar] FormData entries:");
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}:`, value);
            }

            const res = await axiosInstance.patch(
                "/api/v1/authentication/avatar",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        // ⚠️ Bawal i-set ang "Content-Type" manually — mawawala ang boundary
                        // "Content-Type": "multipart/form-data",  ← ❌ HUWAG
                    },
                }
            );

            if (res.data.success) {
                const newAvatar = res.data.data?.avatar || { url: "", public_id: "" };
                setAvatar(newAvatar);
                writeAvatarToStorage(newAvatar);

                return {
                    success: true,
                    message: res.data.message || "Avatar updated successfully.",
                    avatar: newAvatar,
                };
            }

            return {
                success: false,
                message: res.data.message || "Failed to update avatar.",
            };
        } catch (error) {
            console.error(
                "❌ [updateAvatar] Error:",
                error.response?.data || error.message
            );

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to update avatar.",
            };
        }
    };

    const removeAvatar = async () => {
        try {
            const res = await axiosInstance.delete(
                "/api/v1/authentication/avatar"
            );

            if (res.data.success) {
                const newAvatar = { url: "", public_id: "" };
                setAvatar(newAvatar);
                writeAvatarToStorage(newAvatar);

                return {
                    success: true,
                    message: res.data.message || "Avatar removed successfully.",
                };
            }

            return {
                success: false,
                message: res.data.message || "Failed to remove avatar.",
            };
        } catch (error) {
            console.error("[removeAvatar] Error:", error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to remove avatar.",
            };
        }
    };

    // =========================================================
    // LOGOUT
    // =========================================================
    const logout = () => {
        [
            "token", "authToken", "role", "multiplerole",
            "email", "first_name", "last_name", "contact_number",
            "userId", "linkId", "Designatedzone", "referredBy", "avatar",
        ].forEach((k) => localStorage.removeItem(k));

        setAuthToken(null);
        setRole(null);
        setMultiplerole([]);
        setEmail(null);
        setfirst_name(null);
        setlast_name(null);
        setcontact_number(null);
        setUserID(null);
        setlinkId(null);
        setDesignatedzone(null);
        setReferredBy(null);
        setAvatar({ url: "", public_id: "" });

        delete axiosInstance.defaults.headers.common["Authorization"];

        window.location.href = "/login";
    };

    // Sa AuthContext.jsx
    const updatePassword = async (payload) => {
        // payload = { currentPassword, newPassword, confirmNewPassword }
        try {
            const res = await axiosInstance.patch(
                "/api/v1/authentication/update-password",
                {
                    currentPassword: payload.currentPassword,
                    password: payload.newPassword,                  // ← rename dito
                    confirmPassword: payload.confirmNewPassword,    // ← rename dito
                }
            );

            if (res.data?.status === "success") {
                const { token } = res.data;

                localStorage.setItem("token", token);
                localStorage.setItem("authToken", token);
                setAuthToken(token);
                axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

                return { success: true, message: res.data?.message || "Password updated successfully." };
            }

            return {
                success: false,
                message: res.data?.message || "Failed to update password",
            };
        } catch (error) {
            const status = error.response?.status;
            const serverMsg = error.response?.data?.message;

            let message = serverMsg || "Failed to update password";
            if (status === 401) message = serverMsg || "Current password is incorrect.";
            else if (status === 400) message = serverMsg || "Invalid password input.";
            else if (status === 403) message = serverMsg || "Forbidden.";
            else if (!error.response) message = "Network error. Please check your connection.";

            return { success: false, message };
        }
    };

    const availableSwitchRoles = multiplerole.filter((r) => r !== role);
    const canSwitchRole = availableSwitchRoles.length > 0;
    const avatarUrl = buildAvatarUrl(avatar);
    const hasAvatar = Boolean(avatar?.url);

    return (
        <AuthContext.Provider
            value={{
                authToken,
                role,
                multiplerole,
                availableSwitchRoles,
                canSwitchRole,
                email,
                first_name,
                last_name,
                contact_number,
                userId,
                linkId,
                Designatedzone,
                theme,
                referredBy,
                avatar,
                avatarUrl,
                hasAvatar,
                updateAvatar,
                removeAvatar,
                login,
                logout,
                updatePassword,
                switchRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);