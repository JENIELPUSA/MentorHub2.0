import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const CommentContext = createContext();

export const CommentProvider = ({ children }) => {
    const { authToken } = useContext(AuthContext);
    const [customError, setCustomError] = useState("");
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [singleComment, setSingleComment] = useState(null);
    const [totalComments, setTotalComments] = useState(0);
    const [iscommentLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [proposedTitleId, setProposedTitleId] = useState("");
    const [totalCommentCount, setTotalCommentCount] = useState(0);

    const limit = 10;

    // ============================
    // FETCH COMMENTS BY PROPOSED TITLE (with pagination)
    // Controller: req.params.proposedTitleId
    // ============================
    const FetchCommentsByProposedTitle = useCallback(async (
        proposedTitleIdParam,
        page = 1,
        limitParam = 10
    ) => {
        if (!authToken || !proposedTitleIdParam) return;

        try {
            setIsLoading(true);

            // ✅ TAMANG URL — walang space, walang quotes, may forward slash
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/comments/proposed-title/${proposedTitleIdParam}`,
                {
                    params: {
                        page,
                        limit: limitParam,
                    },
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Cache-Control": "no-cache",
                    },
                }
            );

            const { data, totalPages, totalCount, currentPage, results } = res.data;

            setComments(data || []);
            setTotalComments(totalCount || 0);
            setTotalPages(totalPages || 1);
            setCurrentPage(currentPage || page);
            setProposedTitleId(proposedTitleIdParam);
            setTotalCommentCount(totalCount || 0);

            return { success: true, data: res.data };

        } catch (error) {
            console.error("Error fetching comments:", error);
            setCustomError(error.response?.data?.message || "Failed to fetch comments");
            return { success: false, error: error.response?.data?.message };
        } finally {
            setIsLoading(false);
        }
    }, [authToken]);

    // ============================
    // CREATE COMMENT
    // ============================
    const CreateComment = useCallback(async (proposedTitleIdParam, text) => {
        if (!authToken) return;

        console.log("text",text)

        try {
            setIsLoading(true);
            const res = await axios.post(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/comments`,
                { proposedTitleId: proposedTitleIdParam, text },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const status = res.data?.status;

            if (status === true || status === "success") {
                await FetchCommentsByProposedTitle(proposedTitleIdParam, currentPage, limit);
                return { success: true, data: res.data.data };
            }

            setCustomError("Failed to create comment.");
            return { success: false };
        } catch (error) {
            console.error("Create Comment Error:", error);

            let errorMessage = "Something went wrong.";
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                errorMessage = typeof errorData === "string"
                    ? errorData
                    : errorData.message || errorData.error || "Something went wrong.";
            } else if (error.request) {
                errorMessage = "No response from the server.";
            } else {
                errorMessage = error.message || "Unexpected error occurred.";
            }

            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [authToken, currentPage, limit, FetchCommentsByProposedTitle]);

    // ============================
    // UPDATE COMMENT
    // ============================
    const UpdateComment = useCallback(async (commentId, text) => {
        if (!authToken || !commentId) return;

        try {
            setIsLoading(true);
            const res = await axios.patch(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/comments/${commentId}`,
                { text },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.data.status === "success") {
                await FetchCommentsByProposedTitle(proposedTitleId, currentPage, limit);
                return { success: true, data: res.data.data };
            }

            return { success: false };
        } catch (error) {
            console.error("Update Comment Error:", error);
            const errorMessage = error.response?.data?.message || "Failed to update comment";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [authToken, proposedTitleId, currentPage, limit, FetchCommentsByProposedTitle]);

    // ============================
    // DELETE COMMENT
    // ============================
    const DeleteComment = useCallback(async (commentId) => {
        if (!authToken || !commentId) return;

        try {
            setIsLoading(true);
            const res = await axios.delete(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/comments/${commentId}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            if (res.data.status === "success") {
                await FetchCommentsByProposedTitle(proposedTitleId, currentPage, limit);
                return { success: true };
            }

            return { success: false };
        } catch (error) {
            console.error("Delete Comment Error:", error);
            const errorMessage = error.response?.data?.message || "Failed to delete comment";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [authToken, proposedTitleId, currentPage, limit, FetchCommentsByProposedTitle]);

    // ============================
    // GET SINGLE COMMENT BY ID
    // ============================
    const FetchCommentById = useCallback(async (commentId) => {
        if (!authToken || !commentId) return;

        try {
            setIsLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/comments/${commentId}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            setSingleComment(res.data.data);
            return { success: true, data: res.data.data };
        } catch (error) {
            console.error("Error fetching comment:", error);
            setCustomError(error.response?.data?.message || "Failed to fetch comment");
            return { success: false, error: error.response?.data?.message };
        } finally {
            setIsLoading(false);
        }
    }, [authToken]);

    // ============================
    // GET COMMENT COUNT BY PROPOSED TITLE
    // ============================
    const GetCommentCount = useCallback(async (proposedTitleIdParam) => {
        if (!authToken || !proposedTitleIdParam) return;

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/comments/count/${proposedTitleIdParam}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            setTotalCommentCount(res.data.count || 0);
            return res.data.count;
        } catch (error) {
            console.error("Error fetching comment count:", error);
            return 0;
        }
    }, [authToken]);

    // ============================
    // RESET COMMENTS
    // ============================
    const ResetComments = useCallback(() => {
        setComments([]);
        setSingleComment(null);
        setTotalComments(0);
        setTotalPages(1);
        setCurrentPage(1);
        setProposedTitleId("");
        setTotalCommentCount(0);
        setCustomError("");
    }, []);

    // ============================
    // CHANGE PAGE
    // ============================
    const ChangePage = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    // ============================
    // ✅ MEMOIZED CONTEXT VALUE
    // ============================
    const contextValue = useMemo(() => ({
        // State
        comments,
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

        // Functions
        FetchCommentsByProposedTitle,
        FetchCommentById,
        CreateComment,
        UpdateComment,
        DeleteComment,
        GetCommentCount,
        ResetComments,
        ChangePage,
    }), [
        comments,
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
        FetchCommentById,
        CreateComment,
        UpdateComment,
        DeleteComment,
        GetCommentCount,
        ResetComments,
        ChangePage,
    ]);

    // ============================
    // CONTEXT PROVIDER
    // ============================
    return (
        <CommentContext.Provider value={contextValue}>
            {children}
        </CommentContext.Provider>
    );
};