import { createContext, useState, useCallback, useEffect, useContext } from "react";
import { AuthContext } from "../AuthContext";
import axiosInstance from "../../components/ReusableFolder/axiosinstance";

export const StatisticalContext = createContext();

export const StatisticalProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [Adviserdata, setAdviserdata] = useState(null);
  const [Admindata, setAdmindata] = useState(null);
  const [Studentdata, setStudentdata] = useState(null);   // ⭐ NEW
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { authToken } = useContext(AuthContext);
  const authConfig = useCallback(() => {
    if (!authToken) {
      console.warn("⚠️ authToken is missing — request will likely 401");
      return {};
    }
    return {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    };
  }, [authToken]);

  // ==========================================
  // GET DASHBOARD STATISTICS
  // ==========================================
  const fetchDashboardStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await axiosInstance.get("/api/v1/statistical", authConfig());

      if (res.data?.status === "success") {
        setDashboardData(res.data.data);
        return { success: true, data: res.data.data };
      }

      return { success: false };
    } catch (error) {
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
  }, [authConfig]);

  // ==========================================
  // GET ADVISER STATISTICS
  // ==========================================
  const fetchAdviserStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await axiosInstance.get(
        "/api/v1/statistical/subject_instructor",
        authConfig()
      );

      if (res.data?.status === "success") {
        setAdviserdata(res.data.data);
        return { success: true, data: res.data.data };
      }

      return { success: false };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error fetching adviser statistics";

      setError(errorMessage);
      console.error("❌ Fetch Adviser Statistics Error:", error);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [authConfig]);

  // ==========================================
  // GET ADMIN STATISTICS
  // ==========================================
  const fetchAdminStatistical = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await axiosInstance.get(
        "/api/v1/statistical/Admin_Statistical",
        authConfig()
      );

      if (res.data?.status === "success" || res.data?.success === true) {
        setAdmindata(res.data.data);
        return { success: true, data: res.data.data };
      }

      return { success: false };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error fetching admin statistics";

      setError(errorMessage);
      console.error("❌ Fetch Admin Statistics Error:", error);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [authConfig]);

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
  }, [
    fetchDashboardStatistics,
    fetchAdviserStatistics,
    fetchAdminStatistical,         // ⭐ NEW
    authToken,
  ]);

  // ==========================================
  // CONTEXT PROVIDER
  // ==========================================
  return (
    <StatisticalContext.Provider
      value={{
        dashboardData,
        Adviserdata,
        Admindata,
        Studentdata,                // ⭐ NEW
        isLoading,
        error,
        fetchDashboardStatistics,
        fetchAdviserStatistics,
        fetchAdminStatistical,  // ⭐ NEW
        refreshDashboard,
        clearDashboardData,
      }}
    >
      {children}
    </StatisticalContext.Provider>
  );
};