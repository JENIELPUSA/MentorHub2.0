import {
    createContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    useContext,
    useRef,
} from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const ScheduleContext = createContext();

export const ScheduleProvider = ({ children }) => {
    const [customError, setCustomError] = useState("");
    const { authToken } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    // ====== SCHEDULE LIST STATE ======
    const [schedules, setSchedules] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
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

    // ====== PANELIST STATUS STATE ======
    const [panelistSummary, setPanelistSummary] = useState(null);

    // ====== REFS ======
    const isInitialMount = useRef(true);
    const fetchInProgress = useRef(false);

    const BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;
    const scheduleUrl = `${BASE_URL}/api/v1/schedule`;

    // ==========================================
    // HELPER: Build axios config
    // ==========================================
    const axiosConfig = useCallback(
        (withJson = false) => ({
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${authToken}`,
                ...(withJson && { "Content-Type": "application/json" }),
            },
        }),
        [authToken]
    );

    // ==========================================
    // HELPER: Normalize error response
    // ==========================================
    const normalizeError = (error, fallback = "Something went wrong") => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message || fallback;
        return {
            success: false,
            error: message,
            status,
            conflictWith: error.response?.data?.conflictWith || null,
        };
    };

    // ==========================================
    // FETCH SCHEDULES
    // ==========================================
    const fetchSchedules = useCallback(
        async (params = {}) => {
            if (!authToken) return { success: false, error: "No auth token" };
            if (fetchInProgress.current) {
                console.log("⏳ Fetch already in progress, skipping...");
                return { success: false, error: "Fetch in progress" };
            }

            fetchInProgress.current = true;

            try {
                setLoading(true);
                setCustomError("");

                const page = params.page ?? currentPage;
                const limit = params.limit ?? rowsPerPage;
                const search = params.search ?? searchQuery;
                const date = params.date ?? dateFilter;
                const groupId = params.groupId ?? groupFilter;
                const panelistId = params.panelistId ?? panelistFilter;
                const status = params.status ?? statusFilter;

                const queryParams = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                });

                if (search) queryParams.append("search", search);
                if (date) queryParams.append("date", date);
                if (groupId && groupId !== "All")
                    queryParams.append("groupId", groupId);
                if (panelistId && panelistId !== "All")
                    queryParams.append("panelistId", panelistId);
                if (status && status !== "All")
                    queryParams.append("status", status);

                const fullUrl = `${scheduleUrl}?${queryParams}`;
                console.log("🔗 FULL URL:", fullUrl);

                const res = await axios.get(fullUrl, axiosConfig());

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    const data = res.data.data || [];
                    setSchedules(data);

                    // 🔧 Backend walang pagination — i-compute sa client side
                    const backendTotal = res.data.totalCount ?? res.data.results;
                    if (typeof backendTotal === "number") {
                        setTotalCount(backendTotal);
                        setTotalPages(Math.max(1, Math.ceil(backendTotal / limit)));
                    } else {
                        // Walang total from backend — treat current array as full
                        setTotalCount(data.length);
                        setTotalPages(Math.max(1, Math.ceil(data.length / limit)));
                    }
                    setCurrentPage(page);
                    setRowsPerPage(limit);

                    // Update filter state (para consistent)
                    setSearchQuery(search);
                    setDateFilter(date);
                    setGroupFilter(groupId);
                    setPanelistFilter(panelistId);
                    setStatusFilter(status);

                    return { success: true, data };
                }

                setCustomError(res.data?.message || "Failed to fetch schedules");
                setSchedules([]);
                return {
                    success: false,
                    error: res.data?.message || "Failed to fetch schedules",
                };
            } catch (error) {
                console.error("❌ Fetch Schedules Error:", error);
                const err = normalizeError(error, "Error fetching schedules");
                setCustomError(err.error);
                setSchedules([]);
                return err;
            } finally {
                setLoading(false);
                fetchInProgress.current = false;
            }
        },
        [
            authToken,
            scheduleUrl,
            axiosConfig,
            currentPage,
            rowsPerPage,
            searchQuery,
            dateFilter,
            groupFilter,
            panelistFilter,
            statusFilter,
        ]
    );

    // ==========================================
    // GET SCHEDULE BY ID
    // ==========================================
    const getScheduleById = useCallback(
        async (id) => {
            if (!authToken) return { success: false, error: "No auth token" };
            if (!id) return { success: false, error: "Schedule ID is required" };

            try {
                setLoading(true);
                setCustomError("");

                const res = await axios.get(`${scheduleUrl}/${id}`, axiosConfig());

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    setSelectedSchedule(res.data.data || null);
                    return { success: true, data: res.data.data };
                }

                return {
                    success: false,
                    error: res.data?.message || "Failed to fetch schedule",
                };
            } catch (error) {
                console.error("❌ Get Schedule By ID Error:", error);
                const err = normalizeError(error, "Error fetching schedule");
                if (error.response?.status === 404) {
                    return { success: false, error: "Schedule not found", status: 404 };
                }
                setCustomError(err.error);
                return err;
            } finally {
                setLoading(false);
            }
        },
        [authToken, scheduleUrl, axiosConfig]
    );

    // ==========================================
    // GET SCHEDULES BY DATE
    // ==========================================
    const getSchedulesByDate = useCallback(
        async (date) => {
            if (!authToken)
                return { success: false, data: [], error: "Authentication required" };
            if (!date) return { success: false, data: [], error: "Date is required" };

            try {
                setLoading(true);
                setCustomError("");

                const res = await axios.get(
                    `${scheduleUrl}/by-date/${date}`,
                    axiosConfig()
                );

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    const data = res.data.data || [];
                    setSchedulesByDate(data);
                    return { success: true, data };
                }

                return {
                    success: false,
                    data: [],
                    error: res.data?.message || "Failed to fetch schedules",
                };
            } catch (error) {
                console.error("❌ Get Schedules By Date Error:", error);
                const err = normalizeError(error, "Error fetching schedules");
                setCustomError(err.error);
                setSchedulesByDate([]);
                return { success: false, data: [], error: err.error };
            } finally {
                setLoading(false);
            }
        },
        [authToken, scheduleUrl, axiosConfig]
    );

    // ==========================================
    // GET UPCOMING SCHEDULES
    // ==========================================
    const getUpcomingSchedules = useCallback(
        async (limit = 10) => {
            if (!authToken)
                return { success: false, data: [], error: "Authentication required" };

            try {
                setLoading(true);
                setCustomError("");

                const res = await axios.get(
                    `${scheduleUrl}/upcoming?limit=${limit}`,
                    axiosConfig()
                );

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    const data = res.data.data || [];
                    setUpcomingSchedules(data);
                    return { success: true, data };
                }

                return {
                    success: false,
                    data: [],
                    error: res.data?.message || "Failed to fetch upcoming",
                };
            } catch (error) {
                console.error("❌ Get Upcoming Schedules Error:", error);
                const err = normalizeError(error, "Error fetching upcoming");
                setCustomError(err.error);
                setUpcomingSchedules([]);
                return { success: false, data: [], error: err.error };
            } finally {
                setLoading(false);
            }
        },
        [authToken, scheduleUrl, axiosConfig]
    );

    // ==========================================
    // REFRESH CURRENT LIST (helper)
    // ==========================================
    const refreshCurrentList = useCallback(async () => {
        return fetchSchedules({
            page: currentPage,
            limit: rowsPerPage,
            search: searchQuery,
            date: dateFilter,
            groupId: groupFilter,
            panelistId: panelistFilter,
            status: statusFilter,
        });
    }, [
        fetchSchedules,
        currentPage,
        rowsPerPage,
        searchQuery,
        dateFilter,
        groupFilter,
        panelistFilter,
        statusFilter,
    ]);

    // ==========================================
    // CREATE SCHEDULE
    // ==========================================
    const createSchedule = useCallback(
        async (values) => {
            if (!authToken) return { success: false, error: "No auth token" };

            try {
                setLoading(true);
                setCustomError("");

                const res = await axios.post(
                    scheduleUrl,
                    values,
                    axiosConfig(true)
                );

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    await refreshCurrentList();
                    return {
                        success: true,
                        data: res.data.data,
                        message: res.data.message || "Schedule created successfully",
                    };
                }

                const errorMessage = res.data?.message || "Failed to create schedule";
                setCustomError(errorMessage);
                return { success: false, error: errorMessage };
            } catch (error) {
                console.error("❌ Create Schedule Error:", error);
                const err = normalizeError(error, "Error creating schedule");
                setCustomError(err.error);
                return err;
            } finally {
                setLoading(false);
            }
        },
        [authToken, scheduleUrl, axiosConfig, refreshCurrentList]
    );

    // ==========================================
    // UPDATE SCHEDULE (PUT — match backend)
    // ==========================================
    const updateSchedule = useCallback(
        async (id, values) => {
            if (!authToken) return { success: false, error: "No auth token" };
            if (!id) return { success: false, error: "Schedule ID is required" };

            try {
                setLoading(true);
                setCustomError("");

                // ✅ FIXED: PUT, not PATCH (backend uses router.route().put)
                const res = await axios.put(
                    `${scheduleUrl}/${id}`,
                    values,
                    axiosConfig(true)
                );

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    await refreshCurrentList();

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
                return { success: false, error: errorMessage };
            } catch (error) {
                console.error("❌ Update Schedule Error:", error);
                const err = normalizeError(error, "Error updating schedule");
                setCustomError(err.error);
                return err;
            } finally {
                setLoading(false);
            }
        },
        [
            authToken,
            scheduleUrl,
            axiosConfig,
            refreshCurrentList,
            selectedSchedule,
        ]
    );

    // ==========================================
    // DELETE SCHEDULE
    // ==========================================
    const deleteSchedule = useCallback(
        async (id) => {
            if (!authToken) return { success: false, error: "No auth token" };
            if (!id) return { success: false, error: "Schedule ID is required" };

            try {
                setLoading(true);
                setCustomError("");

                const res = await axios.delete(
                    `${scheduleUrl}/${id}`,
                    axiosConfig()
                );

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    // Optimistic
                    setSchedules((prev) => prev.filter((s) => s._id !== id));

                    await refreshCurrentList();
                    return {
                        success: true,
                        message: res.data.message || "Schedule deleted successfully",
                    };
                }

                const errorMessage = res.data?.message || "Failed to delete schedule";
                setCustomError(errorMessage);
                return { success: false, error: errorMessage };
            } catch (error) {
                console.error("❌ Delete Schedule Error:", error);
                const err = normalizeError(error, "Error deleting schedule");
                setCustomError(err.error);
                return err;
            } finally {
                setLoading(false);
            }
        },
        [authToken, scheduleUrl, axiosConfig, refreshCurrentList]
    );

    // ==========================================
    // CANCEL SCHEDULE (soft delete)
    // ==========================================
    const cancelSchedule = useCallback(
        async (id) => {
            if (!authToken) return { success: false, error: "No auth token" };
            if (!id) return { success: false, error: "Schedule ID is required" };

            try {
                setLoading(true);
                setCustomError("");

                const res = await axios.patch(
                    `${scheduleUrl}/${id}/cancel`,
                    {},
                    axiosConfig()
                );

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    await refreshCurrentList();

                    if (selectedSchedule?._id === id) {
                        setSelectedSchedule(res.data.data);
                    }

                    return {
                        success: true,
                        data: res.data.data,
                        message: res.data.message || "Schedule cancelled",
                    };
                }

                return {
                    success: false,
                    error: res.data?.message || "Failed to cancel schedule",
                };
            } catch (error) {
                console.error("❌ Cancel Schedule Error:", error);
                const err = normalizeError(error, "Error cancelling schedule");
                setCustomError(err.error);
                return err;
            } finally {
                setLoading(false);
            }
        },
        [
            authToken,
            scheduleUrl,
            axiosConfig,
            refreshCurrentList,
            selectedSchedule,
        ]
    );

    // ==========================================
    // 🆕 CHANGE STATUS (scheduled/ongoing/completed/cancelled)
    // ==========================================
    const changeStatus = useCallback(
        async (id, status, remarks = "") => {
            if (!authToken) return { success: false, error: "No auth token" };
            if (!id) return { success: false, error: "Schedule ID is required" };
            if (!status) return { success: false, error: "Status is required" };

            try {
                setLoading(true);
                setCustomError("");

                const res = await axios.put(
                    `${scheduleUrl}/${id}/status`,
                    { status, remarks },
                    axiosConfig(true)
                );

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    await refreshCurrentList();
                    if (selectedSchedule?._id === id) {
                        setSelectedSchedule(res.data.data);
                    }
                    return {
                        success: true,
                        data: res.data.data,
                        message: res.data.message || `Status changed to "${status}"`,
                    };
                }

                const errorMessage =
                    res.data?.message || "Failed to change status";
                setCustomError(errorMessage);
                return { success: false, error: errorMessage };
            } catch (error) {
                console.error("❌ Change Status Error:", error);
                const err = normalizeError(error, "Error changing status");
                setCustomError(err.error);
                return err;
            } finally {
                setLoading(false);
            }
        },
        [
            authToken,
            scheduleUrl,
            axiosConfig,
            refreshCurrentList,
            selectedSchedule,
        ]
    );

    // ==========================================
    // 🆕 CONFIRM PANELIST
    // ==========================================
    const confirmPanelist = useCallback(
        async (scheduleId, panelistId, notes = "") => {
            if (!authToken) return { success: false, error: "No auth token" };
            if (!scheduleId || !panelistId)
                return { success: false, error: "Schedule ID and Panelist ID required" };

            try {
                setLoading(true);
                setCustomError("");

                const res = await axios.patch(
                    `${scheduleUrl}/${scheduleId}/panelists/${panelistId}/confirm`,
                    { notes },
                    axiosConfig(true)
                );

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    if (selectedSchedule?._id === scheduleId) {
                        setSelectedSchedule(res.data.data);
                    }
                    await refreshCurrentList();
                    return {
                        success: true,
                        data: res.data.data,
                        message: res.data.message || "Panelist confirmed",
                    };
                }

                return {
                    success: false,
                    error: res.data?.message || "Failed to confirm panelist",
                };
            } catch (error) {
                console.error("❌ Confirm Panelist Error:", error);
                const err = normalizeError(error, "Error confirming panelist");
                setCustomError(err.error);
                return err;
            } finally {
                setLoading(false);
            }
        },
        [
            authToken,
            scheduleUrl,
            axiosConfig,
            refreshCurrentList,
            selectedSchedule,
        ]
    );

    // ==========================================
    // 🆕 REJECT PANELIST (soft delete — keeps history)
    // ==========================================
    const rejectPanelist = useCallback(
        async (scheduleId, panelistId, notes = "") => {
            if (!authToken) return { success: false, error: "No auth token" };
            if (!scheduleId || !panelistId)
                return { success: false, error: "Schedule ID and Panelist ID required" };

            try {
                setLoading(true);
                setCustomError("");

                const res = await axios.patch(
                    `${scheduleUrl}/${scheduleId}/panelists/${panelistId}/reject`,
                    { notes },
                    axiosConfig(true)
                );

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    if (selectedSchedule?._id === scheduleId) {
                        setSelectedSchedule(res.data.data);
                    }
                    await refreshCurrentList();
                    return {
                        success: true,
                        data: res.data.data,
                        rejectedPanelist: res.data.rejectedPanelist || null,
                        message:
                            res.data.message ||
                            "Panelist rejected. Assign a replacement.",
                    };
                }

                return {
                    success: false,
                    error: res.data?.message || "Failed to reject panelist",
                };
            } catch (error) {
                console.error("❌ Reject Panelist Error:", error);
                const err = normalizeError(error, "Error rejecting panelist");
                setCustomError(err.error);
                return err;
            } finally {
                setLoading(false);
            }
        },
        [
            authToken,
            scheduleUrl,
            axiosConfig,
            refreshCurrentList,
            selectedSchedule,
        ]
    );

    // ==========================================
    // 🆕 RESET PANELIST RESPONSE
    // ==========================================
    const resetPanelistResponse = useCallback(
        async (scheduleId, panelistId) => {
            if (!authToken) return { success: false, error: "No auth token" };
            if (!scheduleId || !panelistId)
                return { success: false, error: "Schedule ID and Panelist ID required" };

            try {
                setLoading(true);
                setCustomError("");

                const res = await axios.patch(
                    `${scheduleUrl}/${scheduleId}/panelists/${panelistId}/reset`,
                    {},
                    axiosConfig()
                );

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    if (selectedSchedule?._id === scheduleId) {
                        setSelectedSchedule(res.data.data);
                    }
                    await refreshCurrentList();
                    return {
                        success: true,
                        data: res.data.data,
                        message: res.data.message || "Panelist response reset",
                    };
                }

                return {
                    success: false,
                    error: res.data?.message || "Failed to reset panelist",
                };
            } catch (error) {
                console.error("❌ Reset Panelist Error:", error);
                const err = normalizeError(error, "Error resetting panelist");
                setCustomError(err.error);
                return err;
            } finally {
                setLoading(false);
            }
        },
        [
            authToken,
            scheduleUrl,
            axiosConfig,
            refreshCurrentList,
            selectedSchedule,
        ]
    );

    // ==========================================
    // 🆕 ADD REPLACEMENT PANELIST
    // ==========================================
    const addPanelist = useCallback(
        async (scheduleId, panelistId) => {
            if (!authToken) return { success: false, error: "No auth token" };
            if (!scheduleId || !panelistId)
                return { success: false, error: "Schedule ID and Panelist ID required" };

            try {
                setLoading(true);
                setCustomError("");

                const res = await axios.post(
                    `${scheduleUrl}/${scheduleId}/panelists`,
                    { panelistId },
                    axiosConfig(true)
                );

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    if (selectedSchedule?._id === scheduleId) {
                        setSelectedSchedule(res.data.data);
                    }
                    await refreshCurrentList();
                    return {
                        success: true,
                        data: res.data.data,
                        message:
                            res.data.message || "Replacement panelist added",
                    };
                }

                return {
                    success: false,
                    error: res.data?.message || "Failed to add panelist",
                };
            } catch (error) {
                console.error("❌ Add Panelist Error:", error);
                const err = normalizeError(error, "Error adding panelist");
                setCustomError(err.error);
                return err;
            } finally {
                setLoading(false);
            }
        },
        [
            authToken,
            scheduleUrl,
            axiosConfig,
            refreshCurrentList,
            selectedSchedule,
        ]
    );

    // ==========================================
    // 🆕 GET PANELIST STATUS SUMMARY
    // ==========================================
    const getPanelistStatus = useCallback(
        async (scheduleId) => {
            if (!authToken) return { success: false, error: "No auth token" };
            if (!scheduleId) return { success: false, error: "Schedule ID is required" };

            try {
                setLoading(true);
                setCustomError("");

                const res = await axios.get(
                    `${scheduleUrl}/${scheduleId}/panelists/status`,
                    axiosConfig()
                );

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    setPanelistSummary(res.data.summary || null);
                    return {
                        success: true,
                        defenseStatus: res.data.defenseStatus,
                        summary: res.data.summary,
                        panelists: res.data.panelists,
                    };
                }

                return {
                    success: false,
                    error: res.data?.message || "Failed to fetch panelist status",
                };
            } catch (error) {
                console.error("❌ Get Panelist Status Error:", error);
                const err = normalizeError(error, "Error fetching panelist status");
                setCustomError(err.error);
                setPanelistSummary(null);
                return err;
            } finally {
                setLoading(false);
            }
        },
        [authToken, scheduleUrl, axiosConfig]
    );

    // ==========================================
    // CHECK CONFLICT (standalone)
    // ==========================================
    const checkConflict = useCallback(
        async (payload) => {
            if (!authToken) return { success: false, error: "No auth token" };

            try {
                const res = await axios.post(
                    `${scheduleUrl}/check-conflict`,
                    payload,
                    axiosConfig(true)
                );

                if (
                    res.data?.status === "Success" ||
                    res.data?.status === "success"
                ) {
                    return {
                        success: true,
                        hasConflict: res.data.hasConflict,
                        conflicts: res.data.conflicts || [],
                    };
                }

                return {
                    success: false,
                    error: res.data?.message || "Failed to check conflict",
                };
            } catch (error) {
                console.error("❌ Check Conflict Error:", error);
                const err = normalizeError(error, "Error checking conflict");
                return err;
            }
        },
        [authToken, scheduleUrl, axiosConfig]
    );

    // ==========================================
    // CLEAR SELECTED
    // ==========================================
    const clearSelectedSchedule = useCallback(() => {
        setSelectedSchedule(null);
        setPanelistSummary(null);
    }, []);

    // ==========================================
    // FILTER HANDLERS
    // ==========================================
    const handleSearch = useCallback(
        (query) => {
            setSearchQuery(query);
            setCurrentPage(1);
            fetchSchedules({ page: 1, search: query });
        },
        [fetchSchedules]
    );

    const handleDateFilter = useCallback(
        (date) => {
            setDateFilter(date);
            setCurrentPage(1);
            fetchSchedules({ page: 1, date });
        },
        [fetchSchedules]
    );

    const handleGroupFilter = useCallback(
        (groupId) => {
            setGroupFilter(groupId);
            setCurrentPage(1);
            fetchSchedules({ page: 1, groupId });
        },
        [fetchSchedules]
    );

    const handlePanelistFilter = useCallback(
        (panelistId) => {
            setPanelistFilter(panelistId);
            setCurrentPage(1);
            fetchSchedules({ page: 1, panelistId });
        },
        [fetchSchedules]
    );

    const handleStatusFilter = useCallback(
        (status) => {
            setStatusFilter(status);
            setCurrentPage(1);
            fetchSchedules({ page: 1, status });
        },
        [fetchSchedules]
    );

    const handlePageChange = useCallback(
        (page) => {
            if (page !== currentPage) {
                setCurrentPage(page);
                fetchSchedules({ page });
            }
        },
        [fetchSchedules, currentPage]
    );

    const handleRowsPerPageChange = useCallback(
        (rows) => {
            if (rows !== rowsPerPage) {
                setRowsPerPage(rows);
                setCurrentPage(1);
                fetchSchedules({ page: 1, limit: rows });
            }
        },
        [fetchSchedules, rowsPerPage]
    );

    const clearFilters = useCallback(() => {
        setSearchQuery("");
        setDateFilter("");
        setGroupFilter("");
        setPanelistFilter("");
        setStatusFilter("");
        setCurrentPage(1);
        fetchSchedules({
            page: 1,
            search: "",
            date: "",
            groupId: "",
            panelistId: "",
            status: "",
        });
    }, [fetchSchedules]);

    // ==========================================
    // INITIAL FETCH (single effect, no double fetch)
    // ==========================================
    useEffect(() => {
        if (!authToken) return;
        if (!isInitialMount.current) return;

        isInitialMount.current = false;
        fetchSchedules({ page: 1, limit: 10 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authToken]);

    // ==========================================
    // MEMOIZED VALUE
    // ==========================================
    const value = useMemo(
        () => ({
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
            panelistSummary,

            // CRUD
            fetchSchedules,
            getScheduleById,
            getSchedulesByDate,
            getUpcomingSchedules,
            createSchedule,
            updateSchedule,
            deleteSchedule,
            cancelSchedule,
            checkConflict,

            // Status & Panelist actions
            changeStatus,
            confirmPanelist,
            rejectPanelist,
            resetPanelistResponse,
            addPanelist,
            getPanelistStatus,

            // Detail helpers
            clearSelectedSchedule,

            // Utility
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
            setPanelistSummary,

            // URL
            scheduleUrl,
        }),
        [
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
            panelistSummary,
            fetchSchedules,
            getScheduleById,
            getSchedulesByDate,
            getUpcomingSchedules,
            createSchedule,
            updateSchedule,
            deleteSchedule,
            cancelSchedule,
            checkConflict,
            changeStatus,
            confirmPanelist,
            rejectPanelist,
            resetPanelistResponse,
            addPanelist,
            getPanelistStatus,
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
        ]
    );

    return (
        <ScheduleContext.Provider value={value}>
            {children}
        </ScheduleContext.Provider>
    );
};

export default ScheduleProvider;