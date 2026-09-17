import { createContext, useState, useCallback, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { authToken, user } = useContext(AuthContext);

    const BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;
    const userId = user?._id || "6a8cadef8328c34dffc6f620"; // Use actual user ID from auth

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

            const res = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

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
    }, [BASE_URL, userId, authToken]);

    // ==========================================
    // INITIAL FETCH - Get unread notifications
    // ==========================================
    useEffect(() => {
        if (authToken && userId) {
            displayNotifications({});
        }
    }, [displayNotifications, authToken, userId]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                isLoading,
                displayNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};