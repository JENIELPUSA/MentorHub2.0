import { createContext, useState, useCallback, useEffect, useMemo, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const ScheduleContext = createContext();

export const ScheduleProvider = ({ children }) => {
    const [customError, setCustomError] = useState("");
    const { authToken } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);

    // ====== SCHEDULE LIST STATE ======
    const [schedules, setSchedules] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // ====== FILTERS ======
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [groupFilter, setGroupFilter] = useState("");
    const [panelistFilter, setPanelistFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // ====== SELECTED / DETAIL STATE ======
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [schedulesByDate, setSchedulesByDate] = useState([]);
    const [upcomingSchedules, setUpcomingSchedules] = useState([]);

    // Use ref to prevent infinite loops
    const isInitialMount = useRef(true);
    const fetchInProgress = useRef(false);

    const BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;
    const scheduleUrl = `${BASE_URL}/api/v1/schedule`;

    // ==========================================
    // FETCH SCHEDULES - FIXED
    // ==========================================
    const fetchSchedules = useCallback(async (params = {}) => {
        if (fetchInProgress.current) {
            console.log("⏳ Fetch already in progress, skipping...");
            return;
        }

        if (!authToken) {
            console.log("❌ No authToken, skipping fetch");
            return;
        }

        fetchInProgress.current = true;

        try {
            setLoading(true);
            setCustomError("");

            const page = params.page || 1;
            const limit = params.limit || 10;
            const search = params.search || "";
            const date = params.date || "";
            const groupId = params.groupId || "";
            const panelistId = params.panelistId || "";
            const status = params.status || "";

            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (search) queryParams.append("search", search);
            if (date) queryParams.append("date", date);
            if (groupId && groupId !== "All") queryParams.append("groupId", groupId);
            if (panelistId && panelistId !== "All") queryParams.append("panelistId", panelistId);
            if (status && status !== "All") queryParams.append("status", status);

            const fullUrl = `${scheduleUrl}?${queryParams}`;
            console.log("🔗 FULL URL:", fullUrl);

            const res = await axios.get(fullUrl, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Cache-Control": "no-cache",
                },
            });

            console.log("📊 Response Data:", res.data);

            if (res.data?.status === "Success" || res.data?.status === "success") {
                setSchedules(res.data.data || []);
                setTotalCount(res.data.totalCount || res.data.results || 0);
                setTotalPages(res.data.totalPages || 1);
                setCurrentPage(res.data.currentPage || page);

                if (params.limit && params.limit !== rowsPerPage) {
                    setRowsPerPage(params.limit);
                }
                if (params.search !== undefined) setSearchQuery(params.search);
                if (params.date !== undefined) setDateFilter(params.date);
                if (params.groupId !== undefined) setGroupFilter(params.groupId);
                if (params.panelistId !== undefined) setPanelistFilter(params.panelistId);
                if (params.status !== undefined) setStatusFilter(params.status);
            } else {
                console.log("❌ Response status not success");
                setCustomError(res.data?.message || "Failed to fetch schedules");
                setSchedules([]);
            }
        } catch (error) {
            console.error("❌ Fetch Schedules Error:", error);
            setCustomError(error.response?.data?.message || "Error fetching schedules");
            setSchedules([]);
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
        }
    }, [authToken, rowsPerPage, scheduleUrl]);

    // ==========================================
    // GET SCHEDULE BY ID
    // ==========================================
    const getScheduleById = useCallback(async (id) => {
        if (!authToken) return { success: false, error: "No authentication token" };
        if (!id) return { success: false, error: "Schedule ID is required" };

        try {
            setLoading(true);
            setCustomError("");

            const res = await axios.get(`${scheduleUrl}/${id}`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (res.data?.status === "Success" || res.data?.status === "success") {
                setSelectedSchedule(res.data.data || null);
                return { success: true, data: res.data.data };
            }

            return { success: false, error: res.data?.message || "Failed to fetch schedule" };
        } catch (error) {
            console.error("❌ Get Schedule By ID Error:", error);
            if (error.response?.status === 404) {
                return { success: false, error: "Schedule not found" };
            }
            const errorMessage = error.response?.data?.message || "Error fetching schedule";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [authToken, scheduleUrl]);

    // ==========================================
    // GET SCHEDULES BY DATE
    // ==========================================
    const getSchedulesByDate = useCallback(async (date) => {
        if (!authToken) return { success: false, data: [], error: "Authentication required" };
        if (!date) return { success: false, data: [], error: "Date is required" };

        try {
            setLoading(true);
            setCustomError("");

            const res = await axios.get(`${scheduleUrl}/by-date/${date}`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (res.data?.status === "Success" || res.data?.status === "success") {
                setSchedulesByDate(res.data.data || []);
                return { success: true, data: res.data.data || [] };
            }

            return { success: false, data: [], error: res.data?.message || "Failed to fetch schedules" };
        } catch (error) {
            console.error("❌ Get Schedules By Date Error:", error);
            const errorMessage = error.response?.data?.message || "Error fetching schedules";
            setCustomError(errorMessage);
            setSchedulesByDate([]);
            return { success: false, data: [], error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [authToken, scheduleUrl]);

    // ==========================================
    // GET UPCOMING SCHEDULES
    // ==========================================
    const getUpcomingSchedules = useCallback(async (limit = 10) => {
        if (!authToken) return { success: false, data: [], error: "Authentication required" };

        try {
            setLoading(true);
            setCustomError("");

            const res = await axios.get(`${scheduleUrl}/upcoming?limit=${limit}`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (res.data?.status === "Success" || res.data?.status === "success") {
                setUpcomingSchedules(res.data.data || []);
                return { success: true, data: res.data.data || [] };
            }

            return { success: false, data: [], error: res.data?.message || "Failed to fetch upcoming schedules" };
        } catch (error) {
            console.error("❌ Get Upcoming Schedules Error:", error);
            const errorMessage = error.response?.data?.message || "Error fetching upcoming schedules";
            setCustomError(errorMessage);
            setUpcomingSchedules([]);
            return { success: false, data: [], error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [authToken, scheduleUrl]);

    // ==========================================
    // CREATE SCHEDULE
    // ==========================================
    const createSchedule = useCallback(async (values) => {
        if (!authToken) return { success: false, error: "No authentication token" };

        try {
            setLoading(true);
            setCustomError("");

            const res = await axios.post(scheduleUrl, values, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (res.data?.status === "Success" || res.data?.status === "success") {
                await fetchSchedules({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    date: dateFilter,
                    groupId: groupFilter,
                    panelistId: panelistFilter,
                    status: statusFilter,
                });

                return {
                    success: true,
                    data: res.data.data,
                    message: res.data.message || "Schedule created successfully",
                };
            }

            const errorMessage = res.data?.message || "Failed to create schedule";
            setCustomError(errorMessage);
            return { success: false, message: errorMessage };
        } catch (error) {
            console.error("❌ Create Schedule Error:", error);

            // Handle 409 conflict
            if (error.response?.status === 409) {
                const conflictMessage =
                    error.response?.data?.message || "Schedule conflict detected";
                setCustomError(conflictMessage);
                return {
                    success: false,
                    error: conflictMessage,
                    conflictWith: error.response?.data?.conflictWith || null,
                };
            }

            const errorMessage = error.response?.data?.message || "Error creating schedule";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [
        authToken, scheduleUrl, fetchSchedules,
        currentPage, rowsPerPage, searchQuery,
        dateFilter, groupFilter, panelistFilter, statusFilter,
    ]);

    // ==========================================
    // UPDATE SCHEDULE
    // ==========================================
    const updateSchedule = useCallback(async (id, values) => {
        if (!authToken) return { success: false, error: "No authentication token" };
        if (!id) return { success: false, error: "Schedule ID is required" };

        try {
            setLoading(true);
            setCustomError("");

            const res = await axios.patch(`${scheduleUrl}/${id}`, values, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (res.data?.status === "Success" || res.data?.status === "success") {
                await fetchSchedules({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    date: dateFilter,
                    groupId: groupFilter,
                    panelistId: panelistFilter,
                    status: statusFilter,
                });

                // Update selected if same
                if (selectedSchedule?._id === id) {
                    setSelectedSchedule(res.data.data);
                }

                return {
                    success: true,
                    data: res.data.data,
                    message: res.data.message || "Schedule updated successfully",
                };
            }

            const errorMessage = res.data?.message || "Failed to update schedule";
            setCustomError(errorMessage);
            return { success: false, message: errorMessage };
        } catch (error) {
            console.error("❌ Update Schedule Error:", error);

            if (error.response?.status === 409) {
                const conflictMessage =
                    error.response?.data?.message || "Schedule conflict detected";
                setCustomError(conflictMessage);
                return {
                    success: false,
                    error: conflictMessage,
                    conflictWith: error.response?.data?.conflictWith || null,
                };
            }

            const errorMessage = error.response?.data?.message || "Error updating schedule";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [
        authToken, scheduleUrl, fetchSchedules, selectedSchedule,
        currentPage, rowsPerPage, searchQuery,
        dateFilter, groupFilter, panelistFilter, statusFilter,
    ]);

    // ==========================================
    // DELETE SCHEDULE
    // ==========================================
    const deleteSchedule = useCallback(async (id) => {
        if (!authToken) return { success: false, error: "No authentication token" };
        if (!id) return { success: false, error: "Schedule ID is required" };

        try {
            setLoading(true);
            setCustomError("");

            const res = await axios.delete(`${scheduleUrl}/${id}`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (res.data?.status === "Success" || res.data?.status === "success") {
                // Optimistic update
                setSchedules((prev) => prev.filter((s) => s._id !== id));

                await fetchSchedules({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    date: dateFilter,
                    groupId: groupFilter,
                    panelistId: panelistFilter,
                    status: statusFilter,
                });

                return {
                    success: true,
                    message: res.data.message || "Schedule deleted successfully",
                };
            }

            const errorMessage = res.data?.message || "Failed to delete schedule";
            setCustomError(errorMessage);
            return { success: false, message: errorMessage };
        } catch (error) {
            console.error("❌ Delete Schedule Error:", error);
            const errorMessage = error.response?.data?.message || "Error deleting schedule";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [
        authToken, scheduleUrl, fetchSchedules,
        currentPage, rowsPerPage, searchQuery,
        dateFilter, groupFilter, panelistFilter, statusFilter,
    ]);

    // ==========================================
    // CANCEL SCHEDULE (soft delete)
    // ==========================================
    const cancelSchedule = useCallback(async (id) => {
        if (!authToken) return { success: false, error: "No authentication token" };
        if (!id) return { success: false, error: "Schedule ID is required" };

        try {
            setLoading(true);
            setCustomError("");

            const res = await axios.patch(`${scheduleUrl}/${id}/cancel`, {}, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (res.data?.status === "Success" || res.data?.status === "success") {
                await fetchSchedules({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    date: dateFilter,
                    groupId: groupFilter,
                    panelistId: panelistFilter,
                    status: statusFilter,
                });

                if (selectedSchedule?._id === id) {
                    setSelectedSchedule(res.data.data);
                }

                return {
                    success: true,
                    data: res.data.data,
                    message: res.data.message || "Schedule cancelled",
                };
            }

            return { success: false, error: res.data?.message || "Failed to cancel schedule" };
        } catch (error) {
            console.error("❌ Cancel Schedule Error:", error);
            const errorMessage = error.response?.data?.message || "Error cancelling schedule";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [
        authToken, scheduleUrl, fetchSchedules, selectedSchedule,
        currentPage, rowsPerPage, searchQuery,
        dateFilter, groupFilter, panelistFilter, statusFilter,
    ]);

    // ==========================================
    // CHECK CONFLICT (standalone)
    // ==========================================
    const checkConflict = useCallback(async (payload) => {
        if (!authToken) return { success: false, error: "No authentication token" };

        try {
            const res = await axios.post(`${scheduleUrl}/check-conflict`, payload, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (res.data?.status === "Success" || res.data?.status === "success") {
                return {
                    success: true,
                    hasConflict: res.data.hasConflict,
                    conflicts: res.data.conflicts || [],
                };
            }

            return { success: false, error: res.data?.message || "Failed to check conflict" };
        } catch (error) {
            console.error("❌ Check Conflict Error:", error);
            const errorMessage = error.response?.data?.message || "Error checking conflict";
            return { success: false, error: errorMessage };
        }
    }, [authToken, scheduleUrl]);

    // ==========================================
    // CLEAR SELECTED SCHEDULE
    // ==========================================
    const clearSelectedSchedule = useCallback(() => {
        setSelectedSchedule(null);
    }, []);

    // ==========================================
    // SEARCH
    // ==========================================
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        setCurrentPage(1);
        fetchSchedules({
            page: 1,
            limit: rowsPerPage,
            search: query,
            date: dateFilter,
            groupId: groupFilter,
            panelistId: panelistFilter,
            status: statusFilter,
        });
    }, [fetchSchedules, rowsPerPage, dateFilter, groupFilter, panelistFilter, statusFilter]);

    // ==========================================
    // FILTER BY DATE
    // ==========================================
    const handleDateFilter = useCallback((date) => {
        setDateFilter(date);
        setCurrentPage(1);
        fetchSchedules({
            page: 1,
            limit: rowsPerPage,
            search: searchQuery,
            date,
            groupId: groupFilter,
            panelistId: panelistFilter,
            status: statusFilter,
        });
    }, [fetchSchedules, rowsPerPage, searchQuery, groupFilter, panelistFilter, statusFilter]);

    // ==========================================
    // FILTER BY GROUP
    // ==========================================
    const handleGroupFilter = useCallback((groupId) => {
        setGroupFilter(groupId);
        setCurrentPage(1);
        fetchSchedules({
            page: 1,
            limit: rowsPerPage,
            search: searchQuery,
            date: dateFilter,
            groupId,
            panelistId: panelistFilter,
            status: statusFilter,
        });
    }, [fetchSchedules, rowsPerPage, searchQuery, dateFilter, panelistFilter, statusFilter]);

    // ==========================================
    // FILTER BY PANELIST
    // ==========================================
    const handlePanelistFilter = useCallback((panelistId) => {
        setPanelistFilter(panelistId);
        setCurrentPage(1);
        fetchSchedules({
            page: 1,
            limit: rowsPerPage,
            search: searchQuery,
            date: dateFilter,
            groupId: groupFilter,
            panelistId,
            status: statusFilter,
        });
    }, [fetchSchedules, rowsPerPage, searchQuery, dateFilter, groupFilter, statusFilter]);

    // ==========================================
    // FILTER BY STATUS
    // ==========================================
    const handleStatusFilter = useCallback((status) => {
        setStatusFilter(status);
        setCurrentPage(1);
        fetchSchedules({
            page: 1,
            limit: rowsPerPage,
            search: searchQuery,
            date: dateFilter,
            groupId: groupFilter,
            panelistId: panelistFilter,
            status,
        });
    }, [fetchSchedules, rowsPerPage, searchQuery, dateFilter, groupFilter, panelistFilter]);

    // ==========================================
    // CHANGE PAGE
    // ==========================================
    const handlePageChange = useCallback((page) => {
        if (page !== currentPage) {
            setCurrentPage(page);
            fetchSchedules({
                page,
                limit: rowsPerPage,
                search: searchQuery,
                date: dateFilter,
                groupId: groupFilter,
                panelistId: panelistFilter,
                status: statusFilter,
            });
        }
    }, [
        fetchSchedules, rowsPerPage, searchQuery, currentPage,
        dateFilter, groupFilter, panelistFilter, statusFilter,
    ]);

    // ==========================================
    // CHANGE ROWS PER PAGE
    // ==========================================
    const handleRowsPerPageChange = useCallback((rows) => {
        if (rows !== rowsPerPage) {
            setRowsPerPage(rows);
            setCurrentPage(1);
            fetchSchedules({
                page: 1,
                limit: rows,
                search: searchQuery,
                date: dateFilter,
                groupId: groupFilter,
                panelistId: panelistFilter,
                status: statusFilter,
            });
        }
    }, [
        fetchSchedules, searchQuery, rowsPerPage,
        dateFilter, groupFilter, panelistFilter, statusFilter,
    ]);

    // ==========================================
    // CLEAR ALL FILTERS
    // ==========================================
    const clearFilters = useCallback(() => {
        setSearchQuery("");
        setDateFilter("");
        setGroupFilter("");
        setPanelistFilter("");
        setStatusFilter("");
        setCurrentPage(1);
        fetchSchedules({
            page: 1,
            limit: rowsPerPage,
            search: "",
            date: "",
            groupId: "",
            panelistId: "",
            status: "",
        });
    }, [fetchSchedules, rowsPerPage]);

    // ==========================================
    // INITIAL FETCH ON MOUNT & AUTH CHANGE
    // ==========================================
    useEffect(() => {
        if (authToken && isInitialMount.current) {
            isInitialMount.current = false;
            fetchSchedules({ page: 1, limit: rowsPerPage });
        }
    }, [authToken, fetchSchedules, rowsPerPage]);

    // ==========================================
    // FETCH WHEN PAGINATION OR FILTERS CHANGE
    // ==========================================
    useEffect(() => {
        if (isInitialMount.current) return;

        if (authToken) {
            fetchSchedules({
                page: currentPage,
                limit: rowsPerPage,
                search: searchQuery,
                date: dateFilter,
                groupId: groupFilter,
                panelistId: panelistFilter,
                status: statusFilter,
            });
        }
    }, [
        currentPage, searchQuery, rowsPerPage, authToken,
        dateFilter, groupFilter, panelistFilter, statusFilter,
        fetchSchedules,
    ]);

    // ==========================================
    // MEMOIZED CONTEXT VALUE
    // ==========================================
    const value = useMemo(() => ({
        // State
        schedules,
        loading,
        customError,
        totalCount,
        totalPages,
        currentPage,
        rowsPerPage,

        // Filters
        searchQuery,
        dateFilter,
        groupFilter,
        panelistFilter,
        statusFilter,

        // Detail State
        selectedSchedule,
        schedulesByDate,
        upcomingSchedules,

        // CRUD Operations
        fetchSchedules,
        getScheduleById,
        getSchedulesByDate,
        getUpcomingSchedules,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        cancelSchedule,
        checkConflict,

        // Detail helpers
        clearSelectedSchedule,

        // Utility Functions
        handleSearch,
        handleDateFilter,
        handleGroupFilter,
        handlePanelistFilter,
        handleStatusFilter,
        handlePageChange,
        handleRowsPerPageChange,
        clearFilters,

        // Setters
        setSearchQuery,
        setDateFilter,
        setGroupFilter,
        setPanelistFilter,
        setStatusFilter,
        setSchedules,
        setSelectedSchedule,
        setSchedulesByDate,
        setUpcomingSchedules,

        // URL
        scheduleUrl,
    }), [
        schedules,
        loading,
        customError,
        totalCount,
        totalPages,
        currentPage,
        rowsPerPage,
        searchQuery,
        dateFilter,
        groupFilter,
        panelistFilter,
        statusFilter,
        selectedSchedule,
        schedulesByDate,
        upcomingSchedules,
        fetchSchedules,
        getScheduleById,
        getSchedulesByDate,
        getUpcomingSchedules,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        cancelSchedule,
        checkConflict,
        clearSelectedSchedule,
        handleSearch,
        handleDateFilter,
        handleGroupFilter,
        handlePanelistFilter,
        handleStatusFilter,
        handlePageChange,
        handleRowsPerPageChange,
        clearFilters,
        scheduleUrl,
    ]);

    return (
        <ScheduleContext.Provider value={value}>
            {children}
        </ScheduleContext.Provider>
    );
};

export default ScheduleProvider;