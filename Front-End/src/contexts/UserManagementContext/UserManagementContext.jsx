import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";
import axiosInstance from "../../components/ReusableFolder/axiosInstance";

export const UserDisplayContext = createContext();

// Roles that support switching (match backend enum)
const SWITCHABLE_ROLES = ["panelist", "adviser"];

export const UserDisplayProvider = ({ children }) => {
    const [customError, setCustomError] = useState("");
    const { authToken } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [userdata, setUsers] = useState([]);
    const [totalUserCount, setTotalUserCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // ── Extra state for advisers ──
    const [advisers, setAdvisers] = useState([]);
    const [advisersLoading, setAdvisersLoading] = useState(false);
    const [advisersError, setAdvisersError] = useState("");

    // ── Filter state (optional, kung gusto mong controlled sa context) ──
    const [roleFilter, setRoleFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // ─────────────────────────────────────────────────────────────
    // HELPER — clean selectedrole array
    // ─────────────────────────────────────────────────────────────
    const normalizeSelectedRoles = (rawSelected, currentRole) => {
        const arr = Array.isArray(rawSelected)
            ? rawSelected
            : rawSelected
            ? [rawSelected]
            : [];

        const clean = [
            ...new Set(
                arr
                    .map((r) => String(r).trim().toLowerCase())
                    .filter((r) => SWITCHABLE_ROLES.includes(r))
            ),
        ];

        const role = String(currentRole || "").toLowerCase();
        if (SWITCHABLE_ROLES.includes(role) && !clean.includes(role)) {
            clean.push(role);
        }

        return clean;
    };

    // ─────────────────────────────────────────────────────────────
    // CREATE — Add User
    // ─────────────────────────────────────────────────────────────
    const AddUser = useCallback(
        async (values) => {
            console.log("Send Payloads", values);

            try {
                const formData = new FormData();

                // ── Basic fields ──
                formData.append("first_name", values.first_name || "");
                formData.append("last_name", values.last_name || "");
                formData.append("middle_name", values.middle_name || "");
                formData.append("suffix", values.suffix || "");
                formData.append("username", values.username || values.email || "");
                formData.append("email", values.email || "");
                formData.append("role", values.role || "");
                formData.append("password", values.password || "");
                formData.append("confirmPassword", values.confirmPassword || "");
                formData.append("departmentId", values.departmentId || values.department || "");

                // ── Optional fields ──
                if (values.referralCode) formData.append("referralCode", values.referralCode);
                if (values.address) formData.append("address", values.address);
                if (values.contactNumber) formData.append("contactNumber", values.contactNumber);
                if (values.avatar) formData.append("avatar", values.avatar);
                if (values.statusAccount) formData.append("statusAccount", values.statusAccount);
                if (values.status) formData.append("status", values.status);

                // ── Selected (switchable) roles ──
                const cleanSelected = normalizeSelectedRoles(values.selectedrole, values.role);
                cleanSelected.forEach((r) => formData.append("selectedrole", r));

                // ── Debug log ──
                console.log("FormData entries (AddUser):");
                for (let pair of formData.entries()) {
                    console.log(`${pair[0]}: ${pair[1]}`);
                }

                const response = await axiosInstance.post(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/authentication/signup`,
                    formData,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                console.log("AddUser Response", response);

                if (response.data?.success === true) {
                    return { success: true, data: response.data.data };
                }

                setCustomError(response.data?.message || "Failed to add user.");
                return {
                    success: false,
                    error: response.data?.message || "Failed to add user.",
                };
            } catch (error) {
                const message =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    "Something went wrong.";

                console.error("Error adding user:", error);
                setCustomError(message);
                return { success: false, error: message };
            }
        },
        [authToken]
    );

    // ─────────────────────────────────────────────────────────────
    // READ — Fetch Users Data (with optional filters)
    // ─────────────────────────────────────────────────────────────
    const FetchUsersData = useCallback(
        async (filters = {}) => {
            if (!authToken) return;

            try {
                const params = {
                    page: filters.page || currentPage,
                    limit: filters.limit || rowsPerPage,
                };

                if (filters.search || searchQuery) {
                    params.search = filters.search || searchQuery;
                }
                if (filters.role || roleFilter) {
                    params.role = filters.role || roleFilter;
                }
                if (filters.departmentId || departmentFilter) {
                    params.departmentId = filters.departmentId || departmentFilter;
                }
                if (filters.statusAccount || statusFilter) {
                    params.statusAccount = filters.statusAccount || statusFilter;
                }

                const response = await axiosInstance.get(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/userStudent`,
                    {
                        params,
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Cache-Control": "no-cache",
                        },
                    }
                );

                const userData = response.data.data;
                const pagination = response.data.pagination || {};

                setUsers(userData || []);
                setTotalUserCount(pagination.totalUser || 0);
                setTotalPages(pagination.totalPages || 0);
                setCurrentPage(pagination.currentPage || 1);
                setRowsPerPage(pagination.limit || rowsPerPage);

                return { success: true, data: userData };
            } catch (error) {
                console.error("Error fetching users:", error);
                return { success: false, error: error.message };
            } finally {
                setLoading(false);
            }
        },
        [authToken, currentPage, rowsPerPage, searchQuery, roleFilter, departmentFilter, statusFilter]
    );

    // ─────────────────────────────────────────────────────────────
    // FETCH ADVISERS
    // ─────────────────────────────────────────────────────────────
    const FetchAdvisers = useCallback(
        async (groupId = null) => {
            if (!authToken) return;

            setAdvisersLoading(true);
            setAdvisersError("");

            try {
                const params = {};
                if (groupId) params.groupId = groupId;

                const response = await axiosInstance.get(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/userStudent/userdropdown`,
                    {
                        params,
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                        },
                    }
                );

                if (response.data?.success === true) {
                    setAdvisers(response.data.data || []);
                    return { success: true, data: response.data.data };
                } else {
                    setAdvisersError(response.data?.message || "Failed to fetch advisers");
                    return {
                        success: false,
                        error: response.data?.message || "Failed to fetch advisers",
                    };
                }
            } catch (error) {
                const message =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    "Failed to fetch advisers";

                console.error("Error fetching advisers:", error);
                setAdvisersError(message);
                return { success: false, error: message };
            } finally {
                setAdvisersLoading(false);
            }
        },
        [authToken]
    );

    const UpdateUser = useCallback(
        async (dataID, values) => {
            try {
                const formData = new FormData();

                // ── Basic fields ──
                formData.append("first_name", values.first_name || "");
                formData.append("last_name", values.last_name || "");
                formData.append("middle_name", values.middle_name || "");
                formData.append("suffix", values.suffix || "");
                formData.append("email", values.email || "");
                formData.append("role", values.role || "");
                formData.append("laboratoryId", values.laboratoryId || "");

                // ── Department ──
                const deptId = values.departmentId || values.department || "";
                if (deptId) formData.append("departmentId", deptId);

                // ── Status ──
                if (values.statusAccount) formData.append("statusAccount", values.statusAccount);
                if (values.status) formData.append("status", values.status);

                // ── Avatar (optional) ──
                if (values.avatar && typeof values.avatar !== "string") {
                    formData.append("avatar", values.avatar);
                }

                // ── Selected (switchable) roles ──
                const cleanSelected = normalizeSelectedRoles(values.selectedrole, values.role);
                cleanSelected.forEach((r) => formData.append("selectedrole", r));

                // ── Optional password change ──
                if (values.password) {
                    formData.append("password", values.password);
                    formData.append("confirmPassword", values.confirmPassword || "");
                }

                // ── Debug log ──
                console.log("FormData entries (UpdateUser):");
                for (let pair of formData.entries()) {
                    console.log(`${pair[0]}: ${pair[1]}`);
                }

                const response = await axiosInstance.patch(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/authentication/User/${dataID}`,
                    formData,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                console.log("UpdateUser Response", response);

                // ✅ Accept either `success: true` or `status: "success"`
                const isSuccess =
                    response.data?.success === true ||
                    response.data?.status === "success";

                if (isSuccess) {
                    await FetchUsersData();
                    return { success: true, data: response.data.data };
                } else {
                    setCustomError(response.data?.message || "Failed to update user.");
                    return {
                        success: false,
                        error: response.data?.message || "Failed to update user.",
                    };
                }
            } catch (error) {
                const message =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    "Something went wrong.";

                console.error("Error updating user:", error);
                setCustomError(message);
                return { success: false, error: message };
            }
        },
        [authToken, FetchUsersData]
    );


    const DeleteUser = useCallback(
        async (userId) => {
            try {
                const response = await axiosInstance.delete(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/User/${userId}`,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                        },
                    }
                );

                const isSuccess =
                    response.data?.success === true ||
                    response.data?.status === "success";

                if (isSuccess) {
                    // Optimistic UI update
                    setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
                    // Refresh to keep pagination/counts accurate
                    await FetchUsersData();
                    return { success: true };
                } else {
                    setCustomError(response.data?.message || "Failed to delete user.");
                    return {
                        success: false,
                        error: response.data?.message || "Failed to delete user.",
                    };
                }
            } catch (error) {
                const message =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    "Failed to delete user.";

                console.error("Error deleting user:", error);
                setCustomError(message);
                return { success: false, error: message };
            }
        },
        [authToken, FetchUsersData]
    );

    // ─────────────────────────────────────────────────────────────
    // Search / Pagination handlers
    // ─────────────────────────────────────────────────────────────
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        setCurrentPage(1);
    }, []);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Initial fetch on mount / token change
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!authToken) return;

        const fetchAllData = async () => {
            setLoading(true);
            try {
                await Promise.all([FetchUsersData()]);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        FetchAdvisers();
        fetchAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authToken]);

    // Refetch when pagination or search changes
    useEffect(() => {
        if (authToken) {
            FetchUsersData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchQuery, authToken]);

    return (
        <UserDisplayContext.Provider
            value={{
                // ── USER DATA ──
                userdata,
                DeleteUser,
                UpdateUser,
                totalUserCount,
                FetchUsersData,
                AddUser,
                loading,
                searchQuery,
                setSearchQuery: handleSearch,
                currentPage,
                totalPages,
                setCurrentPage: handlePageChange,
                rowsPerPage,
                setRowsPerPage,
                handleSearch,
                handlePageChange,
                customError,

                // ── FILTERS (optional) ──
                roleFilter,
                setRoleFilter,
                departmentFilter,
                setDepartmentFilter,
                statusFilter,
                setStatusFilter,

                // ── ADVISERS DATA ──
                advisers,
                advisersLoading,
                advisersError,
                FetchAdvisers,
            }}
        >
            {children}
        </UserDisplayContext.Provider>
    );
};