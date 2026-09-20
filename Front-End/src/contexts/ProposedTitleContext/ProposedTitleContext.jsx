import React, { createContext, useState, useContext, useEffect } from "react";
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

    // ============================
    // ✅ READY TITLES STATE
    // ============================
    const [readyTitles, setReadyTitles] = useState([]);
    const [totalReadyTitles, setTotalReadyTitles] = useState(0);
    const [readyTotalPages, setReadyTotalPages] = useState(1);
    const [readyCurrentPage, setReadyCurrentPage] = useState(1);
    const [readySearch, setReadySearch] = useState("");
    const [readyDateFrom, setReadyDateFrom] = useState("");
    const [readyDateTo, setReadyDateTo] = useState("");
    const [readyGroupIdFilter, setReadyGroupIdFilter] = useState("");

    // ============================
    // ✅ ARCHIVED TITLES STATE  (NEW)
    // ============================
    const [archivedTitles, setArchivedTitles] = useState([]);
    const [totalArchivedTitles, setTotalArchivedTitles] = useState(0);
    const [archivedTotalPages, setArchivedTotalPages] = useState(1);
    const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
    const [archivedSearch, setArchivedSearch] = useState("");
    const [archivedDateFrom, setArchivedDateFrom] = useState("");
    const [archivedDateTo, setArchivedDateTo] = useState("");
    const [archivedGroupIdFilter, setArchivedGroupIdFilter] = useState("");

    const limit = 5;

    // ============================
    // FETCH PROPOSED TITLES (with pagination, search, filter)
    // ============================
    const FetchProposedTitles = async (
        page = 1,
        limit = 5,
        searchTerm = "",
        fromDate = "",
        toDate = "",
        status = "",
        groupId = ""
    ) => {
        if (!authToken) return;

        try {
            setIsLoading(true);

            const params = {
                page,
                limit,
            };

            if (searchTerm && searchTerm.trim() !== "") {
                params.search = searchTerm.trim();
            }

            if (fromDate && fromDate.trim() !== "") {
                params.dateFrom = fromDate.trim();
            }

            if (toDate && toDate.trim() !== "") {
                params.dateTo = toDate.trim();
            }

            if (status && status.trim() !== "") {
                params.status = status.trim();
            }

            if (groupId && groupId.trim() !== "") {
                params.groupId = groupId.trim();
            }

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
    // ✅ FETCH READY TITLES (FIXED)
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

            const params = {
                page,
                limit,
            };

            if (searchTerm && searchTerm.trim() !== "") {
                params.search = searchTerm.trim();
            }

            if (fromDate && fromDate.trim() !== "") {
                params.dateFrom = fromDate.trim();
            }

            if (toDate && toDate.trim() !== "") {
                params.dateTo = toDate.trim();
            }

            if (groupId && groupId.trim() !== "") {
                params.groupId = groupId.trim();
            }

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
    // ✅ FETCH ARCHIVED TITLES  (NEW)
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

            const params = {
                page,
                limit,
            };

            if (searchTerm && searchTerm.trim() !== "") {
                params.search = searchTerm.trim();
            }

            if (fromDate && fromDate.trim() !== "") {
                params.dateFrom = fromDate.trim();
            }

            if (toDate && toDate.trim() !== "") {
                params.dateTo = toDate.trim();
            }

            if (groupId && groupId.trim() !== "") {
                params.groupId = groupId.trim();
            }

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
    // FETCH SINGLE PROPOSED TITLE BY ID
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
    // CREATE PROPOSED TITLE (with file upload)
    // ============================
    const CreateProposedTitle = async (formData) => {
        console.log("formData", formData);

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

                return { success: true, data: res.data.data };
            }

            setCustomError("Failed to create proposed title.");
            return { success: false };
        } catch (error) {
            console.error("Create Proposed Title Error:", error);

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
        }
    };

    // ============================
    // UPDATE PROPOSED TITLE
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
    // DELETE PROPOSED TITLE
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
    // BULK UPDATE STATUS
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
    // GET PROPOSED TITLES BY GROUP
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
    // GET PROPOSED TITLES BY STATUS
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
    // GET FILE FROM CLOUDINARY
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
    // VIEW FILE IN NEW TAB
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
    // RESET FILTERS
    // ============================
    const ResetFilters = () => {
        setSearch("");
        setDateFrom("");
        setDateTo("");
        setStatusFilter("");
        setGroupIdFilter("");
        setCurrentPage(1);
    };

    // ============================
    // ✅ RESET READY FILTERS
    // ============================
    const ResetReadyFilters = () => {
        setReadySearch("");
        setReadyDateFrom("");
        setReadyDateTo("");
        setReadyGroupIdFilter("");
        setReadyCurrentPage(1);
    };

    // ============================
    // ✅ RESET ARCHIVED FILTERS  (NEW)
    // ============================
    const ResetArchivedFilters = () => {
        setArchivedSearch("");
        setArchivedDateFrom("");
        setArchivedDateTo("");
        setArchivedGroupIdFilter("");
        setArchivedCurrentPage(1);
    };

    // ============================
    // AUTO-FETCH ON FILTER CHANGE
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
            groupIdFilter
        );
    }, [authToken, search, dateFrom, dateTo, statusFilter, groupIdFilter]);

    // ============================
    // ✅ AUTO-FETCH READY TITLES
    // ============================
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
    }, [
        authToken,
        readyCurrentPage,
        readySearch,
        readyDateFrom,
        readyDateTo,
        readyGroupIdFilter,
    ]);

    // ============================
    // ✅ AUTO-FETCH ARCHIVED TITLES  (NEW)
    // ============================
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
    }, [
        authToken,
        archivedCurrentPage,
        archivedSearch,
        archivedDateFrom,
        archivedDateTo,
        archivedGroupIdFilter,
    ]);

    // ============================
    // CONTEXT PROVIDER
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

                // ✅ Ready Titles State
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

                // ✅ Archived Titles State  (NEW)
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

                // Functions
                FetchProposedTitles,
                FetchReadyTitle,
                FetchArchivedTitle,          // NEW
                FetchProposedTitleById,
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
                ResetArchivedFilters,        // NEW
            }}
        >
            {children}
        </ProposedTitleContext.Provider>
    );
};