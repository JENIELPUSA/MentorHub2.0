import { createContext, useState, useCallback, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
    const { authToken, linkId } = useContext(AuthContext);
    const [students, setStudents] = useState([]);
    const [useraccount, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        results: 0,
        limit: 10,
    });
    const [filters, setFilters] = useState({
        search: null,
        yearLevel: null,
        departmentId: null,
        gender: null,
        course: null,
        isActive: null,
        role: null,
        statusAccount: null,
        isVerified: null,
    });
    const [statistics, setStatistics] = useState({
        totalStudents: 0,
        maleCount: 0,
        femaleCount: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        activeLogin: 0,
        inactiveLogin: 0,
        verifiedLogin: 0,
        unverifiedLogin: 0,
        hasUser: 0,
        noUser: 0,
        hasLogin: 0,
        noLogin: 0,
        roles: [],
        statusAccounts: [],
        yearLevelDistribution: {},
    });

    const BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

    // ==========================================
    // GET HEADERS WITH AUTH TOKEN
    // ==========================================
    const getAuthHeaders = () => {
        return {
            headers: {
                Authorization: authToken ? `Bearer ${authToken}` : "",
                "Content-Type": "application/json",
            },
        };
    };

    // ==========================================
    // GET STUDENTS WITH USER & LOGIN DETAILS
    // ==========================================
    const fetchStudentsWithUsers = useCallback(async (params = {}) => {
        try {
            setIsLoading(true);

            const queryParams = new URLSearchParams({
                page: params.page || 1,
                limit: params.limit || 10,
                ...(params.search && { search: params.search }),
                ...(params.yearLevel && { yearLevel: params.yearLevel }),
                ...(params.departmentId && { departmentId: params.departmentId }),
                ...(params.gender && { gender: params.gender }),
                ...(params.course && { course: params.course }),
                ...(params.isActive !== undefined && { isActive: params.isActive }),
                ...(params.role && { role: params.role }),
                ...(params.statusAccount && { statusAccount: params.statusAccount }),
                ...(params.isVerified !== undefined && { isVerified: params.isVerified }),
                ...(params.sortBy && { sortBy: params.sortBy }),
                ...(params.sortOrder && { sortOrder: params.sortOrder }),
            });

            const res = await axios.get(
                `${BASE_URL}/api/v1/userStudent?${queryParams}`,
                getAuthHeaders() 
            );

            if (res.data?.status === "success") {
                setStudents(res.data.data);
                setPagination({
                    currentPage: res.data.pagination.currentPage,
                    totalPages: res.data.pagination.totalPages,
                    totalCount: res.data.pagination.totalCount,
                    results: res.data.pagination.results,
                    limit: res.data.pagination.limit,
                });
                setFilters(res.data.filters);
                setStatistics(res.data.statistics);
            }
        } catch (error) {
            console.error("Fetch Students Error:", error);
            // Handle 401 Unauthorized
            if (error.response?.status === 401) {
                console.log("Unauthorized! Please login again.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // GET USERS WITH LOGIN DETAILS
    // ==========================================
    const fetchUsersWithLogin = useCallback(async (params = {}) => {
        try {
            setIsLoading(true);

            const queryParams = new URLSearchParams({
                page: params.page || 1,
                limit: params.limit || 10,
                ...(params.search && { search: params.search }),
                ...(params.departmentId && { departmentId: params.departmentId }),
                ...(params.gender && { gender: params.gender }),
                ...(params.isActive !== undefined && { isActive: params.isActive }),
                ...(params.role && { role: params.role }),
                ...(params.statusAccount && { statusAccount: params.statusAccount }),
                ...(params.isVerified !== undefined && { isVerified: params.isVerified }),
                ...(params.sortBy && { sortBy: params.sortBy }),
                ...(params.sortOrder && { sortOrder: params.sortOrder }),
            });

            const res = await axios.get(
                `${BASE_URL}/api/v1/userStudent?${queryParams}`,
                getAuthHeaders() 
            );

            if (res.data?.status === "success") {
                setUsers(res.data.data);
                setPagination({
                    currentPage: res.data.pagination.currentPage,
                    totalPages: res.data.pagination.totalPages,
                    totalCount: res.data.pagination.totalCount,
                    results: res.data.pagination.results,
                    limit: res.data.pagination.limit,
                });
                setFilters(res.data.filters);
                setStatistics(res.data.statistics);
            }
        } catch (error) {
            console.error("Fetch Users Error:", error);
            // Handle 401 Unauthorized
            if (error.response?.status === 401) {
                console.log("Unauthorized! Please login again.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [BASE_URL, authToken]); // ✅ Added authToken as dependency

    // ==========================================
    // INITIAL FETCH - Only when authToken exists
    // ==========================================
    useEffect(() => {
        if (authToken) {
            fetchStudentsWithUsers();
            fetchUsersWithLogin();
        }
    }, [authToken, fetchStudentsWithUsers, fetchUsersWithLogin]); // ✅ Added authToken dependency

    return (
        <StudentContext.Provider
            value={{
                students,
                useraccount,
                isLoading,
                pagination,
                filters,
                statistics,
                fetchStudentsWithUsers,
                fetchUsersWithLogin,
                // Optional: expose linkId if needed
                linkId,
            }}
        >
            {children}
        </StudentContext.Provider>
    );
};