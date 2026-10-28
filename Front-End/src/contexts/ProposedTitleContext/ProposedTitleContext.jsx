// src/contexts/ProposedTitleContext/ProposedTitleContext.jsx
import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    useMemo,
    useCallback,
    useRef,
} from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const ProposedTitleContext = createContext();

export const ProposedTitleProvider = ({ children }) => {
    const { authToken } = useContext(AuthContext);
    const [customError, setCustomError] = useState("");
    const [loading, setLoading] = useState(true);
    const [proposedTitles, setProposedTitles] = useState([]);
    const [singleProposedTitle, setSingleProposedTitle] = useState(null);
    const [totalProposedTitles, setTotalProposedTitles] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [groupIdFilter, setGroupIdFilter] = useState("");
    const [statusCounts, setStatusCounts] = useState([]);

    // ⭐ NEW — Additional filters (additive, safe)
    const [trackFilter, setTrackFilter] = useState("");
    const [scopeStatusFilter, setScopeStatusFilter] = useState("");
    const [assignedToFilter, setAssignedToFilter] = useState("");

    // Tracking
    const [trackingData, setTrackingData] = useState(null);
    const [trackingMatched, setTrackingMatched] = useState(null);

    // Chapter Completion
    const [chapterCompletionCache, setChapterCompletionCache] = useState({});
    const [chapterCompletionLoading, setChapterCompletionLoading] = useState(false);

    // Ready Titles
    const [readyTitles, setReadyTitles] = useState([]);
    const [totalReadyTitles, setTotalReadyTitles] = useState(0);
    const [readyTotalPages, setReadyTotalPages] = useState(1);
    const [readyCurrentPage, setReadyCurrentPage] = useState(1);
    const [readySearch, setReadySearch] = useState("");
    const [readyDateFrom, setReadyDateFrom] = useState("");
    const [readyDateTo, setReadyDateTo] = useState("");
    const [readyGroupIdFilter, setReadyGroupIdFilter] = useState("");

    // Archived Titles
    const [archivedTitles, setArchivedTitles] = useState([]);
    const [totalArchivedTitles, setTotalArchivedTitles] = useState(0);
    const [archivedTotalPages, setArchivedTotalPages] = useState(1);
    const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
    const [archivedSearch, setArchivedSearch] = useState("");
    const [archivedDateFrom, setArchivedDateFrom] = useState("");
    const [archivedDateTo, setArchivedDateTo] = useState("");
    const [archivedGroupIdFilter, setArchivedGroupIdFilter] = useState("");

    // ✅ Statistics State
    const [statisticsCards, setStatisticsCards] = useState(null);
    const [statisticsCharts, setStatisticsCharts] = useState(null);
    const [statisticsMentorship, setStatisticsMentorship] = useState(null);
    const [statisticsLoading, setStatisticsLoading] = useState(false);
    const [statisticsError, setStatisticsError] = useState("");
    const [statisticsLastUpdated, setStatisticsLastUpdated] = useState(null);
    const [statisticsGroupIdFilter, setStatisticsGroupIdFilter] = useState("");
    const [statisticsDateFrom, setStatisticsDateFrom] = useState("");
    const [statisticsDateTo, setStatisticsDateTo] = useState("");

    // ✅ NEW — Heatmap State
    const [heatmapData, setHeatmapData] = useState([]);
    const [heatmapLoading, setHeatmapLoading] = useState(false);
    const [heatmapError, setHeatmapError] = useState("");
    const [heatmapMode, setHeatmapMode] = useState("comment");

    // ⭐ NEW — Panel review sub-state (additive)
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState(null);

    // ⭐ NEW — Chapter Progression sub-state
    const [proceedingChapter, setProceedingChapter] = useState(false);
    const [progressionError, setProgressionError] = useState("");
    const [progressionSuccess, setProgressionSuccess] = useState(null);

    // Cache to avoid spamming the stats endpoint
    const statsCacheRef = useRef({ key: null, ts: 0 });

    const limit = 5;

    // ============================
    // FETCH PROPOSED TITLES (existing + new optional filters)
    // ============================
    const FetchProposedTitles = async (
        page = 1,
        limit = 5,
        searchTerm = "",
        fromDate = "",
        toDate = "",
        status = "",
        groupId = "",
        // ⭐ NEW optional params — safe to ignore
        track = "",
        scopeStatus = "",
        assignedTo = ""
    ) => {
        if (!authToken) return;

        try {
            setIsLoading(true);

            const params = { page, limit };
            if (searchTerm && searchTerm.trim() !== "") params.search = searchTerm.trim();
            if (fromDate && fromDate.trim() !== "") params.dateFrom = fromDate.trim();
            if (toDate && toDate.trim() !== "") params.dateTo = toDate.trim();
            if (status && status.trim() !== "") params.status = status.trim();
            if (groupId && groupId.trim() !== "") params.groupId = groupId.trim();
            // ⭐ NEW filters (optional)
            if (track && track.trim() !== "") params.track = track.trim();
            if (scopeStatus && scopeStatus.trim() !== "") params.scopeStatus = scopeStatus.trim();
            if (assignedTo && assignedTo.trim() !== "") params.assignedTo = assignedTo.trim();

            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles`,
                {
                    params,
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Cache-Control": "no-cache",
                    },
                }
            );

            const { data, totalPages, totalCount, currentPage } = res.data;

            setProposedTitles(data || []);
            setTotalProposedTitles(totalCount || 0);
            setTotalPages(totalPages || 1);
            setCurrentPage(currentPage || page);
        } catch (error) {
            console.error("Error fetching proposed titles:", error);
            setCustomError(error.response?.data?.message || "Failed to fetch proposed titles");
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // FETCH READY TITLES (unchanged)
    // ============================
    const FetchReadyTitle = async (
        page = 1,
        limit = 5,
        searchTerm = "",
        fromDate = "",
        toDate = "",
        groupId = ""
    ) => {
        if (!authToken) return;

        try {
            setIsLoading(true);

            const params = { page, limit };
            if (searchTerm && searchTerm.trim() !== "") params.search = searchTerm.trim();
            if (fromDate && fromDate.trim() !== "") params.dateFrom = fromDate.trim();
            if (toDate && toDate.trim() !== "") params.dateTo = toDate.trim();
            if (groupId && groupId.trim() !== "") params.groupId = groupId.trim();

            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/forreadystatus`,
                {
                    params,
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Cache-Control": "no-cache",
                    },
                }
            );

            const { data, totalPages, totalCount, currentPage } = res.data;

            setReadyTitles(data || []);
            setTotalReadyTitles(totalCount || 0);
            setReadyTotalPages(totalPages || 1);
            setReadyCurrentPage(currentPage || page);
        } catch (error) {
            console.error("Error fetching ready titles:", error);
            setCustomError(error.response?.data?.message || "Failed to fetch ready titles");
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // FETCH ARCHIVED TITLES (unchanged)
    // ============================
    const FetchArchivedTitle = async (
        page = 1,
        limit = 5,
        searchTerm = "",
        fromDate = "",
        toDate = "",
        groupId = ""
    ) => {
        if (!authToken) return;

        try {
            setIsLoading(true);

            const params = { page, limit };
            if (searchTerm && searchTerm.trim() !== "") params.search = searchTerm.trim();
            if (fromDate && fromDate.trim() !== "") params.dateFrom = fromDate.trim();
            if (toDate && toDate.trim() !== "") params.dateTo = toDate.trim();
            if (groupId && groupId.trim() !== "") params.groupId = groupId.trim();

            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/archived`,
                {
                    params,
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Cache-Control": "no-cache",
                    },
                }
            );

            const { data, totalPages, totalCount, currentPage } = res.data;

            setArchivedTitles(data || []);
            setTotalArchivedTitles(totalCount || 0);
            setArchivedTotalPages(totalPages || 1);
            setArchivedCurrentPage(currentPage || page);
        } catch (error) {
            console.error("Error fetching archived titles:", error);
            setCustomError(error.response?.data?.message || "Failed to fetch archived titles");
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // ✅ HELPER — Derive heatmap data from charts (unchanged)
    // ============================
    const deriveHeatmapData = useCallback((charts, mode = "comment") => {
        if (!charts) return [];

        if (mode === "combined" && Array.isArray(charts.activityByDate) && charts.activityByDate.length > 0) {
            return charts.activityByDate;
        }

        if (
            (mode === "comment" || mode === "combined") &&
            Array.isArray(charts.commentActivityByDate) &&
            charts.commentActivityByDate.length > 0
        ) {
            return charts.commentActivityByDate;
        }

        if (
            (mode === "proposal" || mode === "combined") &&
            Array.isArray(charts.proposalActivityByDate) &&
            charts.proposalActivityByDate.length > 0
        ) {
            return charts.proposalActivityByDate;
        }

        const recent = charts.recentComments || [];
        const map = {};
        recent.forEach((c) => {
            if (!c.createdAt) return;
            try {
                const d = new Date(c.createdAt);
                if (isNaN(d.getTime())) return;
                const key = d.toISOString().split("T")[0];
                map[key] = (map[key] || 0) + 1;
            } catch {
                /* ignore */
            }
        });

        return Object.entries(map)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => (a.date < b.date ? -1 : 1));
    }, []);

    // ============================
    // ✅ FETCH STATISTICS (unchanged)
    // ============================
    const FetchStatistics = useCallback(
        async ({ groupId = "", fromDate = "", toDate = "", force = false } = {}) => {
            if (!authToken) return null;

            const cacheKey = `${groupId || ""}::${fromDate || ""}::${toDate || ""}`;
            const now = Date.now();
            if (
                !force &&
                statsCacheRef.current.key === cacheKey &&
                now - statsCacheRef.current.ts < 5000 &&
                statisticsCards
            ) {
                return {
                    cards: statisticsCards,
                    charts: statisticsCharts,
                    mentorship: statisticsMentorship,
                    heatmap: heatmapData,
                    cached: true,
                };
            }

            try {
                setStatisticsLoading(true);
                setStatisticsError("");

                const params = {};
                if (groupId && groupId.trim() !== "") params.groupId = groupId.trim();
                if (fromDate && fromDate.trim() !== "") params.dateFrom = fromDate.trim();
                if (toDate && toDate.trim() !== "") params.dateTo = toDate.trim();

                const res = await axios.get(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/statistics`,
                    {
                        params,
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Cache-Control": "no-cache",
                        },
                    }
                );

                const { cards, charts, mentorship } = res.data;

                if (cards) setStatisticsCards(cards);
                if (charts) setStatisticsCharts(charts);
                if (mentorship) setStatisticsMentorship(mentorship);

                const derivedHeatmap = deriveHeatmapData(charts, heatmapMode);
                setHeatmapData(derivedHeatmap);
                setHeatmapError("");

                setStatisticsLastUpdated(new Date().toISOString());

                statsCacheRef.current = { key: cacheKey, ts: now };

                return { cards, charts, mentorship, heatmap: derivedHeatmap };
            } catch (error) {
                console.error("Error fetching statistics:", error);
                const msg =
                    error.response?.data?.message || "Failed to fetch statistics";
                setStatisticsError(msg);
                setHeatmapError(msg);
                setCustomError(msg);
                return null;
            } finally {
                setStatisticsLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [authToken, heatmapMode, deriveHeatmapData]
    );

    // ============================
    // ✅ REFRESH STATISTICS (unchanged)
    // ============================
    const RefreshStatistics = useCallback(
        (opts = {}) =>
            FetchStatistics({
                groupId: statisticsGroupIdFilter,
                fromDate: statisticsDateFrom,
                toDate: statisticsDateTo,
                force: true,
                ...opts,
            }),
        [FetchStatistics, statisticsGroupIdFilter, statisticsDateFrom, statisticsDateTo]
    );

    // ============================
    // ✅ FETCH HEATMAP DATA (unchanged)
    // ============================
    const FetchHeatmapData = useCallback(
        async ({ mode = heatmapMode, force = false } = {}) => {
            if (!authToken) return [];

            if (!force && statisticsCharts) {
                const derived = deriveHeatmapData(statisticsCharts, mode);
                setHeatmapData(derived);
                return derived;
            }

            try {
                setHeatmapLoading(true);
                setHeatmapError("");

                const params = {};
                if (statisticsGroupIdFilter) params.groupId = statisticsGroupIdFilter;
                if (statisticsDateFrom) params.dateFrom = statisticsDateFrom;
                if (statisticsDateTo) params.dateTo = statisticsDateTo;

                const res = await axios.get(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/statistics`,
                    {
                        params,
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Cache-Control": "no-cache",
                        },
                    }
                );

                const charts = res.data?.charts || null;
                const derived = deriveHeatmapData(charts, mode);
                setHeatmapData(derived);
                if (charts) setStatisticsCharts(charts);

                return derived;
            } catch (error) {
                console.error("Error fetching heatmap data:", error);
                const msg =
                    error.response?.data?.message || "Failed to fetch heatmap data";
                setHeatmapError(msg);
                return [];
            } finally {
                setHeatmapLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            authToken,
            heatmapMode,
            deriveHeatmapData,
            statisticsCharts,
            statisticsGroupIdFilter,
            statisticsDateFrom,
            statisticsDateTo,
        ]
    );

    // ============================
    // ✅ CHANGE HEATMAP MODE (unchanged)
    // ============================
    const ChangeHeatmapMode = useCallback(
        (mode) => {
            if (!["comment", "proposal", "combined"].includes(mode)) return;
            setHeatmapMode(mode);
            if (statisticsCharts) {
                const derived = deriveHeatmapData(statisticsCharts, mode);
                setHeatmapData(derived);
            }
        },
        [statisticsCharts, deriveHeatmapData]
    );

    // ============================
    // RESET STATISTICS FILTERS (unchanged)
    // ============================
    const ResetStatisticsFilters = () => {
        setStatisticsGroupIdFilter("");
        setStatisticsDateFrom("");
        setStatisticsDateTo("");
    };

    // ============================
    // FETCH SINGLE PROPOSED TITLE BY ID (unchanged)
    // ============================
    const FetchProposedTitleById = async (id) => {
        if (!authToken || !id) return;

        try {
            setIsLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${id}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            setSingleProposedTitle(res.data.data);
            return res.data.data;
        } catch (error) {
            console.error("Error fetching proposed title:", error);
            setCustomError(error.response?.data?.message || "Failed to fetch proposed title");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // GET BY TRACKING ID (unchanged)
    // ============================
    const GetByTrackingID = async (trackingId) => {
        if (!authToken || !trackingId) return null;

        try {
            setIsLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/tracking/${trackingId}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Cache-Control": "no-cache",
                    },
                }
            );

            const { data, matchedTracking } = res.data;

            setTrackingData(data || null);
            setTrackingMatched(matchedTracking || null);

            return { data, matchedTracking };
        } catch (error) {
            console.error("Error fetching by tracking ID:", error);
            setCustomError(error.response?.data?.message || "Failed to fetch tracking data");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // 📄 GET PDF AS BLOB URL (unchanged)
    // ============================
    const GetPdfBlobUrl = async (trackingId) => {
        if (!authToken || !trackingId) return null;

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/pdf/${trackingId}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Cache-Control": "no-cache",
                    },
                    responseType: "blob",
                }
            );

            const contentType = res.headers["content-type"] || "";
            if (
                !contentType.includes("pdf") &&
                !contentType.includes("octet-stream") &&
                !contentType.includes("application/")
            ) {
                console.error("❌ Not a PDF response. Content-Type:", contentType);
                return null;
            }

            const blob = new Blob([res.data], { type: "application/pdf" });
            return window.URL.createObjectURL(blob);
        } catch (error) {
            console.error("❌ Error fetching PDF blob:", error);
            if (error.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    console.error("   Response:", text);
                } catch {
                    /* ignore */
                }
            }
            return null;
        }
    };

    // ============================
    // CREATE PROPOSED TITLE (unchanged)
    // ============================
    const CreateProposedTitle = async (formData) => {
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const status = res.data?.status;

            if (status === true || status === "success") {
                await FetchProposedTitles(
                    currentPage,
                    limit,
                    search,
                    dateFrom,
                    dateTo,
                    statusFilter,
                    groupIdFilter
                );
                RefreshStatistics({ force: true });

                return { success: true, data: res.data.data };
            }

            setCustomError("Failed to create proposed title.");
            return { success: false };
        } catch (error) {
            console.error("Create Proposed Title Error:", error);

            let errorMessage = "Something went wrong.";
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                errorMessage =
                    typeof errorData === "string"
                        ? errorData
                        : errorData.message || errorData.error || "Something went wrong.";
            } else if (error.request) {
                errorMessage = "No response from the server.";
            } else {
                errorMessage = error.message || "Unexpected error occurred.";
            }

            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // ============================
    // UPDATE PROPOSED TITLE (unchanged)
    // ============================
    const UpdateProposedTitle = async (id, updateData) => {
        if (!authToken || !id) return;

        try {
            setIsLoading(true);
            const res = await axios.patch(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${id}`,
                updateData,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.data.status === "success") {
                await FetchProposedTitles(
                    currentPage,
                    limit,
                    search,
                    dateFrom,
                    dateTo,
                    statusFilter,
                    groupIdFilter
                );
                RefreshStatistics({ force: true });

                return { success: true, data: res.data.data };
            }

            return { success: false };
        } catch (error) {
            console.error("Update Proposed Title Error:", error);
            const errorMessage = error.response?.data?.message || "Failed to update proposed title";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // DELETE PROPOSED TITLE (unchanged)
    // ============================
    const DeleteProposedTitle = async (id) => {
        if (!authToken || !id) return;

        try {
            setIsLoading(true);
            const res = await axios.delete(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${id}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            if (res.data.status === "success") {
                await FetchProposedTitles(
                    currentPage,
                    limit,
                    search,
                    dateFrom,
                    dateTo,
                    statusFilter,
                    groupIdFilter
                );
                RefreshStatistics({ force: true });

                return { success: true };
            }

            return { success: false };
        } catch (error) {
            console.error("Delete Proposed Title Error:", error);
            const errorMessage = error.response?.data?.message || "Failed to delete proposed title";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // BULK UPDATE STATUS (unchanged)
    // ============================
    const BulkUpdateStatus = async (ids, status, remarks = "") => {
        if (!authToken || !ids || ids.length === 0) return;

        try {
            setIsLoading(true);
            const res = await axios.patch(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/bulk/status`,
                { ids, status, remarks },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.data.status === "success") {
                await FetchProposedTitles(
                    currentPage,
                    limit,
                    search,
                    dateFrom,
                    dateTo,
                    statusFilter,
                    groupIdFilter
                );
                RefreshStatistics({ force: true });

                return { success: true, data: res.data.data };
            }

            return { success: false };
        } catch (error) {
            console.error("Bulk Update Status Error:", error);
            const errorMessage = error.response?.data?.message || "Failed to update statuses";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // MARK CHAPTER AS COMPLETE (unchanged)
    // ============================
    const MarkChapterComplete = async (proposedTitleId, trackingId, isCompleted = true) => {
        if (!authToken || !proposedTitleId || !trackingId) {
            return { success: false, error: "Missing required IDs" };
        }

        try {
            setIsLoading(true);
            const res = await axios.patch(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${proposedTitleId}/tracking/${trackingId}/complete`,
                { isCompleted },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.data.status === "success") {
                const updated = res.data.data;

                setProposedTitles((prev) =>
                    prev.map((pt) =>
                        pt._id === proposedTitleId
                            ? {
                                ...pt,
                                completedChapters: updated.completedChapters,
                                isAllChaptersCompleted: updated.isAllChaptersCompleted,
                                titleUrlTracking: (pt.titleUrlTracking || []).map((t) =>
                                    t._id === trackingId
                                        ? {
                                            ...t,
                                            isCompleted: updated.isCompleted,
                                            completedAt: updated.completedAt,
                                            completedBy: updated.completedBy,
                                        }
                                        : t
                                ),
                            }
                            : pt
                    )
                );

                setSingleProposedTitle((prev) =>
                    prev && prev._id === proposedTitleId
                        ? {
                            ...prev,
                            completedChapters: updated.completedChapters,
                            isAllChaptersCompleted: updated.isAllChaptersCompleted,
                            titleUrlTracking: (prev.titleUrlTracking || []).map((t) =>
                                t._id === trackingId
                                    ? {
                                        ...t,
                                        isCompleted: updated.isCompleted,
                                        completedAt: updated.completedAt,
                                        completedBy: updated.completedBy,
                                    }
                                    : t
                            ),
                        }
                        : prev
                );

                setChapterCompletionCache((prev) => ({
                    ...prev,
                    [proposedTitleId]: {
                        ...(prev[proposedTitleId] || {}),
                        completedChapters: updated.completedChapters,
                        isAllChaptersCompleted: updated.isAllChaptersCompleted,
                    },
                }));

                RefreshStatistics({ force: true });

                return { success: true, data: updated };
            }

            setCustomError("Failed to mark chapter as complete.");
            return { success: false };
        } catch (error) {
            console.error("Mark Chapter Complete Error:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to mark chapter as complete";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // MARK ALL CHAPTERS COMPLETE (unchanged)
    // ============================
    const MarkAllChaptersComplete = async (proposedTitleId, isCompleted = true) => {
        if (!authToken || !proposedTitleId) {
            return { success: false, error: "Missing proposedTitleId" };
        }

        try {
            setIsLoading(true);
            const res = await axios.patch(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${proposedTitleId}/chapters/complete-all`,
                { isCompleted },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.data.status === "success") {
                const updated = res.data.data;

                setProposedTitles((prev) =>
                    prev.map((pt) =>
                        pt._id === proposedTitleId
                            ? {
                                ...pt,
                                completedChapters: updated.completedChapters,
                                isAllChaptersCompleted: updated.isAllChaptersCompleted,
                            }
                            : pt
                    )
                );

                setSingleProposedTitle((prev) =>
                    prev && prev._id === proposedTitleId
                        ? {
                            ...prev,
                            completedChapters: updated.completedChapters,
                            isAllChaptersCompleted: updated.isAllChaptersCompleted,
                        }
                        : prev
                );

                setChapterCompletionCache((prev) => ({
                    ...prev,
                    [proposedTitleId]: {
                        ...(prev[proposedTitleId] || {}),
                        completedChapters: updated.completedChapters,
                        isAllChaptersCompleted: updated.isAllChaptersCompleted,
                    },
                }));

                RefreshStatistics({ force: true });

                return { success: true, data: updated };
            }

            setCustomError("Failed to mark all chapters as complete.");
            return { success: false };
        } catch (error) {
            console.error("Mark All Chapters Complete Error:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to mark all chapters as complete";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // GET CHAPTER COMPLETION (unchanged)
    // ============================
    const GetChapterCompletion = async (proposedTitleId, { force = false } = {}) => {
        if (!authToken || !proposedTitleId) return null;

        if (!force && chapterCompletionCache[proposedTitleId]) {
            return chapterCompletionCache[proposedTitleId];
        }

        try {
            setChapterCompletionLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${proposedTitleId}/chapters`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Cache-Control": "no-cache",
                    },
                }
            );

            if (res.data.status === "success") {
                const data = res.data.data;

                setChapterCompletionCache((prev) => ({
                    ...prev,
                    [proposedTitleId]: data,
                }));

                return data;
            }

            return null;
        } catch (error) {
            console.error("Get Chapter Completion Error:", error);
            setCustomError(
                error.response?.data?.message || "Failed to fetch chapter completion"
            );
            return null;
        } finally {
            setChapterCompletionLoading(false);
        }
    };

    // ============================
    // CLEAR CHAPTER CACHE (unchanged)
    // ============================
    const ClearChapterCompletionCache = (proposedTitleId = null) => {
        if (proposedTitleId) {
            setChapterCompletionCache((prev) => {
                const next = { ...prev };
                delete next[proposedTitleId];
                return next;
            });
        } else {
            setChapterCompletionCache({});
        }
    };

    // ============================
    // ⭐ NEW — PROCEED CHAPTER (Subject Instructor only)
    //   PATCH /:id/chapters/:chapter/proceed
    // ============================
    const ProceedChapter = useCallback(
        async (proposedTitleId, chapter, feedback = "") => {
            if (!authToken || !proposedTitleId || !chapter) {
                return { success: false, error: "Missing required fields" };
            }

            setProceedingChapter(true);
            setProgressionError("");
            setProgressionSuccess(null);

            try {
                const res = await axios.patch(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${proposedTitleId}/chapters/${encodeURIComponent(chapter)}/proceed`,
                    { feedback },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (res.data?.status === "success") {
                    const updated = res.data.data;
                    const nextChapter = res.data?.nextChapter || null;

                    // Update local state optimistically
                    setProposedTitles((prev) =>
                        prev.map((pt) =>
                            pt._id === proposedTitleId
                                ? {
                                    ...pt,
                                    chapterProgressionApprovals:
                                        updated.chapterProgressionApprovals ||
                                        pt.chapterProgressionApprovals,
                                    chapterProgressionApprovedBy:
                                        updated.chapterProgressionApprovedBy ||
                                        pt.chapterProgressionApprovedBy,
                                    chapterProgressionApprovedAt:
                                        updated.chapterProgressionApprovedAt ||
                                        pt.chapterProgressionApprovedAt,
                                    nextAllowedChapter:
                                        updated.nextAllowedChapter ?? pt.nextAllowedChapter,
                                    lockedChapters:
                                        updated.lockedChapters ?? pt.lockedChapters,
                                }
                                : pt
                        )
                    );

                    setSingleProposedTitle((prev) =>
                        prev && prev._id === proposedTitleId
                            ? { ...prev, ...updated }
                            : prev
                    );

                    RefreshStatistics({ force: true });

                    setProgressionSuccess({ chapter, nextChapter });
                    return { success: true, data: updated, nextChapter };
                }

                const msg = "Failed to proceed chapter";
                setProgressionError(msg);
                return { success: false, error: msg };
            } catch (error) {
                console.error("Proceed Chapter Error:", error);
                const msg =
                    error.response?.data?.message || "Failed to proceed chapter";
                setProgressionError(msg);
                setCustomError(msg);
                return { success: false, error: msg };
            } finally {
                setProceedingChapter(false);
            }
        },
        [authToken, RefreshStatistics]
    );

    // ============================
    // ⭐ NEW — REJECT CHAPTER (Subject Instructor only)
    //   PATCH /:id/chapters/:chapter/reject
    // ============================
    const RejectChapter = useCallback(
        async (proposedTitleId, chapter, feedback = "") => {
            if (!authToken || !proposedTitleId || !chapter) {
                return { success: false, error: "Missing required fields" };
            }
            if (!feedback?.trim()) {
                return { success: false, error: "Feedback is required to reject" };
            }

            setProceedingChapter(true);
            setProgressionError("");
            setProgressionSuccess(null);

            try {
                const res = await axios.patch(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${proposedTitleId}/chapters/${encodeURIComponent(chapter)}/reject`,
                    { feedback },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (res.data?.status === "success") {
                    const updated = res.data.data;

                    setProposedTitles((prev) =>
                        prev.map((pt) =>
                            pt._id === proposedTitleId
                                ? {
                                    ...pt,
                                    chapterProgressionApprovals:
                                        updated.chapterProgressionApprovals ||
                                        pt.chapterProgressionApprovals,
                                    nextAllowedChapter:
                                        updated.nextAllowedChapter ?? pt.nextAllowedChapter,
                                    lockedChapters:
                                        updated.lockedChapters ?? pt.lockedChapters,
                                }
                                : pt
                        )
                    );

                    setSingleProposedTitle((prev) =>
                        prev && prev._id === proposedTitleId
                            ? { ...prev, ...updated }
                            : prev
                    );

                    RefreshStatistics({ force: true });

                    setProgressionSuccess({ chapter, rejected: true });
                    return { success: true, data: updated };
                }

                const msg = "Failed to reject chapter";
                setProgressionError(msg);
                return { success: false, error: msg };
            } catch (error) {
                console.error("Reject Chapter Error:", error);
                const msg =
                    error.response?.data?.message || "Failed to reject chapter";
                setProgressionError(msg);
                setCustomError(msg);
                return { success: false, error: msg };
            } finally {
                setProceedingChapter(false);
            }
        },
        [authToken, RefreshStatistics]
    );

    // ============================
    // ⭐ NEW — GET CHAPTER PROGRESSION (fetch fresh)
    //   GET /:id/chapters/progression
    //   Returns fresh progression data from server
    // ============================
    const GetChapterProgression = useCallback(
        async (proposedTitleId) => {
            if (!authToken || !proposedTitleId) return null;

            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${proposedTitleId}/chapters/progression`,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Cache-Control": "no-cache",
                        },
                    }
                );

                if (res.data?.status === "success") {
                    return res.data.data;
                }
                return null;
            } catch (error) {
                console.error("Get Chapter Progression Error:", error);
                return null;
            }
        },
        [authToken]
    );

    // ============================
    // GET PROPOSED TITLES BY GROUP (unchanged)
    // ============================
    const GetProposedTitlesByGroup = async (groupId) => {
        if (!authToken || !groupId) return;

        try {
            setIsLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/group/${groupId}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            return res.data.data;
        } catch (error) {
            console.error("Error fetching proposed titles by group:", error);
            setCustomError(error.response?.data?.message || "Failed to fetch proposed titles by group");
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // GET PROPOSED TITLES BY STATUS (unchanged)
    // ============================
    const GetProposedTitlesByStatus = async (status) => {
        if (!authToken || !status) return;

        try {
            setIsLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/status/${status}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            return res.data.data;
        } catch (error) {
            console.error("Error fetching proposed titles by status:", error);
            setCustomError(error.response?.data?.message || "Failed to fetch proposed titles by status");
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // GET FILE FROM CLOUDINARY (unchanged)
    // ============================
    const GetFileFromCloudinary = async (id) => {
        if (!authToken || !id) return;

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${id}/file`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                    responseType: "blob",
                }
            );

            const fileURL = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = fileURL;

            const contentDisposition = res.headers["content-disposition"];
            let filename = "document.pdf";
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            return { success: true };
        } catch (error) {
            console.error("Error fetching file:", error);
            setCustomError(error.response?.data?.message || "Failed to fetch file");
            return { success: false };
        }
    };

    // ============================
    // VIEW FILE IN NEW TAB (unchanged)
    // ============================
    const ViewFileInNewTab = async (id) => {
        if (!authToken || !id) return;

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${id}/file`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                    responseType: "blob",
                }
            );

            const fileURL = window.URL.createObjectURL(new Blob([res.data]));
            window.open(fileURL, "_blank");

            return { success: true };
        } catch (error) {
            console.error("Error viewing file:", error);
            setCustomError(error.response?.data?.message || "Failed to view file");
            return { success: false };
        }
    };

    // ============================
    // RESET FILTERS (existing + new)
    // ============================
    const ResetFilters = () => {
        setSearch("");
        setDateFrom("");
        setDateTo("");
        setStatusFilter("");
        setGroupIdFilter("");
        // ⭐ NEW reset
        setTrackFilter("");
        setScopeStatusFilter("");
        setAssignedToFilter("");
        setCurrentPage(1);
    };

    const ResetReadyFilters = () => {
        setReadySearch("");
        setReadyDateFrom("");
        setReadyDateTo("");
        setReadyGroupIdFilter("");
        setReadyCurrentPage(1);
    };

    const ResetArchivedFilters = () => {
        setArchivedSearch("");
        setArchivedDateFrom("");
        setArchivedDateTo("");
        setArchivedGroupIdFilter("");
        setArchivedCurrentPage(1);
    };

    // ============================
    // ⭐ NEW — SUBMIT PANEL REVIEW
    //   POST /:id/review
    //   Body: { decision, feedback, scores }
    // ============================
    const SubmitPanelReview = useCallback(
        async (proposedTitleId, { decision, feedback = "", scores = {} } = {}) => {
            if (!authToken || !proposedTitleId) {
                return { success: false, error: "Missing required fields" };
            }
            if (!decision) {
                return { success: false, error: "decision is required" };
            }

            setReviewSubmitting(true);
            setReviewError("");
            setReviewSuccess(null);

            try {
                const res = await axios.post(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${proposedTitleId}/review`,
                    { decision, feedback, scores },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (res.data?.status === "success") {
                    const updated = res.data.data;

                    // Update local state
                    setProposedTitles((prev) =>
                        prev.map((pt) => (pt._id === proposedTitleId ? { ...pt, ...updated } : pt))
                    );
                    setSingleProposedTitle((prev) =>
                        prev && prev._id === proposedTitleId ? { ...prev, ...updated } : prev
                    );

                    setReviewSuccess(updated);
                    RefreshStatistics({ force: true });

                    return { success: true, data: updated };
                }

                const msg = "Failed to submit review";
                setReviewError(msg);
                return { success: false, error: msg };
            } catch (error) {
                console.error("Submit Panel Review Error:", error);
                const msg =
                    error.response?.data?.message || "Failed to submit panel review";
                setReviewError(msg);
                setCustomError(msg);
                return { success: false, error: msg };
            } finally {
                setReviewSubmitting(false);
            }
        },
        [authToken, RefreshStatistics]
    );

    // ============================
    // ⭐ NEW — ASSIGN REVIEWERS
    //   POST /:id/reviewers
    //   Body: { reviewerIds: [] }
    // ============================
    const AssignReviewers = useCallback(
        async (proposedTitleId, reviewerIds = []) => {
            if (!authToken || !proposedTitleId) {
                return { success: false, error: "Missing required fields" };
            }
            if (!Array.isArray(reviewerIds) || reviewerIds.length === 0) {
                return { success: false, error: "reviewerIds array is required" };
            }

            try {
                const res = await axios.post(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${proposedTitleId}/reviewers`,
                    { reviewerIds },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (res.data?.status === "success") {
                    const updated = res.data.data;
                    setProposedTitles((prev) =>
                        prev.map((pt) => (pt._id === proposedTitleId ? { ...pt, ...updated } : pt))
                    );
                    setSingleProposedTitle((prev) =>
                        prev && prev._id === proposedTitleId ? { ...prev, ...updated } : prev
                    );
                    RefreshStatistics({ force: true });
                    return { success: true, data: updated };
                }
                return { success: false, error: "Failed to assign reviewers" };
            } catch (error) {
                console.error("Assign Reviewers Error:", error);
                const msg =
                    error.response?.data?.message || "Failed to assign reviewers";
                setCustomError(msg);
                return { success: false, error: msg };
            }
        },
        [authToken, RefreshStatistics]
    );

    // ============================
    // ⭐ NEW — UPDATE RUBRIC SCORES
    //   PATCH /:id/rubric
    // ============================
    const UpdateRubricScores = useCallback(
        async (
            proposedTitleId,
            {
                scientificSignificance,
                technicalNovelty,
                methodologyRigor,
                resourceFeasibility,
            } = {}
        ) => {
            if (!authToken || !proposedTitleId) {
                return { success: false, error: "Missing required fields" };
            }

            try {
                const res = await axios.patch(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${proposedTitleId}/rubric`,
                    {
                        scientificSignificance,
                        technicalNovelty,
                        methodologyRigor,
                        resourceFeasibility,
                    },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (res.data?.status === "success") {
                    const updated = res.data.data;
                    setProposedTitles((prev) =>
                        prev.map((pt) => (pt._id === proposedTitleId ? { ...pt, ...updated } : pt))
                    );
                    setSingleProposedTitle((prev) =>
                        prev && prev._id === proposedTitleId ? { ...prev, ...updated } : prev
                    );
                    RefreshStatistics({ force: true });
                    return { success: true, data: updated };
                }
                return { success: false, error: "Failed to update rubric scores" };
            } catch (error) {
                console.error("Update Rubric Scores Error:", error);
                const msg =
                    error.response?.data?.message || "Failed to update rubric scores";
                setCustomError(msg);
                return { success: false, error: msg };
            }
        },
        [authToken, RefreshStatistics]
    );

    // ============================
    // ⭐ NEW — UPDATE SCOPE STATUS
    //   PATCH /:id/scope
    // ============================
    const UpdateScopeStatus = useCallback(
        async (proposedTitleId, scopeStatus) => {
            if (!authToken || !proposedTitleId || !scopeStatus) {
                return { success: false, error: "Missing required fields" };
            }

            const allowed = ["Pending", "Unrated", "Approved", "Rejected", "Needs Revision"];
            if (!allowed.includes(scopeStatus)) {
                return { success: false, error: "Invalid scopeStatus" };
            }

            try {
                const res = await axios.patch(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${proposedTitleId}/scope`,
                    { scopeStatus },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (res.data?.status === "success") {
                    const updated = res.data.data;
                    setProposedTitles((prev) =>
                        prev.map((pt) => (pt._id === proposedTitleId ? { ...pt, ...updated } : pt))
                    );
                    setSingleProposedTitle((prev) =>
                        prev && prev._id === proposedTitleId ? { ...prev, ...updated } : prev
                    );
                    RefreshStatistics({ force: true });
                    return { success: true, data: updated };
                }
                return { success: false, error: "Failed to update scope status" };
            } catch (error) {
                console.error("Update Scope Status Error:", error);
                const msg =
                    error.response?.data?.message || "Failed to update scope status";
                setCustomError(msg);
                return { success: false, error: msg };
            }
        },
        [authToken, RefreshStatistics]
    );

    // ============================
    // ⭐ NEW — UPDATE PANEL DECISION
    //   PATCH /:id/panel-decision
    // ============================
    const UpdatePanelDecision = useCallback(
        async (proposedTitleId, panelDecision, panelFeedback = "") => {
            if (!authToken || !proposedTitleId || !panelDecision) {
                return { success: false, error: "Missing required fields" };
            }

            try {
                const res = await axios.patch(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${proposedTitleId}/panel-decision`,
                    { panelDecision, panelFeedback },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (res.data?.status === "success") {
                    const updated = res.data.data;
                    setProposedTitles((prev) =>
                        prev.map((pt) => (pt._id === proposedTitleId ? { ...pt, ...updated } : pt))
                    );
                    setSingleProposedTitle((prev) =>
                        prev && prev._id === proposedTitleId ? { ...prev, ...updated } : prev
                    );
                    RefreshStatistics({ force: true });
                    return { success: true, data: updated };
                }
                return { success: false, error: "Failed to update panel decision" };
            } catch (error) {
                console.error("Update Panel Decision Error:", error);
                const msg =
                    error.response?.data?.message || "Failed to update panel decision";
                setCustomError(msg);
                return { success: false, error: msg };
            }
        },
        [authToken, RefreshStatistics]
    );

    // ============================
    // ⭐ NEW — UPDATE DEFENSE SCHEDULE
    //   PATCH /:id/defense-schedule
    // ============================
    const UpdateDefenseSchedule = useCallback(
        async (
            proposedTitleId,
            { scheduledAt, venue, modality, zoomLink, zoomPasscode, panelQuorum } = {}
        ) => {
            if (!authToken || !proposedTitleId) {
                return { success: false, error: "Missing required fields" };
            }

            try {
                const res = await axios.patch(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${proposedTitleId}/defense-schedule`,
                    { scheduledAt, venue, modality, zoomLink, zoomPasscode, panelQuorum },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (res.data?.status === "success") {
                    const updated = res.data.data;
                    setProposedTitles((prev) =>
                        prev.map((pt) => (pt._id === proposedTitleId ? { ...pt, ...updated } : pt))
                    );
                    setSingleProposedTitle((prev) =>
                        prev && prev._id === proposedTitleId ? { ...prev, ...updated } : prev
                    );
                    RefreshStatistics({ force: true });
                    return { success: true, data: updated };
                }
                return { success: false, error: "Failed to update defense schedule" };
            } catch (error) {
                console.error("Update Defense Schedule Error:", error);
                const msg =
                    error.response?.data?.message || "Failed to update defense schedule";
                setCustomError(msg);
                return { success: false, error: msg };
            }
        },
        [authToken, RefreshStatistics]
    );

    // ============================
    // ⭐ NEW — UPDATE OBJECTIVES
    //   PUT /:id/objectives
    // ============================
    const UpdateObjectives = useCallback(
        async (proposedTitleId, objectives = []) => {
            if (!authToken || !proposedTitleId) {
                return { success: false, error: "Missing required fields" };
            }
            if (!Array.isArray(objectives)) {
                return { success: false, error: "objectives array required" };
            }

            try {
                const res = await axios.put(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/proposed-titles/${proposedTitleId}/objectives`,
                    { objectives },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (res.data?.status === "success") {
                    const updated = res.data.data;
                    setProposedTitles((prev) =>
                        prev.map((pt) => (pt._id === proposedTitleId ? { ...pt, ...updated } : pt))
                    );
                    setSingleProposedTitle((prev) =>
                        prev && prev._id === proposedTitleId ? { ...prev, ...updated } : prev
                    );
                    return { success: true, data: updated };
                }
                return { success: false, error: "Failed to update objectives" };
            } catch (error) {
                console.error("Update Objectives Error:", error);
                const msg =
                    error.response?.data?.message || "Failed to update objectives";
                setCustomError(msg);
                return { success: false, error: msg };
            }
        },
        [authToken]
    );

    // ============================
    // AUTO-FETCH ON FILTER CHANGE (existing + new filters)
    // ============================
    useEffect(() => {
        if (!authToken) return;
        FetchProposedTitles(
            currentPage,
            limit,
            search,
            dateFrom,
            dateTo,
            statusFilter,
            groupIdFilter,
            // ⭐ NEW optional filters
            trackFilter,
            scopeStatusFilter,
            assignedToFilter
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        authToken,
        search,
        dateFrom,
        dateTo,
        statusFilter,
        groupIdFilter,
        trackFilter,
        scopeStatusFilter,
        assignedToFilter,
    ]);

    useEffect(() => {
        if (!authToken) return;
        FetchReadyTitle(
            readyCurrentPage,
            limit,
            readySearch,
            readyDateFrom,
            readyDateTo,
            readyGroupIdFilter
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        authToken,
        readyCurrentPage,
        readySearch,
        readyDateFrom,
        readyDateTo,
        readyGroupIdFilter,
    ]);

    useEffect(() => {
        if (!authToken) return;
        FetchArchivedTitle(
            archivedCurrentPage,
            limit,
            archivedSearch,
            archivedDateFrom,
            archivedDateTo,
            archivedGroupIdFilter
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        authToken,
        archivedCurrentPage,
        archivedSearch,
        archivedDateFrom,
        archivedDateTo,
        archivedGroupIdFilter,
    ]);

    // ============================
    // ✅ AUTO-FETCH STATISTICS (debounced) — unchanged
    // ============================
    const statsFilterKey = useMemo(
        () => `${statisticsGroupIdFilter}::${statisticsDateFrom}::${statisticsDateTo}`,
        [statisticsGroupIdFilter, statisticsDateFrom, statisticsDateTo]
    );

    useEffect(() => {
        if (!authToken) return;

        const t = setTimeout(() => {
            FetchStatistics({
                groupId: statisticsGroupIdFilter,
                fromDate: statisticsDateFrom,
                toDate: statisticsDateTo,
            });
        }, 250);

        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authToken, statsFilterKey]);

    // ============================
    // PROVIDER
    // ============================
    return (
        <ProposedTitleContext.Provider
            value={{
                // State
                proposedTitles,
                singleProposedTitle,
                totalProposedTitles,
                isLoading,
                loading,
                totalPages,
                currentPage,
                setCurrentPage,
                limit,
                search,
                setSearch,
                dateFrom,
                setDateFrom,
                dateTo,
                setDateTo,
                statusFilter,
                setStatusFilter,
                groupIdFilter,
                setGroupIdFilter,
                customError,
                statusCounts,

                // ⭐ NEW filters
                trackFilter,
                setTrackFilter,
                scopeStatusFilter,
                setScopeStatusFilter,
                assignedToFilter,
                setAssignedToFilter,

                // Tracking
                trackingData,
                trackingMatched,

                // Chapter Completion
                chapterCompletionCache,
                chapterCompletionLoading,

                // Ready Titles
                readyTitles,
                totalReadyTitles,
                readyTotalPages,
                readyCurrentPage,
                setReadyCurrentPage,
                readySearch,
                setReadySearch,
                readyDateFrom,
                setReadyDateFrom,
                readyDateTo,
                setReadyDateTo,
                readyGroupIdFilter,
                setReadyGroupIdFilter,

                // Archived Titles
                archivedTitles,
                totalArchivedTitles,
                archivedTotalPages,
                archivedCurrentPage,
                setArchivedCurrentPage,
                archivedSearch,
                setArchivedSearch,
                archivedDateFrom,
                setArchivedDateFrom,
                archivedDateTo,
                setArchivedDateTo,
                archivedGroupIdFilter,
                setArchivedGroupIdFilter,

                // ✅ Statistics
                statisticsCards,
                statisticsCharts,
                statisticsMentorship,
                setStatisticsMentorship,
                statisticsLoading,
                statisticsError,
                statisticsLastUpdated,
                statisticsGroupIdFilter,
                setStatisticsGroupIdFilter,
                statisticsDateFrom,
                setStatisticsDateFrom,
                statisticsDateTo,
                setStatisticsDateTo,

                // ✅ Heatmap
                heatmapData,
                heatmapLoading,
                heatmapError,
                heatmapMode,
                setHeatmapMode,
                ChangeHeatmapMode,
                FetchHeatmapData,
                deriveHeatmapData,

                // ⭐ NEW — Panel Review state
                reviewSubmitting,
                reviewError,
                reviewSuccess,

                // ⭐ NEW — Chapter Progression state
                proceedingChapter,
                progressionError,
                progressionSuccess,

                // Functions (existing)
                FetchProposedTitles,
                FetchReadyTitle,
                FetchArchivedTitle,
                FetchStatistics,
                RefreshStatistics,
                FetchProposedTitleById,
                GetByTrackingID,
                GetPdfBlobUrl,
                CreateProposedTitle,
                UpdateProposedTitle,
                DeleteProposedTitle,
                BulkUpdateStatus,
                GetProposedTitlesByGroup,
                GetProposedTitlesByStatus,
                GetFileFromCloudinary,
                ViewFileInNewTab,
                ResetFilters,
                ResetReadyFilters,
                ResetArchivedFilters,
                ResetStatisticsFilters,
                MarkChapterComplete,
                MarkAllChaptersComplete,
                GetChapterCompletion,
                ClearChapterCompletionCache,

                // ⭐ NEW — Panel Review functions
                SubmitPanelReview,
                AssignReviewers,
                UpdateRubricScores,
                UpdateScopeStatus,
                UpdatePanelDecision,
                UpdateDefenseSchedule,
                UpdateObjectives,

                // ⭐ NEW — Chapter Progression functions
                ProceedChapter,
                RejectChapter,
                GetChapterProgression,
            }}
        >
            {children}
        </ProposedTitleContext.Provider>
    );
};