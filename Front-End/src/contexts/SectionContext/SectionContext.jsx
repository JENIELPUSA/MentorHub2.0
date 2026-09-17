import { createContext, useState, useCallback, useEffect, useMemo, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const SectionContext = createContext();

export const SectionProvider = ({ children }) => {
    // ==========================================
    // STATE DECLARATIONS
    // ==========================================
    const [customError, setCustomError] = useState("");
    const { authToken } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [sectionsData, setSections] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedSubjectId, setSelectedSubjectId] = useState("");

    // Use ref to prevent infinite loops
    const isInitialMount = useRef(true);
    const fetchInProgress = useRef(false);

    const BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

    // ==========================================
    // HELPER: Check if status is success
    // ==========================================
    const isSuccess = (status) => {
        return status === "success" || status === "Success";
    };

    // ==========================================
    // FETCH SECTIONS BY SUBJECT ID
    // ==========================================
    const fetchSections = useCallback(async (params = {}) => {
        // Prevent multiple simultaneous fetches
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

            // Extract params with defaults
            const page = params.page || currentPage;
            const limit = params.limit || rowsPerPage;
            const search = params.search || searchQuery;
            const subjectId = params.subjectId || selectedSubjectId;

            // Validate required subjectId
            if (!subjectId) {
                setCustomError("Subject ID is required");
                setSections([]);
                setLoading(false);
                fetchInProgress.current = false;
                return;
            }

            // Build query parameters (search and pagination only)
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            // Add optional search filter
            if (search) {
                queryParams.append('search', search);
            }

            // Use route parameter for subjectId (not query param)
            const fullUrl = `${BASE_URL}/api/v1/sections/${subjectId}?${queryParams}`;
            console.log("🔗 FULL URL:", fullUrl);
            console.log("📋 Subject ID:", subjectId);
            console.log("📋 Query Params:", queryParams.toString());

            const res = await axios.get(fullUrl, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Cache-Control": "no-cache",
                },
            });

            console.log("📊 Response Data:", res.data);

            if (res.data?.status === "success") {
                console.log("✅ Success! Setting sections...");
                setSections(res.data.data || []);
                setTotalCount(res.data.totalCount || 0);
                setTotalPages(res.data.totalPages || 1);
                setCurrentPage(res.data.currentPage || page);

                // Only update rowsPerPage if it's different and provided
                if (params.limit && params.limit !== rowsPerPage) {
                    setRowsPerPage(params.limit);
                }

                // Only update searchQuery if it's provided
                if (params.search !== undefined) {
                    setSearchQuery(params.search);
                }

                // Only update selectedSubjectId if it's provided
                if (params.subjectId !== undefined) {
                    setSelectedSubjectId(params.subjectId);
                }
            } else {
                console.log("❌ Response status not success");
                setCustomError(res.data?.message || "Failed to fetch sections");
                setSections([]);
            }
        } catch (error) {
            console.error("❌ Fetch Sections Error:", error);

            // Handle 404 or other errors
            if (error.response?.status === 404) {
                setCustomError("Subject not found or has no sections");
            } else {
                setCustomError(error.response?.data?.message || "Error fetching sections");
            }
            setSections([]);
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
        }
    }, [BASE_URL, authToken, currentPage, rowsPerPage, searchQuery, selectedSubjectId]);
    // ==========================================
    // GET SECTIONS BY SUBJECT
    // ==========================================
    const getSectionsBySubject = useCallback(async (subjectId) => {
        if (!authToken) return { success: false, data: [] };

        try {
            const res = await axios.get(
                `${BASE_URL}/api/v1/sections/subject/${subjectId}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            if (res.data?.status === "success") {
                return { success: true, data: res.data.data };
            }
            return { success: false, data: [] };
        } catch (error) {
            console.error("Get Sections by Subject Error:", error);
            return {
                success: false,
                error: error.response?.data?.message || "Error fetching sections by subject",
                data: [],
            };
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // GET ALL SECTIONS SIMPLE (FOR DROPDOWNS)
    // ==========================================
    const fetchSectionsSimple = useCallback(async (subjectId = null) => {
        if (!authToken) return { success: false, data: [] };

        try {
            const queryParams = subjectId ? `?subjectId=${subjectId}` : '';
            const res = await axios.get(
                `${BASE_URL}/api/v1/sections/simple${queryParams}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            if (res.data?.status === "success") {
                return { success: true, data: res.data.data };
            }
            return { success: false, data: [] };
        } catch (error) {
            console.error("Fetch Simple Sections Error:", error);
            return {
                success: false,
                error: error.response?.data?.message || "Error fetching sections",
                data: [],
            };
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // GET SINGLE SECTION
    // ==========================================
    const getSectionById = useCallback(async (id) => {
        if (!authToken) return { success: false, error: "No authentication token" };

        try {
            setLoading(true);
            setCustomError("");

            const res = await axios.get(
                `${BASE_URL}/api/v1/sections/${id}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            if (res.data?.status === "success") {
                return { success: true, data: res.data.data };
            }
            return { success: false };
        } catch (error) {
            console.error("Get Section Error:", error);
            const errorMessage = error.response?.data?.message || "Error fetching section";
            setCustomError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // CREATE SECTION
    // ==========================================
    const createSection = useCallback(async (values) => {
        if (!authToken) return { success: false, error: "No authentication token" };

        try {
            setLoading(true);
            setCustomError("");

            const res = await axios.post(
                `${BASE_URL}/api/v1/sections`,
                values,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (isSuccess(res.data?.status)) {
                // Refresh the list - stay on current page
                await fetchSections({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    subjectId: selectedSubjectId
                });

                return {
                    success: true,
                    data: res.data.data,
                    message: res.data.message || "Section created successfully"
                };
            }

            const errorMessage = res.data?.message || "Failed to create section";
            setCustomError(errorMessage);
            return {
                success: false,
                message: errorMessage
            };
        } catch (error) {
            console.error("Create Section Error:", error);
            const errorMessage = error.response?.data?.message || "Error creating section";
            setCustomError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken, fetchSections, currentPage, rowsPerPage, searchQuery, selectedSubjectId]);

    // ==========================================
    // BULK CREATE SECTIONS
    // ==========================================
    const bulkCreateSections = useCallback(async (sections, subjectId) => {
        if (!authToken) return { success: false, error: "No authentication token" };

        try {
            setLoading(true);
            setCustomError("");

            const res = await axios.post(
                `${BASE_URL}/api/v1/sections/bulk`,
                { sections, subjectId },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (isSuccess(res.data?.status)) {
                // Refresh the list
                await fetchSections({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    subjectId: selectedSubjectId
                });

                return {
                    success: true,
                    data: res.data.data,
                    message: res.data.message || "Sections created successfully",
                    skipped: res.data.skipped || 0,
                    skippedNames: res.data.skippedNames || []
                };
            }

            const errorMessage = res.data?.message || "Failed to create sections";
            setCustomError(errorMessage);
            return {
                success: false,
                message: errorMessage
            };
        } catch (error) {
            console.error("Bulk Create Sections Error:", error);
            const errorMessage = error.response?.data?.message || "Error creating sections";
            setCustomError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken, fetchSections, currentPage, rowsPerPage, searchQuery, selectedSubjectId]);

    // ==========================================
    // UPDATE SECTION
    // ==========================================
    const updateSection = useCallback(async (id, values) => {
        if (!authToken) return { success: false, error: "No authentication token" };

        try {
            setLoading(true);
            setCustomError("");

            const res = await axios.patch(
                `${BASE_URL}/api/v1/sections/${id}`,
                values,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (isSuccess(res.data?.status)) {
                // Refresh the list
                await fetchSections({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    subjectId: selectedSubjectId
                });

                return {
                    success: true,
                    data: res.data.data,
                    message: res.data.message || "Section updated successfully"
                };
            }

            const errorMessage = res.data?.message || "Failed to update section";
            setCustomError(errorMessage);
            return {
                success: false,
                message: errorMessage
            };
        } catch (error) {
            console.error("Update Section Error:", error);
            const errorMessage = error.response?.data?.message || "Error updating section";
            setCustomError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken, fetchSections, currentPage, rowsPerPage, searchQuery, selectedSubjectId]);

    // ==========================================
    // DELETE SECTION
    // ==========================================
    const deleteSection = useCallback(async (id) => {
        if (!authToken) return { success: false, error: "No authentication token" };

        try {
            setLoading(true);
            setCustomError("");

            const res = await axios.delete(
                `${BASE_URL}/api/v1/sections/${id}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            if (isSuccess(res.data?.status)) {
                // Optimistic update - remove from list immediately
                setSections(prevSections => prevSections.filter(section => section._id !== id));

                // Then refresh to get updated pagination
                await fetchSections({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    subjectId: selectedSubjectId
                });

                return {
                    success: true,
                    message: res.data.message || "Section deleted successfully"
                };
            }

            const errorMessage = res.data?.message || "Failed to delete section";
            setCustomError(errorMessage);
            return {
                success: false,
                message: errorMessage
            };
        } catch (error) {
            console.error("Delete Section Error:", error);
            const errorMessage = error.response?.data?.message || "Error deleting section";
            setCustomError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken, fetchSections, currentPage, rowsPerPage, searchQuery, selectedSubjectId]);

    // ==========================================
    // GET SECTIONS BY USER (FOR ADMIN/SUPER ADMIN)
    // ==========================================
    const getSectionsByUser = useCallback(async (userId) => {
        if (!authToken) return { success: false, data: [] };

        try {
            const res = await axios.get(
                `${BASE_URL}/api/v1/sections/user/${userId}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            if (res.data?.status === "success") {
                return { success: true, data: res.data.data };
            }
            return { success: false, data: [] };
        } catch (error) {
            console.error("Get Sections by User Error:", error);
            return {
                success: false,
                error: error.response?.data?.message || "Error fetching sections by user",
                data: [],
            };
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // SEARCH SECTIONS
    // ==========================================
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        setCurrentPage(1);
        fetchSections({ page: 1, limit: rowsPerPage, search: query, subjectId: selectedSubjectId });
    }, [fetchSections, rowsPerPage, selectedSubjectId]);

    // ==========================================
    // FILTER BY SUBJECT
    // ==========================================
    const handleFilterBySubject = useCallback((subjectId) => {
        setSelectedSubjectId(subjectId);
        setCurrentPage(1);
        fetchSections({ page: 1, limit: rowsPerPage, search: searchQuery, subjectId });
    }, [fetchSections, rowsPerPage, searchQuery]);

    // ==========================================
    // CHANGE PAGE
    // ==========================================
    const handlePageChange = useCallback((page) => {
        if (page !== currentPage) {
            setCurrentPage(page);
            fetchSections({ page, limit: rowsPerPage, search: searchQuery, subjectId: selectedSubjectId });
        }
    }, [fetchSections, rowsPerPage, searchQuery, selectedSubjectId, currentPage]);

    // ==========================================
    // CHANGE ROWS PER PAGE
    // ==========================================
    const handleRowsPerPageChange = useCallback((rows) => {
        if (rows !== rowsPerPage) {
            setRowsPerPage(rows);
            setCurrentPage(1);
            fetchSections({ page: 1, limit: rows, search: searchQuery, subjectId: selectedSubjectId });
        }
    }, [fetchSections, searchQuery, selectedSubjectId, rowsPerPage]);

    // ==========================================
    // INITIAL FETCH ON MOUNT & AUTH CHANGE
    // ==========================================
    useEffect(() => {
        if (authToken && isInitialMount.current) {
            isInitialMount.current = false;
            fetchSections({ page: 1, limit: rowsPerPage });
        }
    }, [authToken, fetchSections, rowsPerPage]);

    // ==========================================
    // FETCH WHEN PAGINATION, SEARCH, OR FILTER CHANGES
    // ==========================================
    useEffect(() => {
        // Skip initial mount
        if (isInitialMount.current) {
            return;
        }

        if (authToken) {
            fetchSections({ page: currentPage, limit: rowsPerPage, search: searchQuery, subjectId: selectedSubjectId });
        }
    }, [currentPage, searchQuery, rowsPerPage, selectedSubjectId, authToken, fetchSections]);

    // ==========================================
    // MEMOIZED CONTEXT VALUE
    // ==========================================
    const value = useMemo(() => ({
        // State
        sectionsData,
        loading,
        customError,
        totalCount,
        totalPages,
        currentPage,
        rowsPerPage,
        searchQuery,
        selectedSubjectId,

        // CRUD Operations
        fetchSections,
        fetchSectionsSimple,
        getSectionsBySubject,
        getSectionById,
        createSection,
        bulkCreateSections,
        updateSection,
        deleteSection,
        getSectionsByUser,

        // Utility Functions
        handleSearch,
        handleFilterBySubject,
        handlePageChange,
        handleRowsPerPageChange,
        setSearchQuery,
        setSelectedSubjectId,
    }), [
        sectionsData,
        loading,
        customError,
        totalCount,
        totalPages,
        currentPage,
        rowsPerPage,
        searchQuery,
        selectedSubjectId,
        fetchSections,
        fetchSectionsSimple,
        getSectionsBySubject,
        getSectionById,
        createSection,
        bulkCreateSections,
        updateSection,
        deleteSection,
        getSectionsByUser,
        handleSearch,
        handleFilterBySubject,
        handlePageChange,
        handleRowsPerPageChange,
    ]);

    return (
        <SectionContext.Provider value={value}>
            {children}
        </SectionContext.Provider>
    );
};