import { createContext, useState, useCallback, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const StatisticalContext = createContext();

export const StatisticalProvider = ({ children }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [Adviserdata, setAdviserdata] = useState()
    const [Admindata, setAdmindata] = useState()
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { authToken } = useContext(AuthContext);

    const BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

    // ==========================================
    // GET DASHBOARD STATISTICS
    // ==========================================
    const fetchDashboardStatistics = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const res = await axios.get(`${BASE_URL}/api/v1/statistical`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (res.data?.status === "success") {
                setDashboardData(res.data.data);
                return { success: true, data: res.data.data };
            }

            return { success: false };
        } catch (error) {
            // ⭐ Mas detalyadong error log
            console.error("❌ Fetch Dashboard Statistics Error:", {
                status: error.response?.status,
                url: error.config?.url,
                message: error.response?.data?.message,
                error: error.response?.data?.error,
                full: error.response?.data,
            });

            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Error fetching dashboard statistics";

            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // GET DASHBOARD STATISTICS
    // ==========================================
    const fetchAdviserStatistics = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const res = await axios.get(`${BASE_URL}/api/v1/statistical/subject_instructor`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });

            if (res.data?.status === "success") {
                setAdviserdata(res.data.data);
                return { success: true, data: res.data.data };
            }

            return { success: false };
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error fetching dashboard statistics";
            setError(errorMessage);
            console.error("Fetch Dashboard Statistics Error:", error);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setIsLoading(false);
        }
    }, [BASE_URL, authToken]);


    const fetchAdminStatistical = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const res = await axios.get(`${BASE_URL}/api/v1/statistical/Admin_Statistical`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });

            if (res.data?.success === true) {
                setAdmindata(res.data.data);
                return { success: true, data: res.data.data };
            }

            return { success: false };
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error fetching dashboard statistics";
            setError(errorMessage);
            console.error("Fetch Dashboard Statistics Error:", error);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setIsLoading(false);
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // REFRESH DASHBOARD DATA
    // ==========================================
    const refreshDashboard = useCallback(async () => {
        return await fetchDashboardStatistics();
    }, [fetchDashboardStatistics]);

    // ==========================================
    // CLEAR DASHBOARD DATA
    // ==========================================
    const clearDashboardData = useCallback(() => {
        setDashboardData(null);
        setError(null);
    }, []);

    // ==========================================
    // AUTO-FETCH ON MOUNT
    // ==========================================
    useEffect(() => {
        if (authToken) {
            fetchDashboardStatistics();
            fetchAdviserStatistics();
            fetchAdminStatistical();
        }
    }, [fetchDashboardStatistics, fetchAdminStatistical, authToken]);

    // ==========================================
    // CONTEXT PROVIDER
    // ==========================================
    return (
        <StatisticalContext.Provider
            value={{
                dashboardData,
                isLoading,
                Adviserdata,
                Admindata,
                error,
                fetchDashboardStatistics,
                refreshDashboard,
                clearDashboardData,
            }}
        >
            {children}
        </StatisticalContext.Provider>
    );
};