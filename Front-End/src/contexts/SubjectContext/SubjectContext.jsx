import { createContext, useState, useCallback, useEffect, useMemo, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const SubjectContext = createContext();

export const SubjectProvider = ({ children }) => {
  // ==========================================
  // STATE DECLARATIONS
  // ==========================================
  const [customError, setCustomError] = useState("");
  const { authToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [subjectsData, setSubjects] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Use ref to prevent infinite loops
  const isInitialMount = useRef(true);
  const fetchInProgress = useRef(false);

  const BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

  // ==========================================
  // FETCH SUBJECTS - FIXED
  // ==========================================
  const fetchSubjects = useCallback(async (params = {}) => {
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
      const page = params.page || 1;
      const limit = params.limit || 10;
      const search = params.search || "";
      const userId = params.userId;
      const dateRange = params.dateRange;

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add optional filters
      if (search) {
        queryParams.append('search', search);
      }
      if (userId && userId !== 'All') {
        queryParams.append('userId', userId);
      }
      if (dateRange && dateRange !== 'All') {
        queryParams.append('dateRange', dateRange);
      }

      const fullUrl = `${BASE_URL}/api/v1/subjects?${queryParams}`;
      console.log("🔗 FULL URL:", fullUrl);
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
        console.log("✅ Success! Setting subjects...");
        setSubjects(res.data.data || []);
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
      } else {
        console.log("❌ Response status not success");
        setCustomError(res.data?.message || "Failed to fetch subjects");
        setSubjects([]);
      }
    } catch (error) {
      console.error("❌ Fetch Subjects Error:", error);
      setCustomError(error.response?.data?.message || "Error fetching subjects");
      setSubjects([]);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [BASE_URL, authToken]); // ⚠️ Remove dependencies that cause re-renders

  // ==========================================
  // GET ALL SUBJECTS SIMPLE (FOR DROPDOWNS)
  // ==========================================
  const fetchSubjectsSimple = useCallback(async () => {
    if (!authToken) return { success: false, data: [] };

    try {
      const res = await axios.get(
        `${BASE_URL}/api/v1/subjects/simple`,
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
      console.error("Fetch Simple Subjects Error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error fetching subjects",
        data: [],
      };
    }
  }, [BASE_URL, authToken]);

  // ==========================================
  // GET SINGLE SUBJECT
  // ==========================================
  const getSubjectById = useCallback(async (id) => {
    if (!authToken) return { success: false, error: "No authentication token" };

    try {
      setLoading(true);
      setCustomError("");

      const res = await axios.get(
        `${BASE_URL}/api/v1/subjects/${id}`,
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
      console.error("Get Subject Error:", error);
      const errorMessage = error.response?.data?.message || "Error fetching subject";
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
  // CREATE SUBJECT
  // ==========================================
  const createSubject = useCallback(async (values) => {
    if (!authToken) return { success: false, error: "No authentication token" };

    try {
      setLoading(true);
      setCustomError("");

      const res = await axios.post(
        `${BASE_URL}/api/v1/subjects`,
        values,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.status === "Success" || res.data?.status === "success") {
        // Refresh the list - stay on current page
        await fetchSubjects({ 
          page: currentPage, 
          limit: rowsPerPage,
          search: searchQuery 
        });
        
        return { 
          success: true, 
          data: res.data.data,
          message: res.data.message || "Subject created successfully"
        };
      }

      const errorMessage = res.data?.message || "Failed to create subject";
      setCustomError(errorMessage);
      return { 
        success: false,
        message: errorMessage
      };
    } catch (error) {
      console.error("Create Subject Error:", error);
      const errorMessage = error.response?.data?.message || "Error creating subject";
      setCustomError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, authToken, fetchSubjects, currentPage, rowsPerPage, searchQuery]);

  // ==========================================
  // UPDATE SUBJECT
  // ==========================================
  const updateSubject = useCallback(async (id, values) => {
    if (!authToken) return { success: false, error: "No authentication token" };

    try {
      setLoading(true);
      setCustomError("");

      const res = await axios.patch(
        `${BASE_URL}/api/v1/subjects/${id}`,
        values,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.status === "success") {
        // Refresh the list
        await fetchSubjects({ 
          page: currentPage, 
          limit: rowsPerPage,
          search: searchQuery 
        });
        
        return { 
          success: true, 
          data: res.data.data,
          message: res.data.message || "Subject updated successfully"
        };
      }

      const errorMessage = res.data?.message || "Failed to update subject";
      setCustomError(errorMessage);
      return { 
        success: false,
        message: errorMessage
      };
    } catch (error) {
      console.error("Update Subject Error:", error);
      const errorMessage = error.response?.data?.message || "Error updating subject";
      setCustomError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, authToken, fetchSubjects, currentPage, rowsPerPage, searchQuery]);

  // ==========================================
  // DELETE SUBJECT
  // ==========================================
  const deleteSubject = useCallback(async (id) => {
    if (!authToken) return { success: false, error: "No authentication token" };

    try {
      setLoading(true);
      setCustomError("");

      const res = await axios.delete(
        `${BASE_URL}/api/v1/subjects/${id}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (res.data?.status === "success") {
        // Optimistic update - remove from list immediately
        setSubjects(prevSubjects => prevSubjects.filter(subject => subject._id !== id));
        
        // Then refresh to get updated pagination
        await fetchSubjects({ 
          page: currentPage, 
          limit: rowsPerPage,
          search: searchQuery 
        });
        
        return { 
          success: true,
          message: res.data.message || "Subject deleted successfully"
        };
      }

      const errorMessage = res.data?.message || "Failed to delete subject";
      setCustomError(errorMessage);
      return { 
        success: false,
        message: errorMessage
      };
    } catch (error) {
      console.error("Delete Subject Error:", error);
      const errorMessage = error.response?.data?.message || "Error deleting subject";
      setCustomError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, authToken, fetchSubjects, currentPage, rowsPerPage, searchQuery]);

  // ==========================================
  // SEARCH SUBJECTS
  // ==========================================
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchSubjects({ page: 1, limit: rowsPerPage, search: query });
  }, [fetchSubjects, rowsPerPage]);

  // ==========================================
  // CHANGE PAGE
  // ==========================================
  const handlePageChange = useCallback((page) => {
    if (page !== currentPage) {
      setCurrentPage(page);
      fetchSubjects({ page, limit: rowsPerPage, search: searchQuery });
    }
  }, [fetchSubjects, rowsPerPage, searchQuery, currentPage]);

  // ==========================================
  // CHANGE ROWS PER PAGE
  // ==========================================
  const handleRowsPerPageChange = useCallback((rows) => {
    if (rows !== rowsPerPage) {
      setRowsPerPage(rows);
      setCurrentPage(1);
      fetchSubjects({ page: 1, limit: rows, search: searchQuery });
    }
  }, [fetchSubjects, searchQuery, rowsPerPage]);

  // ==========================================
  // INITIAL FETCH ON MOUNT & AUTH CHANGE
  // ==========================================
  useEffect(() => {
    if (authToken && isInitialMount.current) {
      isInitialMount.current = false;
      fetchSubjects({ page: 1, limit: rowsPerPage });
    }
  }, [authToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================
  // FETCH WHEN PAGINATION OR SEARCH CHANGES
  // ==========================================
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      return;
    }
    
    if (authToken) {
      fetchSubjects({ page: currentPage, limit: rowsPerPage, search: searchQuery });
    }
  }, [currentPage, searchQuery, rowsPerPage, authToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================
  // MEMOIZED CONTEXT VALUE
  // ==========================================
  const value = useMemo(() => ({
    // State
    subjectsData,
    loading,
    customError,
    totalCount,
    totalPages,
    currentPage,
    rowsPerPage,
    searchQuery,

    // CRUD Operations
    fetchSubjects,
    fetchSubjectsSimple,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,

    // Utility Functions
    handleSearch,
    handlePageChange,
    handleRowsPerPageChange,
    setSearchQuery,
  }), [
    subjectsData,
    loading,
    customError,
    totalCount,
    totalPages,
    currentPage,
    rowsPerPage,
    searchQuery,
    fetchSubjects,
    fetchSubjectsSimple,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,
    handleSearch,
    handlePageChange,
    handleRowsPerPageChange,
  ]);

  return (
    <SubjectContext.Provider value={value}>
      {children}
    </SubjectContext.Provider>
  );
};