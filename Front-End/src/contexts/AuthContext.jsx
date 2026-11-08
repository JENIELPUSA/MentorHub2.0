import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../components/ReusableFolder/axiosinstance";

export const AuthContext = createContext();

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

// ── Helper: safe JSON write with verification ──
const writeMultiRoleToStorage = (arr) => {
    try {
        const safe = Array.isArray(arr) ? arr : [];
        localStorage.setItem("multiplerole", JSON.stringify(safe));
        return safe;
    } catch (err) {
        console.error("Failed to save multiplerole to localStorage:", err);
        return [];
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

    // =========================================================
    // ✅ Sync axios Authorization header
    // =========================================================
    useEffect(() => {
        if (authToken) {
            axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
        } else {
            delete axiosInstance.defaults.headers.common["Authorization"];
        }
    }, [authToken]);

    // =========================================================
    // ✅ Apply theme globally
    // =========================================================
    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
    }, [theme]);

    // =========================================================
    // ✅ CROSS-TAB SYNC — update state when another tab changes
    // =========================================================
    useEffect(() => {
        const handleStorage = (e) => {
            // Only react to keys we care about
            if (e.key === "role" && e.newValue !== null) {
                setRole(e.newValue);
            }
            if (e.key === "multiplerole" && e.newValue !== null) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    setMultiplerole(Array.isArray(parsed) ? parsed : []);
                } catch {
                    // ignore malformed
                }
            }
            if (e.key === "token" && e.newValue !== null) {
                setAuthToken(e.newValue);
            }
            if (e.key === "token" && e.newValue === null) {
                // logout in another tab
                setAuthToken(null);
                setRole(null);
                setMultiplerole([]);
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
                    token,
                    role,
                    multiplerole,
                    email: serverEmail,
                    first_name,
                    last_name,
                    contact_number,
                    userId,
                    linkId,
                    Designatedzone,
                    theme,
                    referredBy,
                } = res.data;

                const safeMulti = Array.isArray(multiplerole) ? multiplerole : [];

                // ── Persist to localStorage (atomic) ──
                localStorage.setItem("token", token);
                localStorage.setItem("authToken", token);
                localStorage.setItem("role", role);
                writeMultiRoleToStorage(safeMulti);          // ✅ helper
                localStorage.setItem("email", serverEmail || "");
                localStorage.setItem("first_name", first_name || "");
                localStorage.setItem("last_name", last_name || "");
                localStorage.setItem("contact_number", contact_number || "");
                localStorage.setItem("userId", userId || "");
                localStorage.setItem("linkId", linkId || "");
                localStorage.setItem("Designatedzone", Designatedzone || "");
                localStorage.setItem("theme", theme || "light");
                localStorage.setItem("referredBy", referredBy || "");

                // 🔍 Optional: verify it actually saved
                console.log(
                    "[AuthContext] multiplerole in localStorage after login:",
                    localStorage.getItem("multiplerole")
                );

                // ── Update state ──
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

                axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

                return { success: true, role, userId, multiplerole: safeMulti };
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "Login failed",
            };
        }
    };

    // =========================================================
    // ✅ SWITCH ROLE — with proper localStorage handling
    // =========================================================
    const switchRole = async (targetRole) => {
        if (!targetRole) {
            return { success: false, message: "targetRole is required." };
        }

        const target = String(targetRole).toLowerCase();

        if (target !== "adviser" && target !== "panelist") {
            return { success: false, message: "Invalid target role." };
        }

        // Local sanity check (backend will enforce too)
        if (Array.isArray(multiplerole) && multiplerole.length > 0) {
            if (!multiplerole.includes(target)) {
                return {
                    success: false,
                    message: `You are not allowed to switch to "${target}".`,
                };
            }
        }

        // Snapshot for rollback if it fails
        const prevToken = authToken;
        const prevRole = role;
        const prevMulti = [...multiplerole];

        try {
            const res = await axiosInstance.post(
                "/api/v1/authentication/switch-role",
                { targetRole: target, userId }
            );

            if (res.data.success) {
                const {
                    token,
                    role: newRole,
                    multiplerole: newMulti,
                    previousRole,
                } = res.data;

                // ── Use returned values, fall back to existing ──
                const safeMulti = Array.isArray(newMulti)
                    ? newMulti
                    : prevMulti.includes(target)
                        ? prevMulti
                        : [...prevMulti.filter(r => r !== prevRole), newRole];

                // ── Persist atomically ──
                localStorage.setItem("token", token);
                localStorage.setItem("authToken", token);
                localStorage.setItem("role", newRole);
                writeMultiRoleToStorage(safeMulti);

                // 🔍 Verify
                console.log(
                    "[AuthContext] After switch — localStorage:",
                    {
                        role: localStorage.getItem("role"),
                        multiplerole: localStorage.getItem("multiplerole"),
                    }
                );

                // ── Update state ──
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

            // Backend responded but not success — rollback
            rollback(prevToken, prevRole, prevMulti);
            return {
                success: false,
                message: res.data.message || "Failed to switch role.",
            };
        } catch (error) {
            console.error("[SwitchRole] Error:", error);
            // Rollback localStorage + state on failure
            rollback(prevToken, prevRole, prevMulti);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to switch role.",
            };
        }
    };

    // ✅ Rollback helper (so failed switch doesn't corrupt storage)
    const rollback = (token, prevRole, prevMulti) => {
        if (token) {
            localStorage.setItem("token", token);
            localStorage.setItem("authToken", token);
            setAuthToken(token);
            axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        if (prevRole) {
            localStorage.setItem("role", prevRole);
            setRole(prevRole);
        }
        writeMultiRoleToStorage(prevMulti);
        setMultiplerole(prevMulti);
    };

    // =========================================================
    // LOGOUT
    // =========================================================
    const logout = () => {
        // Remove all auth-related keys (keep theme as user preference)
        [
            "token",
            "authToken",
            "role",
            "multiplerole",
            "email",
            "first_name",
            "last_name",
            "contact_number",
            "userId",
            "linkId",
            "Designatedzone",
            "referredBy",
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

        delete axiosInstance.defaults.headers.common["Authorization"];

        window.location.href = "/login";
    };

    // =========================================================
    // UPDATE PASSWORD
    // =========================================================
    const updatePassword = async (currentPassword, newPassword, confirmPassword) => {
        try {
            const res = await axiosInstance.put(
                "/api/v1/authentication/update-password",
                { currentPassword, password: newPassword, confirmPassword }
            );

            if (res.data.status === "success") {
                const { token } = res.data;

                localStorage.setItem("token", token);
                localStorage.setItem("authToken", token);
                setAuthToken(token);

                axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

                return { success: true, message: "Password updated successfully." };
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "Failed to update password",
            };
        }
    };

    // ── Derived helpers ──
    const availableSwitchRoles = multiplerole.filter((r) => r !== role);
    const canSwitchRole = availableSwitchRoles.length > 0;

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