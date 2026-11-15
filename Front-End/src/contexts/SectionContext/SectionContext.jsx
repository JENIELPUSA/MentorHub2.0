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
    // (includes formatID populate via backend)
    // ==========================================
    const fetchSections = useCallback(async (params = {}) => {
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

            const page = params.page || currentPage;
            const limit = params.limit || rowsPerPage;
            const search = params.search || searchQuery;
            const subjectId = params.subjectId || selectedSubjectId;

            if (!subjectId) {
                setCustomError("Subject ID is required");
                setSections([]);
                setLoading(false);
                fetchInProgress.current = false;
                return;
            }

            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (search) {
                queryParams.append('search', search);
            }

            const fullUrl = `${BASE_URL}/api/v1/sections/${subjectId}?${queryParams}`;
            console.log("🔗 FULL URL:", fullUrl);

            const res = await axios.get(fullUrl, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Cache-Control": "no-cache",
                },
            });

            console.log("📊 Response Data:", res.data);

            if (res.data?.status === "success") {
                //  Sections already include populated formatID from backend
                setSections(res.data.data || []);
                setTotalCount(res.data.totalCount || 0);
                setTotalPages(res.data.totalPages || 1);
                setCurrentPage(res.data.currentPage || page);

                if (params.limit && params.limit !== rowsPerPage) {
                    setRowsPerPage(params.limit);
                }
                if (params.search !== undefined) {
                    setSearchQuery(params.search);
                }
                if (params.subjectId !== undefined) {
                    setSelectedSubjectId(params.subjectId);
                }
            } else {
                setCustomError(res.data?.message || "Failed to fetch sections");
                setSections([]);
            }
        } catch (error) {
            console.error("❌ Fetch Sections Error:", error);

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
    // (includes populated formatID)
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
    //  Supports optional formatID
    // ==========================================
    const createSection = useCallback(async (values) => {
        if (!authToken) return { success: false, error: "No authentication token" };

        try {
            setLoading(true);
            setCustomError("");

            //  Ensure formatID is included if provided
            const payload = {
                name: values.name,
                subjectId: values.subjectId,
            };
            if (values.formatID !== undefined) {
                payload.formatID = values.formatID;
            }

            const res = await axios.post(
                `${BASE_URL}/api/v1/sections`,
                payload,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (isSuccess(res.data?.status)) {
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
    //  Supports name, subjectId, formatID
    // ==========================================
    const updateSection = useCallback(async (id, values) => {
        if (!authToken) return { success: false, error: "No authentication token" };

        try {
            setLoading(true);
            setCustomError("");

            //  Build payload — only include provided fields
            const payload = {};
            if (values.name !== undefined) payload.name = values.name;
            if (values.subjectId !== undefined) payload.subjectId = values.subjectId;
            
            //  formatID — can be null (unassign) or ObjectId (assign)
            if (values.formatID !== undefined) {
                payload.formatID = values.formatID;
            }

            console.log("📤 updateSection payload:", payload);

            const res = await axios.patch(
                `${BASE_URL}/api/v1/sections/${id}`,
                payload,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (isSuccess(res.data?.status)) {
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
    //  ASSIGN FORMAT TO SECTION
    // Convenience wrapper for updateSection
    // ==========================================
    const assignFormatToSection = useCallback(async (sectionId, formatId) => {
        return updateSection(sectionId, { formatID: formatId });
    }, [updateSection]);

    // ==========================================
    //  CLEAR FORMAT FROM SECTION
    // Sets formatID to null
    // ==========================================
    const clearSectionFormat = useCallback(async (sectionId) => {
        return updateSection(sectionId, { formatID: null });
    }, [updateSection]);

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
                setSections(prevSections => prevSections.filter(section => section._id !== id));

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
    // GET SECTIONS BY USER
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
    //  GET SECTIONS WITH FORMAT BY SUBJECT
    // Returns array of { section, format } for quick access
    // ==========================================
    const getSectionsWithFormatsBySubject = useCallback(async (subjectId) => {
        if (!authToken) return { success: false, data: [] };

        try {
            const result = await getSectionsBySubject(subjectId);
            if (!result.success) return result;

            // Sections already have populated formatID from backend
            const formatted = (result.data || []).map(section => ({
                section,
                format: section.formatID || null,
                hasFormat: !!section.formatID,
            }));

            return { success: true, data: formatted };
        } catch (error) {
            console.error("Get Sections with Formats Error:", error);
            return {
                success: false,
                error: error.message,
                data: [],
            };
        }
    }, [getSectionsBySubject]);

    // ==========================================
    //  GET FORMAT BY SECTION ID
    // Directly returns the format attached to a section
    // ==========================================
    const getFormatBySectionId = useCallback(async (sectionId) => {
        const result = await getSectionById(sectionId);
        if (!result.success) return result;
        return {
            success: true,
            data: result.data?.formatID || null,
            section: result.data,
        };
    }, [getSectionById]);

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

        //  Format-specific helpers (NEW)
        assignFormatToSection,
        clearSectionFormat,
        getSectionsWithFormatsBySubject,
        getFormatBySectionId,

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
        assignFormatToSection,
        clearSectionFormat,
        getSectionsWithFormatsBySubject,
        getFormatBySectionId,
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