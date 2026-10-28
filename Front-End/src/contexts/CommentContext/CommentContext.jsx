import React, {
    createContext,
    useState,
    useContext,
    useCallback,
    useMemo
} from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const CommentContext = createContext();

const API_BASE = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;
const COMMENTS_PATH = `${API_BASE}/api/v1/comments`;

const DEFAULT_COLOR = "#fbbf24";

// ============================================================
// HELPERS
// ============================================================
const parseError = (error, fallback = "Something went wrong.") => {
    if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === "string") return data;
        return data.message || data.error || fallback;
    }
    if (error.request) return "No response from the server.";
    return error.message || fallback;
};

const isSuccess = (res) => {
    const status = res?.data?.status;
    return status === true || status === "success";
};

export const CommentProvider = ({ children }) => {
    const { authToken } = useContext(AuthContext);

    // ============ STATE ============
    const [customError, setCustomError] = useState("");
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [groupedAnnotations, setGroupedAnnotations] = useState({});
    const [annotationStats, setAnnotationStats] = useState({
        total: 0,
        unresolved: 0,
        byType: {},
        bySeverity: {},
        byPage: {}
    });
    const [singleComment, setSingleComment] = useState(null);
    const [totalComments, setTotalComments] = useState(0);
    const [iscommentLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [proposedTitleId, setProposedTitleId] = useState("");
    const [totalCommentCount, setTotalCommentCount] = useState(0);

    const limit = 10;

    // ============================================================
    // FETCH COMMENTS BY PROPOSED TITLE (paginated)
    // GET /api/v1/comments/proposed-title/:proposedTitleId?page=1&limit=10
    // ============================================================
    const FetchCommentsByProposedTitle = useCallback(
        async (
            proposedTitleIdParam,
            page = 1,
            limitParam = 10,
            filters = {}
        ) => {
            if (!authToken || !proposedTitleIdParam) {
                return { success: false, error: "Missing auth or title ID" };
            }

            try {
                setIsLoading(true);
                setCustomError("");

                const params = { page, limit: limitParam };
                if (filters.pageNumber) params.pageNumber = filters.pageNumber;
                if (filters.annotationType) {
                    params.annotationType = filters.annotationType;
                }
                if (filters.onlyUnresolved) params.onlyUnresolved = "true";
                if (filters.includeReplies === false) {
                    params.includeReplies = "false";
                }

                // ✅ Use /proposed-title/:id (matches backend route)
                const res = await axios.get(
                    `${COMMENTS_PATH}/proposed-title/${proposedTitleIdParam}`,
                    {
                        params,
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Cache-Control": "no-cache"
                        }
                    }
                );

                const {
                    data,
                    totalPages: tp,
                    totalCount,
                    currentPage: cp
                } = res.data;

                setComments(data || []);
                setTotalComments(totalCount || 0);
                setTotalPages(tp || 1);
                setCurrentPage(cp || page);
                setProposedTitleId(proposedTitleIdParam);
                setTotalCommentCount(totalCount || 0);

                return { success: true, data: res.data };
            } catch (error) {
                console.error("Error fetching comments:", error);
                const msg = parseError(error, "Failed to fetch comments");
                setCustomError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken]
    );

    // ============================================================
    // FETCH ALL ANNOTATIONS (grouped + stats)
    // GET /api/v1/comments/all/:proposedTitleId
    // ============================================================
    const FetchAllAnnotations = useCallback(
        async (proposedTitleIdParam) => {
            if (!authToken || !proposedTitleIdParam) {
                return { success: false, error: "Missing auth or title ID" };
            }

            try {
                const res = await axios.get(
                    `${COMMENTS_PATH}/all/${proposedTitleIdParam}`,
                    {
                        withCredentials: true,
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );

                if (isSuccess(res)) {
                    setComments(res.data.data || []);
                    setGroupedAnnotations(res.data.grouped || {});
                    setAnnotationStats(res.data.stats || {});
                    setProposedTitleId(proposedTitleIdParam);
                    return { success: true, data: res.data };
                }

                return { success: false, error: "Unexpected response" };
            } catch (error) {
                console.error("Error fetching annotations:", error);
                const msg = parseError(error, "Failed to fetch annotations");
                setCustomError(msg);
                return { success: false, error: msg };
            }
        },
        [authToken]
    );

    // Alias for backward compatibility (some components call it FetchAllAnnotations)
    const GetAllAnnotations = FetchAllAnnotations;

    // ============================================================
    // FETCH ANNOTATIONS BY PAGE
    // GET /api/v1/comments/by-page/:proposedTitleId?pageNumber=N
    // ============================================================
    const FetchAnnotationsByPage = useCallback(
        async (proposedTitleIdParam, pageNumber) => {
            if (!authToken || !proposedTitleIdParam || !pageNumber) {
                return { success: false, error: "Missing required parameters" };
            }

            try {
                const res = await axios.get(
                    `${COMMENTS_PATH}/by-page/${proposedTitleIdParam}`,
                    {
                        params: { pageNumber },
                        withCredentials: true,
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );

                return { success: true, data: res.data.data || [] };
            } catch (error) {
                console.error("Error fetching page annotations:", error);
                const msg = parseError(
                    error,
                    "Failed to fetch page annotations"
                );
                return { success: false, error: msg };
            }
        },
        [authToken]
    );

    // ============================================================
    // GET STATS
    // GET /api/v1/comments/stats/:proposedTitleId
    // ============================================================
    const GetAnnotationStats = useCallback(
        async (proposedTitleIdParam) => {
            if (!authToken || !proposedTitleIdParam) return null;

            try {
                const res = await axios.get(
                    `${COMMENTS_PATH}/stats/${proposedTitleIdParam}`,
                    {
                        withCredentials: true,
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );

                if (isSuccess(res)) {
                    const stats = res.data.data || {};
                    setAnnotationStats((prev) => ({ ...prev, ...stats }));
                    return stats;
                }
                return null;
            } catch (error) {
                console.error("Error fetching annotation stats:", error);
                return null;
            }
        },
        [authToken]
    );

    // ============================================================
    // CREATE COMMENT (accepts string OR object)
    // POST /api/v1/comments
    // ============================================================
    const CreateComment = useCallback(
        async (proposedTitleIdParam, commentData) => {
            if (!authToken) {
                return { success: false, error: "Not authenticated" };
            }

            const isString = typeof commentData === "string";
            const payload = isString
                ? {
                    proposedTitleId: proposedTitleIdParam,
                    text: commentData
                }
                : {
                    proposedTitleId: proposedTitleIdParam,
                    text: commentData.text,
                    pageNumber: commentData.pageNumber ?? null,
                    position: commentData.position ?? null,
                    selectedText: commentData.selectedText ?? null,
                    color: commentData.color ?? DEFAULT_COLOR,
                    annotationType: commentData.annotationType ?? "text",
                    annotationLabel: commentData.annotationLabel ?? null,
                    severity: commentData.severity ?? "minor",
                    authorRole: commentData.authorRole ?? null,
                    parentCommentId: commentData.parentCommentId ?? null
                };

            try {
                setIsLoading(true);
                setCustomError("");

                const res = await axios.post(COMMENTS_PATH, payload, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json"
                    }
                });

                if (isSuccess(res)) {
                    return { success: true, data: res.data.data };
                }

                setCustomError("Failed to create comment.");
                return {
                    success: false,
                    error: "Failed to create comment."
                };
            } catch (error) {
                console.error("Create Comment Error:", error);
                const msg = parseError(error, "Something went wrong.");
                setCustomError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, currentPage, limit, FetchCommentsByProposedTitle]
    );

    // ============================================================
    // BULK CREATE
    // POST /api/v1/comments/bulk
    // ============================================================
    const BulkCreateComments = useCallback(
        async (proposedTitleIdParam, commentsList) => {
            if (!authToken || !proposedTitleIdParam) {
                return { success: false, error: "Missing auth or title ID" };
            }
            if (!Array.isArray(commentsList) || commentsList.length === 0) {
                return { success: false, error: "No comments to save" };
            }

            try {
                setIsLoading(true);
                const res = await axios.post(
                    `${COMMENTS_PATH}/bulk`,
                    {
                        proposedTitleId: proposedTitleIdParam,
                        comments: commentsList
                    },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                if (isSuccess(res)) {
                    await FetchAllAnnotations(proposedTitleIdParam);
                    return { success: true, data: res.data.data };
                }

                return { success: false, error: "Bulk insert failed" };
            } catch (error) {
                console.error("Bulk Create Error:", error);
                const msg = parseError(error, "Bulk insert failed");
                setCustomError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, FetchAllAnnotations]
    );

    // ============================================================
    // CREATE REPLY
    // ============================================================
    const CreateReply = useCallback(
        async (proposedTitleIdParam, parentCommentId, text) => {
            if (!authToken || !parentCommentId || !text?.trim()) {
                return { success: false, error: "Missing reply data" };
            }

            try {
                setIsLoading(true);
                const res = await axios.post(
                    COMMENTS_PATH,
                    {
                        proposedTitleId: proposedTitleIdParam,
                        text: text.trim(),
                        parentCommentId
                    },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                if (isSuccess(res)) {
                    await FetchAllAnnotations(proposedTitleIdParam);
                    return { success: true, data: res.data.data };
                }

                return { success: false, error: "Failed to post reply" };
            } catch (error) {
                console.error("Create Reply Error:", error);
                const msg = parseError(error, "Failed to post reply");
                setCustomError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, FetchAllAnnotations]
    );

    // ============================================================
    // UPDATE COMMENT
    // PATCH /api/v1/comments/:id  (backend uses PATCH not PUT)
    // ============================================================
    const UpdateComment = useCallback(
        async (commentId, updates) => {
            if (!authToken || !commentId) {
                return { success: false, error: "Missing required parameters" };
            }

            const payload =
                typeof updates === "string" ? { text: updates } : updates;

            try {
                setIsLoading(true);
                // ✅ Use PATCH (backend uses router.patch)
                const res = await axios.patch(
                    `${COMMENTS_PATH}/${commentId}`,
                    payload,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                if (isSuccess(res)) {
                    if (proposedTitleId) {
                        await FetchAllAnnotations(proposedTitleId);
                    }
                    return { success: true, data: res.data.data };
                }

                return { success: false, error: "Failed to update comment" };
            } catch (error) {
                console.error("Update Comment Error:", error);
                const msg = parseError(error, "Failed to update comment");
                setCustomError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, proposedTitleId, FetchAllAnnotations]
    );

    // ============================================================
    // TOGGLE RESOLVE
    // PATCH /api/v1/comments/:id/resolve
    // ============================================================
    const ToggleResolve = useCallback(
        async (commentId, isResolved) => {
            if (!authToken || !commentId) {
                return { success: false, error: "Missing required parameters" };
            }

            try {
                setIsLoading(true);
                const res = await axios.patch(
                    `${COMMENTS_PATH}/${commentId}/resolve`,
                    { isResolved: !!isResolved },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                if (isSuccess(res)) {
                    setComments((prev) =>
                        prev.map((c) =>
                            c._id === commentId
                                ? { ...c, ...res.data.data }
                                : c
                        )
                    );
                    if (proposedTitleId) {
                        await GetAnnotationStats(proposedTitleId);
                    }
                    return { success: true, data: res.data.data };
                }

                return { success: false, error: "Failed to toggle resolve" };
            } catch (error) {
                console.error("Toggle Resolve Error:", error);
                const msg = parseError(error, "Failed to toggle resolve");
                setCustomError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, proposedTitleId, GetAnnotationStats]
    );

    // ============================================================
    // DELETE COMMENT
    // DELETE /api/v1/comments/:id
    // ============================================================
    const DeleteComment = useCallback(
        async (commentId) => {
            if (!authToken || !commentId) {
                return { success: false, error: "Missing required parameters" };
            }

            try {
                setIsLoading(true);
                const res = await axios.delete(
                    `${COMMENTS_PATH}/${commentId}`,
                    {
                        withCredentials: true,
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );

                if (isSuccess(res)) {
                    if (proposedTitleId) {
                        await FetchAllAnnotations(proposedTitleId);
                    }
                    return { success: true, data: res.data };
                }

                return { success: false, error: "Failed to delete comment" };
            } catch (error) {
                console.error("Delete Comment Error:", error);
                const msg = parseError(error, "Failed to delete comment");
                setCustomError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, proposedTitleId, FetchAllAnnotations]
    );

    // ============================================================
    // CLEAR PAGE
    // DELETE /api/v1/comments/clear-page/:proposedTitleId/:pageNumber
    // ============================================================
    const ClearPageAnnotations = useCallback(
        async (proposedTitleIdParam, pageNumber) => {
            if (!authToken || !proposedTitleIdParam || !pageNumber) {
                return { success: false, error: "Missing required parameters" };
            }

            try {
                setIsLoading(true);
                // ✅ Use /clear-page/:id/:n (matches backend route)
                const res = await axios.delete(
                    `${COMMENTS_PATH}/clear-page/${proposedTitleIdParam}/${pageNumber}`,
                    {
                        withCredentials: true,
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );

                if (isSuccess(res)) {
                    setGroupedAnnotations((prev) => {
                        const next = { ...prev };
                        delete next[`page_${pageNumber}`];
                        return next;
                    });
                    await FetchAllAnnotations(proposedTitleIdParam);
                    return {
                        success: true,
                        deletedCount: res.data.deletedCount || 0
                    };
                }

                return { success: false, error: "Failed to clear page" };
            } catch (error) {
                console.error("Clear Page Error:", error);
                const msg = parseError(error, "Failed to clear page");
                setCustomError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, FetchAllAnnotations]
    );

    // ============================================================
    // GET SINGLE COMMENT
    // GET /api/v1/comments/:id
    // ============================================================
    const FetchCommentById = useCallback(
        async (commentId) => {
            if (!authToken || !commentId) {
                return { success: false, error: "Missing required parameters" };
            }

            try {
                setIsLoading(true);
                const res = await axios.get(
                    `${COMMENTS_PATH}/${commentId}`,
                    {
                        withCredentials: true,
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );

                if (isSuccess(res)) {
                    setSingleComment(res.data.data);
                    return { success: true, data: res.data.data };
                }

                return { success: false, error: "Comment not found" };
            } catch (error) {
                console.error("Error fetching comment:", error);
                const msg = parseError(error, "Failed to fetch comment");
                setCustomError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken]
    );

    // ============================================================
    // GET COMMENT COUNT
    // GET /api/v1/comments/count/:proposedTitleId
    // ============================================================
    const GetCommentCount = useCallback(
        async (proposedTitleIdParam) => {
            if (!authToken || !proposedTitleIdParam) return 0;

            try {
                const res = await axios.get(
                    `${COMMENTS_PATH}/count/${proposedTitleIdParam}`,
                    {
                        withCredentials: true,
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );

                const count =
                    res.data?.count || res.data?.data?.total || 0;
                setTotalCommentCount(count);
                return count;
            } catch (error) {
                console.error("Error fetching comment count:", error);
                return 0;
            }
        },
        [authToken]
    );

    // ============================================================
    // PURE HELPERS
    // ============================================================
    const GetAnnotationsFromComments = useCallback((commentsList) => {
        return (commentsList || []).filter(
            (c) => c.pageNumber && c.position && c.position.x !== null
        );
    }, []);

    const GetCommentsByPage = useCallback((commentsList, pageNum) => {
        return (commentsList || []).filter(
            (c) => Number(c.pageNumber) === Number(pageNum)
        );
    }, []);

    const GetUnresolvedCount = useCallback(() => {
        return comments.filter((c) => !c.isResolved).length;
    }, [comments]);

    // ============================================================
    // LIFECYCLE
    // ============================================================
    const ResetComments = useCallback(() => {
        setComments([]);
        setGroupedAnnotations({});
        setAnnotationStats({
            total: 0,
            unresolved: 0,
            byType: {},
            bySeverity: {},
            byPage: {}
        });
        setSingleComment(null);
        setTotalComments(0);
        setTotalPages(1);
        setCurrentPage(1);
        setProposedTitleId("");
        setTotalCommentCount(0);
        setCustomError("");
    }, []);

    const ChangePage = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    // ============================================================
    // MEMOIZED CONTEXT VALUE
    // ============================================================
    const contextValue = useMemo(
        () => ({
            // State
            comments,
            groupedAnnotations,
            annotationStats,
            singleComment,
            totalComments,
            totalCommentCount,
            iscommentLoading,
            loading,
            totalPages,
            currentPage,
            setCurrentPage,
            limit,
            proposedTitleId,
            setProposedTitleId,
            customError,

            // Network functions
            FetchCommentsByProposedTitle,
            FetchAllAnnotations,
            GetAllAnnotations,            // ✅ alias
            FetchAnnotationsByPage,
            GetAnnotationStats,
            FetchCommentById,
            CreateComment,
            BulkCreateComments,
            CreateReply,
            UpdateComment,
            ToggleResolve,
            DeleteComment,
            ClearPageAnnotations,
            GetCommentCount,

            // Pure helpers
            GetAnnotationsFromComments,
            GetCommentsByPage,
            GetUnresolvedCount,

            // Lifecycle
            ResetComments,
            ChangePage
        }),
        [
            comments,
            groupedAnnotations,
            annotationStats,
            singleComment,
            totalComments,
            totalCommentCount,
            iscommentLoading,
            loading,
            totalPages,
            currentPage,
            proposedTitleId,
            customError,
            FetchCommentsByProposedTitle,
            FetchAllAnnotations,
            GetAllAnnotations,
            FetchAnnotationsByPage,
            GetAnnotationStats,
            FetchCommentById,
            CreateComment,
            BulkCreateComments,
            CreateReply,
            UpdateComment,
            ToggleResolve,
            DeleteComment,
            ClearPageAnnotations,
            GetCommentCount,
            GetAnnotationsFromComments,
            GetCommentsByPage,
            GetUnresolvedCount,
            ResetComments,
            ChangePage
        ]
    );

    return (
        <CommentContext.Provider value={contextValue}>
            {children}
        </CommentContext.Provider>
    );
};