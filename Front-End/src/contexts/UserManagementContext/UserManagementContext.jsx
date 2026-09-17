import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";
import axiosInstance from "../../components/ReusableFolder/axiosInstance";

export const UserDisplayContext = createContext();

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

    // ✅ MGA DAGDAG NA STATE PARA SA ADVISERS
    const [advisers, setAdvisers] = useState([]);
    const [advisersLoading, setAdvisersLoading] = useState(false);
    const [advisersError, setAdvisersError] = useState("");

    // CREATE - Add User
    const AddUser = useCallback(
        async (values) => {

            console.log("Send Payloads", values)
            try {
                const formData = new FormData();
                formData.append("first_name", values.first_name || "");
                formData.append("last_name", values.last_name || "");
                formData.append("username", values.email || "");
                formData.append("suffix", values.suffix || "");
                // ❌ TANGGALIN ITO - gender
                // formData.append("gender", values.gender || "");
                formData.append("role", values.role || "");
                formData.append("password", values.password || "");
                formData.append("confirmPassword", values.confirmPassword || "");
                formData.append("departmentId", values.department || "");

                console.log("FormData entries:");
                for (let pair of formData.entries()) {
                    console.log(pair[0] + ': ' + pair[1]);
                }

                // ✅ IDAGDAG ITO - selectedrole
                if (values.selectedrole) {
                    if (Array.isArray(values.selectedrole)) {
                        values.selectedrole.forEach(role => {
                            formData.append("selectedrole[]", role);
                        });
                    } else {
                        formData.append("selectedrole", values.selectedrole);
                    }
                }

                if (values.middle_name) {
                    formData.append("middle_name", values.middle_name);
                }
                if (values.referralCode) {
                    formData.append("referralCode", values.referralCode);
                }
                if (values.address) {
                    formData.append("address", values.address);
                }
                if (values.contactNumber) {
                    formData.append("contactNumber", values.contactNumber);
                }
                if (values.avatar) formData.append("avatar", values.avatar);

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

                console.log("REsponse", response)

                if (response.data?.success === true) {
                    return { success: true, data: response.data.data };
                } else {
                    setCustomError(response.data?.message || "Failed to add user.");
                    return { success: false, error: response.data?.message || "Failed to add user." };
                }
            } catch (error) {
                const message = error.response?.data?.message ||
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

    // READ - Fetch Users Data
    const FetchUsersData = useCallback(async () => {
        if (!authToken) return;

        try {
            const params = {
                page: currentPage,
                limit: rowsPerPage,
                search: searchQuery,
            };

            const response = await axiosInstance.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/userStudent`,
                {
                    params: params,
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Cache-Control": "no-cache",
                    },
                }
            );

            const userData = response.data.data;
            const pagination = response.data.pagination;

            setUsers(userData);
            setTotalUserCount(pagination.totalUser);
            setTotalPages(pagination.totalPages);
            setCurrentPage(pagination.currentPage);
            setRowsPerPage(pagination.limit);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    }, [authToken, currentPage, rowsPerPage, searchQuery]);

    // ✅ FETCH ADVISERS - COMPLETE
    const FetchAdvisers = useCallback(async (groupId = null) => {
        if (!authToken) return;

        setAdvisersLoading(true);
        setAdvisersError("");

        try {
            const params = {};
            if (groupId) {
                params.groupId = groupId;
            }

            const response = await axiosInstance.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/userStudent/userdropdown`,
                {
                    params: params,
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
                return { success: false, error: response.data?.message || "Failed to fetch advisers" };
            }
        } catch (error) {
            const message = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Failed to fetch advisers";

            console.error("Error fetching advisers:", error);
            setAdvisersError(message);
            return { success: false, error: message };
        } finally {
            setAdvisersLoading(false);
        }
    }, [authToken]);

    // UPDATE - Update User
    const UpdateUser = useCallback(
        async (dataID, values) => {
            try {
                const formData = new FormData();
                formData.append("first_name", values.first_name || "");
                formData.append("last_name", values.last_name || "");
                formData.append("middle_name", values.middle_name || "");
                formData.append("email", values.email || "");
                formData.append("role", values.role || "");
                formData.append("laboratoryId", values.laboratoryId || "");
                if (values.avatar) formData.append("avatar", values.avatar);

                const response = await axiosInstance.patch(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/User/${dataID}`,
                    formData,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                if (response.data?.status === "success") {
                    await FetchUsersData();
                    return { success: true, data: response.data.data };
                } else {
                    setCustomError(response.data?.message || "Failed to update user.");
                    return { success: false, error: response.data?.message || "Failed to update user." };
                }
            } catch (error) {
                const message = error.response?.data?.message ||
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

    // DELETE - Delete User
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

                if (response.data.status === "success") {
                    setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
                    return { success: true };
                } else {
                    setCustomError(response.data?.message || "Failed to delete user.");
                    return { success: false, error: response.data?.message || "Failed to delete user." };
                }
            } catch (error) {
                const message = error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    "Failed to delete user.";

                console.error("Error deleting user:", error);
                setCustomError(message);
                return { success: false, error: message };
            }
        },
        [authToken]
    );

    // Handle search
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        setCurrentPage(1);
    }, []);

    // Handle page change
    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    // Fetch all data on initial mount and when authToken changes
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
    }, [authToken]);

    // Fetch data when pagination or search changes
    useEffect(() => {
        if (authToken) {
            FetchUsersData();
        }
    }, [currentPage, searchQuery, authToken]);

    return (
        <UserDisplayContext.Provider
            value={{
                // USER DATA
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

                // ✅ ADVISERS DATA
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