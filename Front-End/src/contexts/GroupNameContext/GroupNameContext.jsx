import { createContext, useState, useCallback, useEffect, useMemo, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
    const [customError, setCustomError] = useState("");
    const { authToken } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [groupsData, setGroups] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isReferralData, setReferralData] = useState("");

    // ====== GROUP DETAILS STATE ======
    const [groupDetails, setGroupDetails] = useState(null);
    const [referredUsers, setReferredUsers] = useState([]);
    const [userCount, setUserCount] = useState(0);

    // ====== DEFENSE STATE ======
    const [defenseGroups, setDefenseGroups] = useState([]);
    const [panelMembers, setPanelMembers] = useState([]);

    const [isProposedTitle, setProposedTitle] = useState(null);

    // Additional filters
    const [sectionFilter, setSectionFilter] = useState("");
    const [mentorFilter, setMentorFilter] = useState("");

    // Use ref to prevent infinite loops
    const isInitialMount = useRef(true);
    const fetchInProgress = useRef(false);

    const BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;
    const referralUrl = `${BASE_URL}/api/v1/referralCode/`;

    // ==========================================
    // FETCH GROUPS
    // ==========================================
    const fetchGroups = useCallback(async (params = {}) => {
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

            const page = params.page || 1;
            const limit = params.limit || 10;
            const search = params.search || "";
            const sectionId = params.sectionId || "";
            const mentorId = params.mentorId || "";

            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (search) queryParams.append("search", search);
            if (sectionId && sectionId !== "All") queryParams.append("sectionId", sectionId);
            if (mentorId && mentorId !== "All") queryParams.append("mentorId", mentorId);

            const fullUrl = `${BASE_URL}/api/v1/groups?${queryParams}`;
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
                setGroups(res.data.data || []);
                setTotalCount(res.data.totalCount || 0);
                setTotalPages(res.data.totalPages || 1);
                setCurrentPage(res.data.currentPage || page);

                if (params.limit && params.limit !== rowsPerPage) {
                    setRowsPerPage(params.limit);
                }
                if (params.search !== undefined) setSearchQuery(params.search);
                if (params.sectionId !== undefined) setSectionFilter(params.sectionId);
                if (params.mentorId !== undefined) setMentorFilter(params.mentorId);
            } else {
                setCustomError(res.data?.message || "Failed to fetch groups");
                setGroups([]);
            }
        } catch (error) {
            console.error("❌ Fetch Groups Error:", error);
            setCustomError(error.response?.data?.message || "Error fetching groups");
            setGroups([]);
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
        }
    }, [BASE_URL, authToken, rowsPerPage]);

    // ==========================================
    // FETCH REFERRAL BY
    // ==========================================
    const fetchReferralBy = useCallback(async (referralCode) => {
        if (!authToken) {
            console.warn("⚠️ No auth token available");
            return { success: false, data: [], error: "Authentication required" };
        }
        if (!referralCode) {
            console.warn("⚠️ No referral code provided");
            return { success: false, data: [], error: "Referral code is required" };
        }

        try {
            const res = await axios.get(
                `${BASE_URL}/api/v1/groups/ReferalData/${referralCode}`,
                {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );

            if (res.data?.status === "success") {
                console.log("✅ Referral data fetched successfully:", res.data);
                setReferralData(res.data.data || []);
                setProposedTitle(res.data.proposedTitles || []);
                return { success: true, data: res.data.data };
            }

            return {
                success: false,
                data: [],
                error: res.data?.message || "Failed to fetch referral data",
            };
        } catch (error) {
            console.error("❌ Fetch Referral Data Error:", error);
            return {
                success: false,
                error: error.response?.data?.message || "Error fetching referral data",
                data: [],
            };
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // GET GROUP DETAILS
    // ==========================================
    const getGroupDetails = useCallback(async (referredBy) => {
        if (!authToken) {
            console.warn("⚠️ No auth token available");
            return { success: false, data: null, error: "Authentication required" };
        }
        if (!referredBy) {
            console.warn("⚠️ No referral code provided");
            return { success: false, data: null, error: "Referral code is required" };
        }

        try {
            setLoading(true);
            setCustomError("");

            const cleanReferralCode = referredBy.toUpperCase().trim();

            const res = await axios.get(
                `${BASE_URL}/api/v1/groups/getgroupDetails/${cleanReferralCode}`,
                {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );

            if (res.data?.status === "success") {
                const groupData = res.data || null;
                const usersData = res.data.referredUsers || [];
                const count = res.data.userCount || 0;

                setGroupDetails(groupData);
                setReferredUsers(usersData);
                setUserCount(count);

                return {
                    success: true,
                    data: res.data,
                    group: groupData,
                    referredUsers: usersData,
                    userCount: count,
                };
            }

            setGroupDetails(null);
            setReferredUsers([]);
            setUserCount(0);

            return {
                success: false,
                data: null,
                error: res.data?.message || "Failed to fetch group details",
            };
        } catch (error) {
            console.error("❌ Fetch Group Details Error:", error);

            if (error.response?.status === 404) {
                setGroupDetails(null);
                setReferredUsers([]);
                setUserCount(0);
                return {
                    success: false,
                    error: "No group found with this referral code",
                    data: null,
                };
            }

            const errorMessage = error.response?.data?.message || "Error fetching group details";
            setCustomError(errorMessage);
            setGroupDetails(null);
            setReferredUsers([]);
            setUserCount(0);

            return { success: false, error: errorMessage, data: null };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // CLEAR GROUP DETAILS
    // ==========================================
    const clearGroupDetails = useCallback(() => {
        setGroupDetails(null);
        setReferredUsers([]);
        setUserCount(0);
    }, []);

    // ==========================================
    // GET SINGLE GROUP
    // ==========================================
    const getGroupById = useCallback(async (id) => {
        if (!authToken) return { success: false, error: "No authentication token" };
        try {
            setLoading(true);
            setCustomError("");
            const res = await axios.get(`${BASE_URL}/api/v1/groups/${id}`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (res.data?.status === "success") return { success: true, data: res.data.data };
            return { success: false };
        } catch (error) {
            console.error("Get Group Error:", error);
            const errorMessage = error.response?.data?.message || "Error fetching group";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // GET GROUP BY REFERRAL CODE
    // ==========================================
    const getGroupByReferralCode = useCallback(async (referralCode) => {
        if (!authToken) return { success: false, error: "No authentication token" };
        try {
            setLoading(true);
            setCustomError("");
            const res = await axios.get(
                `${BASE_URL}/api/v1/groups/referral/${referralCode}`,
                {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );
            if (res.data?.status === "success") return { success: true, data: res.data.data };
            return { success: false };
        } catch (error) {
            console.error("Get Group By Referral Code Error:", error);
            const errorMessage = error.response?.data?.message || "Error fetching group";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // GET GROUPS BY SECTION
    // ==========================================
    const getGroupsBySection = useCallback(async (sectionId) => {
        if (!authToken) return { success: false, data: [] };
        try {
            setLoading(true);
            setCustomError("");
            const res = await axios.get(
                `${BASE_URL}/api/v1/groups/section/${sectionId}`,
                {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );
            if (res.data?.status === "success") return { success: true, data: res.data.data };
            return { success: false, data: [] };
        } catch (error) {
            console.error("Get Groups By Section Error:", error);
            const errorMessage = error.response?.data?.message || "Error fetching groups";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage, data: [] };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // GET GROUPS BY MENTOR
    // ==========================================
    const getGroupsByMentor = useCallback(async (mentorId) => {
        if (!authToken) return { success: false, data: [] };
        try {
            setLoading(true);
            setCustomError("");
            const res = await axios.get(
                `${BASE_URL}/api/v1/groups/mentor/${mentorId}`,
                {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );
            if (res.data?.status === "success") return { success: true, data: res.data.data };
            return { success: false, data: [] };
        } catch (error) {
            console.error("Get Groups By Mentor Error:", error);
            const errorMessage = error.response?.data?.message || "Error fetching groups";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage, data: [] };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // GET GROUPS WITHOUT MENTOR
    // ==========================================
    const getGroupsWithoutMentor = useCallback(async () => {
        if (!authToken) return { success: false, data: [] };
        try {
            setLoading(true);
            setCustomError("");
            const res = await axios.get(`${BASE_URL}/api/v1/groups/no-mentor`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (res.data?.status === "success") return { success: true, data: res.data.data };
            return { success: false, data: [] };
        } catch (error) {
            console.error("Get Groups Without Mentor Error:", error);
            const errorMessage = error.response?.data?.message || "Error fetching groups";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage, data: [] };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // GET GROUPS FOR DEFENSE
    // ==========================================
    const getGroupForDefense = useCallback(async () => {
        if (!authToken) {
            console.warn("⚠️ No auth token available");
            return { success: false, data: null, error: "Authentication required" };
        }

        try {
            setLoading(true);
            setCustomError("");

            const res = await axios.get(
                `${BASE_URL}/api/v1/groups/GroupForDefense`,
                {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );

            console.log("📊 getGroupForDefense Response:", res.data);

            if (res.data?.status === "Success" || res.data?.status === "success") {
                const groupsData = res.data.data?.groups || [];
                const panelMembersData = res.data.data?.panelMembers || [];

                setDefenseGroups(groupsData);
                setPanelMembers(panelMembersData);

                return {
                    success: true,
                    groups: groupsData,
                    panelMembers: panelMembersData,
                    results: res.data.results || null,
                };
            }

            console.warn("⚠️ API returned non-success status:", res.data);
            setDefenseGroups([]);
            setPanelMembers([]);

            return {
                success: false,
                data: null,
                error: res.data?.message || "Failed to fetch groups for defense",
            };
        } catch (error) {
            console.error("❌ Get Group For Defense Error:", error);

            if (error.response?.status === 404) {
                setDefenseGroups([]);
                setPanelMembers([]);
                return { success: false, error: "No groups found for defense", data: null };
            }

            const errorMessage =
                error.response?.data?.message || "Error fetching groups for defense";
            setCustomError(errorMessage);
            setDefenseGroups([]);
            setPanelMembers([]);

            return { success: false, error: errorMessage, data: null };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken]);

    // ==========================================
    // CREATE GROUP
    // ==========================================
    const createGroup = useCallback(async (values) => {
        if (!authToken) return { success: false, error: "No authentication token" };
        try {
            setLoading(true);
            setCustomError("");
            const res = await axios.post(`${BASE_URL}/api/v1/groups`, values, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
            });
            if (res.data?.status === "Success" || res.data?.status === "success") {
                await fetchGroups({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    sectionId: sectionFilter,
                    mentorId: mentorFilter,
                });
                await getGroupForDefense();   // ✅ refresh defense groups
                return {
                    success: true,
                    data: res.data.data,
                    message: res.data.message || "Group created successfully",
                };
            }
            const errorMessage = res.data?.message || "Failed to create group";
            setCustomError(errorMessage);
            return { success: false, message: errorMessage };
        } catch (error) {
            console.error("Create Group Error:", error);
            const errorMessage = error.response?.data?.message || "Error creating group";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken, fetchGroups, getGroupForDefense, currentPage, rowsPerPage, searchQuery, sectionFilter, mentorFilter]);

    // ==========================================
    // UPDATE GROUP
    // ==========================================
    const updateGroup = useCallback(async (id, values) => {
        if (!authToken) return { success: false, error: "No authentication token" };
        try {
            setLoading(true);
            setCustomError("");
            const res = await axios.patch(`${BASE_URL}/api/v1/groups/${id}`, values, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
            });
            if (res.data?.status === "success") {
                await fetchGroups({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    sectionId: sectionFilter,
                    mentorId: mentorFilter,
                });
                await getGroupForDefense();   // ✅ refresh defense groups
                return {
                    success: true,
                    data: res.data.data,
                    message: res.data.message || "Group updated successfully",
                };
            }
            const errorMessage = res.data?.message || "Failed to update group";
            setCustomError(errorMessage);
            return { success: false, message: errorMessage };
        } catch (error) {
            console.error("Update Group Error:", error);
            const errorMessage = error.response?.data?.message || "Error updating group";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken, fetchGroups, getGroupForDefense, currentPage, rowsPerPage, searchQuery, sectionFilter, mentorFilter]);

    // ==========================================
    // DELETE GROUP
    // ==========================================
    const deleteGroup = useCallback(async (id) => {
        if (!authToken) return { success: false, error: "No authentication token" };
        try {
            setLoading(true);
            setCustomError("");
            const res = await axios.delete(`${BASE_URL}/api/v1/groups/${id}`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (res.data?.status === "success") {
                setGroups((prev) => prev.filter((g) => g._id !== id));
                await fetchGroups({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    sectionId: sectionFilter,
                    mentorId: mentorFilter,
                });
                await getGroupForDefense();   // ✅ refresh defense groups
                return { success: true, message: res.data.message || "Group deleted successfully" };
            }
            const errorMessage = res.data?.message || "Failed to delete group";
            setCustomError(errorMessage);
            return { success: false, message: errorMessage };
        } catch (error) {
            console.error("Delete Group Error:", error);
            const errorMessage = error.response?.data?.message || "Error deleting group";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken, fetchGroups, getGroupForDefense, currentPage, rowsPerPage, searchQuery, sectionFilter, mentorFilter]);

    // ==========================================
    // ADD MEMBER TO GROUP
    // ==========================================
    const addMemberToGroup = useCallback(async (groupId, userId) => {
        if (!authToken) return { success: false, error: "No authentication token" };
        try {
            setLoading(true);
            setCustomError("");
            const res = await axios.post(
                `${BASE_URL}/api/v1/groups/${groupId}/members`,
                { userId },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (res.data?.status === "success") {
                await fetchGroups({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    sectionId: sectionFilter,
                    mentorId: mentorFilter,
                });
                return {
                    success: true,
                    data: res.data.data,
                    message: res.data.message || "Member added successfully",
                };
            }
            const errorMessage = res.data?.message || "Failed to add member";
            setCustomError(errorMessage);
            return { success: false, message: errorMessage };
        } catch (error) {
            console.error("Add Member Error:", error);
            const errorMessage = error.response?.data?.message || "Error adding member";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken, fetchGroups, currentPage, rowsPerPage, searchQuery, sectionFilter, mentorFilter]);

    // ==========================================
    // REMOVE MEMBER FROM GROUP
    // ==========================================
    const removeMemberFromGroup = useCallback(async (groupId, userId) => {
        if (!authToken) return { success: false, error: "No authentication token" };
        try {
            setLoading(true);
            setCustomError("");
            const res = await axios.delete(
                `${BASE_URL}/api/v1/groups/${groupId}/members`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                    data: { userId },
                }
            );
            if (res.data?.status === "success") {
                await fetchGroups({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    sectionId: sectionFilter,
                    mentorId: mentorFilter,
                });
                return {
                    success: true,
                    data: res.data.data,
                    message: res.data.message || "Member removed successfully",
                };
            }
            const errorMessage = res.data?.message || "Failed to remove member";
            setCustomError(errorMessage);
            return { success: false, message: errorMessage };
        } catch (error) {
            console.error("Remove Member Error:", error);
            const errorMessage = error.response?.data?.message || "Error removing member";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken, fetchGroups, currentPage, rowsPerPage, searchQuery, sectionFilter, mentorFilter]);

    // ==========================================
    // ASSIGN MENTOR TO GROUP
    // ==========================================
    const assignMentor = useCallback(async (groupId, mentorId) => {
        if (!authToken) return { success: false, error: "No authentication token" };
        try {
            setLoading(true);
            setCustomError("");
            const res = await axios.post(
                `${BASE_URL}/api/v1/groups/${groupId}/mentor`,
                { mentorId },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (res.data?.status === "success") {
                await fetchGroups({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    sectionId: sectionFilter,
                    mentorId: mentorFilter,
                });
                return {
                    success: true,
                    data: res.data.data,
                    message: res.data.message || "Mentor assigned successfully",
                };
            }
            const errorMessage = res.data?.message || "Failed to assign mentor";
            setCustomError(errorMessage);
            return { success: false, message: errorMessage };
        } catch (error) {
            console.error("Assign Mentor Error:", error);
            const errorMessage = error.response?.data?.message || "Error assigning mentor";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken, fetchGroups, currentPage, rowsPerPage, searchQuery, sectionFilter, mentorFilter]);

    // ==========================================
    // ASSIGN ADVISER AND CO-ADVISER
    // ==========================================
    const assignAdviserAndCoAdviser = useCallback(async (groupId, adviserId, coadviserId) => {
        if (!authToken) return { success: false, error: "No authentication token" };
        try {
            setLoading(true);
            setCustomError("");
            const res = await axios.patch(
                `${BASE_URL}/api/v1/groups/assignAdviserCoAdviser/${groupId}`,
                { adviserId, coadviserId },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (res.data?.status === "success") {
                await fetchGroups({
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                    sectionId: sectionFilter,
                    mentorId: mentorFilter,
                });
                await getGroupForDefense();   // ✅ refresh defense groups
                return {
                    success: true,
                    data: res.data.data,
                    message: res.data.message || "Adviser and Co-adviser assigned successfully",
                };
            }
            const errorMessage = res.data?.message || "Failed to assign adviser and co-adviser";
            setCustomError(errorMessage);
            return { success: false, message: errorMessage };
        } catch (error) {
            console.error("Assign Adviser and Co-adviser Error:", error);
            const errorMessage =
                error.response?.data?.message || "Error assigning adviser and co-adviser";
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, authToken, fetchGroups, getGroupForDefense, currentPage, rowsPerPage, searchQuery, sectionFilter, mentorFilter]);

    // ==========================================
    // SEARCH GROUPS
    // ==========================================
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        setCurrentPage(1);
        fetchGroups({
            page: 1,
            limit: rowsPerPage,
            search: query,
            sectionId: sectionFilter,
            mentorId: mentorFilter,
        });
    }, [fetchGroups, rowsPerPage, sectionFilter, mentorFilter]);

    // ==========================================
    // FILTER BY SECTION
    // ==========================================
    const handleSectionFilter = useCallback((sectionId) => {
        setSectionFilter(sectionId);
        setCurrentPage(1);
        fetchGroups({
            page: 1,
            limit: rowsPerPage,
            search: searchQuery,
            sectionId,
            mentorId: mentorFilter,
        });
    }, [fetchGroups, rowsPerPage, searchQuery, mentorFilter]);

    // ==========================================
    // FILTER BY MENTOR
    // ==========================================
    const handleMentorFilter = useCallback((mentorId) => {
        setMentorFilter(mentorId);
        setCurrentPage(1);
        fetchGroups({
            page: 1,
            limit: rowsPerPage,
            search: searchQuery,
            sectionId: sectionFilter,
            mentorId,
        });
    }, [fetchGroups, rowsPerPage, searchQuery, sectionFilter]);

    // ==========================================
    // CHANGE PAGE
    // ==========================================
    const handlePageChange = useCallback((page) => {
        if (page !== currentPage) {
            setCurrentPage(page);
            fetchGroups({
                page,
                limit: rowsPerPage,
                search: searchQuery,
                sectionId: sectionFilter,
                mentorId: mentorFilter,
            });
        }
    }, [fetchGroups, rowsPerPage, searchQuery, currentPage, sectionFilter, mentorFilter]);

    // ==========================================
    // CHANGE ROWS PER PAGE
    // ==========================================
    const handleRowsPerPageChange = useCallback((rows) => {
        if (rows !== rowsPerPage) {
            setRowsPerPage(rows);
            setCurrentPage(1);
            fetchGroups({
                page: 1,
                limit: rows,
                search: searchQuery,
                sectionId: sectionFilter,
                mentorId: mentorFilter,
            });
        }
    }, [fetchGroups, searchQuery, rowsPerPage, sectionFilter, mentorFilter]);

    // ==========================================
    // CLEAR ALL FILTERS
    // ==========================================
    const clearFilters = useCallback(() => {
        setSearchQuery("");
        setSectionFilter("");
        setMentorFilter("");
        setCurrentPage(1);
        fetchGroups({
            page: 1,
            limit: rowsPerPage,
            search: "",
            sectionId: "",
            mentorId: "",
        });
    }, [fetchGroups, rowsPerPage]);

    // ==========================================
    // INITIAL FETCH ON MOUNT & AUTH CHANGE
    // ==========================================
    useEffect(() => {
        if (authToken && isInitialMount.current) {
            isInitialMount.current = false;
            fetchGroups({ page: 1, limit: rowsPerPage });
            getGroupForDefense();   // ✅ isang beses lang sa initial mount
        }
    }, [authToken, fetchGroups, rowsPerPage, getGroupForDefense]);

    // ==========================================
    // FETCH GROUPS WHEN PAGINATION OR FILTERS CHANGE
    // (Defense groups hindi kasama — hindi nagre-refetch sa filter changes)
    // ==========================================
    useEffect(() => {
        if (isInitialMount.current) return;

        if (authToken) {
            fetchGroups({
                page: currentPage,
                limit: rowsPerPage,
                search: searchQuery,
                sectionId: sectionFilter,
                mentorId: mentorFilter,
            });
        }
    }, [currentPage, searchQuery, rowsPerPage, authToken, sectionFilter, mentorFilter, fetchGroups]);

    // ==========================================
    // MEMOIZED CONTEXT VALUE
    // ==========================================
    const value = useMemo(() => ({
        // ===== CORE STATE =====
        groupsData,
        loading,
        customError,
        totalCount,
        totalPages,
        currentPage,
        rowsPerPage,
        searchQuery,
        sectionFilter,
        mentorFilter,

        // ===== GROUP DETAILS STATE =====
        groupDetails,
        referredUsers,
        userCount,

        // ===== DEFENSE STATE =====
        defenseGroups,
        panelMembers,

        // ===== CRUD OPERATIONS =====
        fetchGroups,
        fetchReferralBy,
        getGroupById,
        getGroupByReferralCode,
        getGroupsBySection,
        getGroupsByMentor,
        getGroupsWithoutMentor,
        createGroup,
        updateGroup,
        deleteGroup,
        addMemberToGroup,
        removeMemberFromGroup,
        assignMentor,
        assignAdviserAndCoAdviser,

        // ===== GROUP DETAILS FUNCTIONS =====
        getGroupDetails,
        clearGroupDetails,

        // ===== DEFENSE FUNCTIONS =====
        getGroupForDefense,

        // ===== UTILITY FUNCTIONS =====
        handleSearch,
        handleSectionFilter,
        handleMentorFilter,
        handlePageChange,
        handleRowsPerPageChange,
        clearFilters,

        // ===== SETTERS =====
        setSearchQuery,
        setSectionFilter,
        setMentorFilter,
        setReferralData,

        // ===== MISC =====
        isReferralData,
        isProposedTitle,
        referralUrl,
    }), [
        // ===== STATE =====
        groupsData,
        loading,
        customError,
        totalCount,
        totalPages,
        currentPage,
        rowsPerPage,
        searchQuery,
        sectionFilter,
        mentorFilter,
        groupDetails,
        referredUsers,
        userCount,
        defenseGroups,
        panelMembers,

        // ===== FUNCTIONS =====
        fetchGroups,
        fetchReferralBy,
        getGroupById,
        getGroupByReferralCode,
        getGroupsBySection,
        getGroupsByMentor,
        getGroupsWithoutMentor,
        createGroup,
        updateGroup,
        deleteGroup,
        addMemberToGroup,
        removeMemberFromGroup,
        assignMentor,
        assignAdviserAndCoAdviser,
        getGroupDetails,
        clearGroupDetails,
        getGroupForDefense,
        handleSearch,
        handleSectionFilter,
        handleMentorFilter,
        handlePageChange,
        handleRowsPerPageChange,
        clearFilters,

        // ===== MISC =====
        isReferralData,
        isProposedTitle,
        referralUrl,
    ]);

    return (
        <GroupContext.Provider value={value}>
            {children}
        </GroupContext.Provider>
    );
};

export default GroupProvider;