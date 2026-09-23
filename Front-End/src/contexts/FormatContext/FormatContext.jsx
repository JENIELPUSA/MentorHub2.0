import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const FormatContext = createContext();

export const FormatProvider = ({ children }) => {
    const { authToken } = useContext(AuthContext);

    const [customError, setCustomError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // ── List state ──
    const [formats, setFormats] = useState([]);
    const [singleFormat, setSingleFormat] = useState(null);
    const [totalFormats, setTotalFormats] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [uploadedByFilter, setUploadedByFilter] = useState("");
    const [selectedFormat, setSelectedFormat] = useState(null);

    const limit = 10;

    // ============================
    // READ ALL (with pagination + filters)
    // ============================
    const FetchFormats = async (
        page = 1,
        limit = 10,
        searchTerm = "",
        type = "",
        uploadedBy = ""
    ) => {
        if (!authToken) return;
        try {
            setIsLoading(true);

            const params = { page, limit };
            if (searchTerm?.trim()) params.search = searchTerm.trim();
            if (type?.trim()) params.type = type.trim();
            if (uploadedBy?.trim()) params.uploadedBy = uploadedBy.trim();

            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/formats`,
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

            setFormats(data || []);
            setTotalFormats(totalCount || 0);
            setTotalPages(totalPages || 1);
            setCurrentPage(currentPage || page);
        } catch (error) {
            console.error("Error fetching formats:", error);
            setCustomError(error.response?.data?.message || "Failed to fetch formats");
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // READ ONE
    // ============================
    const FetchFormatById = async (id) => {
        if (!authToken || !id) return;
        try {
            setIsLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/formats/${id}`,
                {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );
            setSingleFormat(res.data.data);
            return res.data.data;
        } catch (error) {
            setCustomError(error.response?.data?.message || "Failed to fetch format");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // CREATE (with file upload)
    // ============================
    const CreateFormat = async (formData) => {
        console.log("formData", formData);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/formats`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const status = res.data?.status;

            if (status === "Success" || status === "success" || status === true) {
                await FetchFormats(currentPage, limit, search, typeFilter, uploadedByFilter);
                return { success: true, data: res.data.data };
            }

            setCustomError("Failed to create format.");
            return { success: false };
        } catch (error) {
            console.error("Create Format Error:", error);

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
    // UPDATE (with optional file replacement)
    // ============================
    const UpdateFormat = async (id, updateData) => {
        if (!authToken || !id) return;
        try {
            setIsLoading(true);

            // Kung FormData (may file), ibang header
            const isFormData = updateData instanceof FormData;

            const res = await axios.put(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/formats/${id}`,
                updateData,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": isFormData
                            ? "multipart/form-data"
                            : "application/json",
                    },
                }
            );

            if (res.data.status === "success") {
                await FetchFormats(currentPage, limit, search, typeFilter, uploadedByFilter);
                return { success: true, data: res.data.data };
            }
            return { success: false };
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to update format";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // DELETE
    // ============================
    const DeleteFormat = async (id) => {
        if (!authToken || !id) return;
        try {
            setIsLoading(true);
            const res = await axios.delete(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/formats/${id}`,
                {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );

            if (res.data.status === "success") {
                await FetchFormats(currentPage, limit, search, typeFilter, uploadedByFilter);
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to delete format";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // ADDITIONAL UTILITIES
    // ============================
    const FetchFormatsByType = async (type) => {
        if (!authToken || !type) return [];
        try {
            setIsLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/formats/type/${type}`,
                {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );
            return res.data.data;
        } catch (error) {
            setCustomError(error.response?.data?.message || "Failed to fetch formats by type");
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    const FetchAllFormatsSimple = async () => {
        if (!authToken) return [];
        try {
            setIsLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/formats/simple`,
                {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );
            return res.data.data;
        } catch (error) {
            setCustomError(error.response?.data?.message || "Failed to fetch formats");
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    const FetchSelectedFormat = async (uploadedBy, type = "") => {
        if (!authToken || !uploadedBy) return null;
        try {
            setIsLoading(true);
            const params = { uploadedBy };
            if (type?.trim()) params.type = type.trim();

            const res = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/formats/selected`,
                {
                    params,
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );
            setSelectedFormat(res.data.data);
            return res.data.data;
        } catch (error) {
            setCustomError(error.response?.data?.message || "Failed to fetch selected format");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // RESET FILTERS
    // ============================
    const ResetFilters = () => {
        setSearch("");
        setTypeFilter("");
        setUploadedByFilter("");
        setCurrentPage(1);
    };

    // ============================
    // AUTO-FETCH ON FILTER CHANGE
    // ============================
    useEffect(() => {
        if (!authToken) return;
        FetchFormats(currentPage, limit, search, typeFilter, uploadedByFilter);
    }, [authToken, currentPage, search, typeFilter, uploadedByFilter]);

    // ============================
    // PROVIDER
    // ============================
    return (
        <FormatContext.Provider
            value={{
                // State
                formats,
                singleFormat,
                selectedFormat,
                totalFormats,
                isLoading,
                totalPages,
                currentPage,
                setCurrentPage,
                limit,
                search,
                setSearch,
                typeFilter,
                setTypeFilter,
                uploadedByFilter,
                setUploadedByFilter,
                customError,

                // CRUD
                FetchFormats,
                FetchFormatById,
                CreateFormat,
                UpdateFormat,
                DeleteFormat,

                // Utilities
                FetchFormatsByType,
                FetchAllFormatsSimple,
                FetchSelectedFormat,
                ResetFilters,
            }}
        >
            {children}
        </FormatContext.Provider>
    );
};