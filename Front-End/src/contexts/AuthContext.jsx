import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../components/ReusableFolder/axiosinstance";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem("token") || null);
    const [role, setRole] = useState(localStorage.getItem("role") || null);
    const [email, setEmail] = useState(localStorage.getItem("email") || null);
    const [first_name, setfirst_name] = useState(localStorage.getItem("first_name") || null);
    const [last_name, setlast_name] = useState(localStorage.getItem("last_name") || null);
    const [contact_number, setcontact_number] = useState(localStorage.getItem("contact_number") || null);
    const [userId, setUserID] = useState(localStorage.getItem("userId") || null);
    const [linkId, setlinkId] = useState(localStorage.getItem("linkId") || null);
    const [Designatedzone, setDesignatedzone] = useState(localStorage.getItem("Designatedzone") || null);
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
    const [referredBy, setReferredBy] = useState(localStorage.getItem("referredBy") || null); // Added referredBy state

    useEffect(() => {
        if (authToken) {
            axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
        } else {
            delete axiosInstance.defaults.headers.common["Authorization"];
        }
    }, [authToken]);

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
                    email: serverEmail,
                    first_name,
                    last_name,
                    contact_number,
                    userId,
                    linkId,
                    Designatedzone,
                    theme,
                    referredBy // Added referredBy from response
                } = res.data;

                localStorage.setItem("token", token);
                localStorage.setItem("role", role);
                localStorage.setItem("email", serverEmail);
                localStorage.setItem("first_name", first_name);
                localStorage.setItem("last_name", last_name);
                localStorage.setItem("contact_number", contact_number);
                localStorage.setItem("userId", userId);
                localStorage.setItem("linkId", linkId);
                localStorage.setItem("Designatedzone", Designatedzone);
                localStorage.setItem("authToken", token);
                localStorage.setItem("theme", theme || "light");
                localStorage.setItem("referredBy", referredBy || ""); // Added referredBy to localStorage

                setAuthToken(token);
                setRole(role);
                setEmail(serverEmail);
                setfirst_name(first_name);
                setlast_name(last_name);
                setcontact_number(contact_number);
                setUserID(userId);
                setlinkId(linkId);
                setDesignatedzone(Designatedzone);
                setTheme(theme || "light");
                setReferredBy(referredBy || ""); // Added referredBy state update

                axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

                return { success: true, role, userId };
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "Login failed",
            };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        localStorage.removeItem("first_name");
        localStorage.removeItem("last_name");
        localStorage.removeItem("contact_number");
        localStorage.removeItem("userId");
        localStorage.removeItem("linkId");
        localStorage.removeItem("Designatedzone");
        localStorage.removeItem("authToken");
        localStorage.removeItem("referredBy"); // Added removal of referredBy

        // Clear state
        setAuthToken(null);
        setRole(null);
        setEmail(null);
        setfirst_name(null);
        setlast_name(null);
        setcontact_number(null);
        setUserID(null);
        setlinkId(null);
        setDesignatedzone(null);
        setReferredBy(null); // Added clearing of referredBy state

        // Remove Authorization header from axiosInstance
        delete axiosInstance.defaults.headers.common["Authorization"];

        window.location.href = "/login";
    };

    const updatePassword = async (currentPassword, newPassword, confirmPassword) => {
        try {
            const res = await axiosInstance.put(
                "/api/v1/authentication/update-password",
                {
                    currentPassword,
                    password: newPassword,
                    confirmPassword,
                }
            );

            if (res.data.status === "success") {
                const { token } = res.data;

                // Update token sa localStorage at state
                localStorage.setItem("token", token);
                localStorage.setItem("authToken", token);
                setAuthToken(token);

                // Update axios default header
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

    return (
        <AuthContext.Provider
            value={{
                authToken,
                role,
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
                logout, updatePassword
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use context
export const useAuth = () => useContext(AuthContext);