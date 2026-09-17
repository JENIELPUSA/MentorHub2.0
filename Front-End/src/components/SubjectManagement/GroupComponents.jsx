// GroupDashboard.jsx
import React, { useContext, useState, useEffect } from 'react';
import {
    Users,
    Folder,
    Calendar,
    User,
    Plus,
    Loader2,
    Copy,
    Check,
    Edit,
    Save,
    Trash2,
    ArrowLeft,
    UserPlus,
    Search,
    Grid3x3,
    List,
    Mail,
    BadgeCheck,
    Clock,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Activity,
    UserCheck,
    UserX,
    Layers,
    CalendarDays,
    Award,
    Star,
    Target,
    PieChart,
    Percent,
    Hash,
    Clock as ClockIcon,
    Zap,
    X,
    UserCog,
    UserCircle,
    Shield,
    ChevronDown,
    Hourglass
} from 'lucide-react';
import { GroupContext } from '../../contexts/GroupNameContext/GroupNameContext';
import { UserDisplayContext } from '../../contexts/UserManagementContext/UserManagementContext';

const GroupDashboard = ({
    isOpen = false,
    section,
    onSectionChange,
    onClose,
    onBackToSections = null,
    groupsData = [],
    isLoadingGroupsData = false
}) => {
    const {
        createGroup,
        updateGroup,
        groupsData: contextGroupsData,
        isLoading: contextLoading,
        fetchReferralBy,
        isReferralData, isProposedTitle,
        setReferralData,
        assignAdviserAndCoAdviser
    } = useContext(GroupContext);
    const { advisers, advisersLoading } = useContext(UserDisplayContext);

    // States for group list
    const [showForm, setShowForm] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copiedCode, setCopiedCode] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');


    console.log("isProposedTitle",isProposedTitle)

    // States for detail view
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const [memberFilter, setMemberFilter] = useState('all');


    // States for Adviser/Co-Adviser
    const [showAdviserModal, setShowAdviserModal] = useState(false);
    const [adviserModalType, setAdviserModalType] = useState('adviser');
    const [selectedAdviserId, setSelectedAdviserId] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignError, setAssignError] = useState('');

    // availableUsers ay nakabase sa advisers mula sa context
    const [availableUsers, setAvailableUsers] = useState([]);

    // Use either props groupsData or context groupsData
    const displayGroups = groupsData.length > 0 ? groupsData : contextGroupsData || [];


    // Kapag nagbago ang advisers, i-update ang availableUsers
    useEffect(() => {
        if (selectedGroup && advisers && advisers.length > 0) {
            const available = advisers.filter(user => {
                const isCurrentAdviser = selectedGroup.adviserId?._id === user._id;
                const isCurrentCoAdviser = selectedGroup.coadviserId?._id === user._id;
                return !isCurrentAdviser && !isCurrentCoAdviser;
            });
            setAvailableUsers(available);
        } else if (advisers && advisers.length > 0) {
            setAvailableUsers(advisers);
        }
    }, [advisers, selectedGroup]);

    // Reset all internal view state whenever the dashboard is closed
    useEffect(() => {
        if (!isOpen) {
            console.log("🔚 [GroupDashboard] Dashboard closed - Resetting all states");

            if (setReferralData) {
                console.log("🧹 [GroupDashboard] Clearing referral data");
                setReferralData(null);
            }

            setSelectedGroup(null);
            setIsEditing(false);
            setShowDeleteConfirm(false);
            setShowForm(false);
            setSearchTerm('');
            setMemberSearchTerm('');
            setMemberFilter('all');
            setError('');
            setShowAdviserModal(false);
            setSelectedAdviserId('');
            setAvailableUsers([]);
            setAssignError('');
        }
    }, [isOpen, setReferralData]);

    useEffect(() => {
        console.log("📂 [GroupDashboard] Section changed:", section?.title || section?.name || 'Unknown');

        if (setReferralData) {
            console.log("🧹 [GroupDashboard] Clearing referral data on section change");
            setReferralData(null);
        }

        setSelectedGroup(null);
        setIsEditing(false);
        setShowDeleteConfirm(false);
        setShowAdviserModal(false);
        setAvailableUsers([]);
        setSelectedAdviserId('');
    }, [section, setReferralData]);

    // ==================== GATE: DO NOT RENDER UNTIL "VIEW GROUPS" OPENS THIS ====================
    if (!isOpen || !section) {
        return null;
    }

    // Use real data only - no dummy fallback
    const filteredGroups = displayGroups?.filter(group => {
        const groupSectionId = group.sectionId?._id || group.sectionId || group.sectionId?.id;
        const currentSectionId = section?.id || section?._id || section?.sectionId;
        return groupSectionId === currentSectionId;
    }) || [];


    // Search filter for groups
    const searchedGroups = filteredGroups.filter(group =>
        group.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get members for selected group - use isReferralData if available
    const getGroupMembers = () => {
        if (isReferralData?.length > 0 && selectedGroup?.referralCode) {
            return isReferralData;
        }
        return selectedGroup?.members || [];
    };

    // Filter members
    const filteredMembers = getGroupMembers().filter(member => {
        const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
        const matchesSearch = fullName.includes(memberSearchTerm.toLowerCase()) ||
            (member.email || '').toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
            (member.username || '').toLowerCase().includes(memberSearchTerm.toLowerCase());

        const matchesStatus = memberFilter === 'all' ||
            (member.status || 'Active').toLowerCase() === memberFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    // ===================== HANDLE BACK TO SECTIONS =====================
    const handleBackToSections = () => {
        console.log("⬅️ [GroupDashboard] Going back to sections view");

        if (setReferralData) {
            console.log("🧹 [GroupDashboard] Clearing referral data on back to sections");
            setReferralData(null);
        }

        setSelectedGroup(null);
        setIsEditing(false);
        setShowDeleteConfirm(false);
        setError('');
        setShowAdviserModal(false);
        setAvailableUsers([]);
        setSelectedAdviserId('');

        // Use callback if provided, otherwise use onSectionChange/onClose
        if (onBackToSections) {
            onBackToSections();
        } else if (onSectionChange) {
            onSectionChange(null);
        } else if (onClose) {
            onClose();
        }
    };

    // ===================== GROUP LIST FUNCTIONS =====================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!groupName.trim()) {
            setError('Group name is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const sectionId = section?.id || section?._id || section?.sectionId;
            if (!sectionId) {
                throw new Error('Section ID is missing');
            }

            const payload = {
                name: groupName.trim(),
                sectionId: sectionId
            };

            console.log("📝 [GroupDashboard] Creating new group:", payload);
            await createGroup(payload);

            setGroupName('');
            setShowForm(false);
        } catch (err) {
            setError(err.message || 'Failed to create group');
            console.error('❌ [GroupDashboard] Error creating group:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        console.log("❌ [GroupDashboard] Form cancelled");
        setGroupName('');
        setShowForm(false);
        setError('');
    };

    const getReferralLink = (referralCode) => {
        if (!referralCode) return '';
        const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        return `${baseUrl}/register?ref=${referralCode}`;
    };

    const handleCopyReferralLink = (referralCode, groupId) => {
        const link = getReferralLink(referralCode);
        console.log("📋 [GroupDashboard] Copying referral link for group:", groupId, "Link:", link);

        navigator.clipboard.writeText(link).then(() => {
            setCopiedCode(groupId);
            setTimeout(() => setCopiedCode(null), 2000);
        }).catch(err => {
            const textArea = document.createElement('textarea');
            textArea.value = link;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopiedCode(groupId);
            setTimeout(() => setCopiedCode(null), 2000);
        });
    };

    // ===================== DETAIL VIEW FUNCTIONS =====================
    const handleSelectGroup = async (group) => {
        setSelectedGroup(group);
        setEditName(group.name || '');
        setIsEditing(false);
        setShowDeleteConfirm(false);
        setMemberSearchTerm('');
        setMemberFilter('all');
        setShowForm(false);
        setShowAdviserModal(false);
        setSelectedAdviserId('');

        if (advisers && advisers.length > 0) {
            const available = advisers.filter(user => {
                const isCurrentAdviser = group.adviserId?._id === user._id;
                const isCurrentCoAdviser = group.coadviserId?._id === user._id;
                return !isCurrentAdviser && !isCurrentCoAdviser;
            });
            setAvailableUsers(available);
        }

        if (group.referralCode) {
            try {
                console.log(`[GroupDashboard] Fetching fresh data for: ${group.referralCode}`);
                await fetchReferralBy(group.referralCode);
            } catch (error) {
                console.error("❌ [GroupDashboard] Error fetching referral data:", error);
            }
        }
    };

    const handleCloseDashboard = () => {
        console.log("🚪 [GroupDashboard] Closing dashboard");

        if (setReferralData) {
            console.log("🧹 [GroupDashboard] Clearing referral data on close");
            setReferralData(null);
        }

        setSelectedGroup(null);
        setIsEditing(false);
        setShowDeleteConfirm(false);
        setError('');
        setShowAdviserModal(false);
        setAvailableUsers([]);
        setSelectedAdviserId('');

        if (onClose) {
            onClose();
        } else if (onSectionChange) {
            onSectionChange(null);
        }
    };

    const handleSaveEdit = async () => {
        if (!editName.trim()) {
            setError('Group name is required');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            console.log("✏️ [GroupDashboard] Updating group:", selectedGroup._id, "New name:", editName.trim());
            await updateGroup(selectedGroup._id, { name: editName.trim() });
            setIsEditing(false);
            setSelectedGroup({ ...selectedGroup, name: editName.trim() });
        } catch (err) {
            setError(err.message || 'Failed to update group');
            console.error('❌ [GroupDashboard] Error updating group:', err);
        } finally {
            setIsSaving(false);
        }
    };


    // ===================== ADVISER/CO-ADVISER FUNCTIONS =====================

    const handleOpenAdviserModal = (type) => {
        setAdviserModalType(type);
        setShowAdviserModal(true);
        setSelectedAdviserId('');
        setAssignError('');

        if (selectedGroup && advisers && advisers.length > 0) {
            const available = advisers.filter(user => {
                const isCurrentAdviser = selectedGroup.adviserId?._id === user._id;
                const isCurrentCoAdviser = selectedGroup.coadviserId?._id === user._id;

                if (type === 'adviser') {
                    return !isCurrentAdviser && !isCurrentCoAdviser;
                }
                return !isCurrentCoAdviser && !isCurrentAdviser;
            });
            setAvailableUsers(available);
        } else if (advisers && advisers.length > 0) {
            setAvailableUsers(advisers);
        } else {
            setAvailableUsers([]);
            setAssignError('No advisers available');
        }
    };

    console.log("selectedGroup",selectedGroup)

    const handleAssignAdviser = async () => {
        if (!selectedAdviserId) {
            setAssignError('Please select an adviser');
            return;
        }

        setIsAssigning(true);
        setAssignError('');

        try {
            const selectedUser = availableUsers.find(u => u._id === selectedAdviserId);

            let adviserId = selectedGroup.adviserId?._id || null;
            let coadviserId = selectedGroup.coadviserId?._id || null;

            if (adviserModalType === 'adviser') {
                adviserId = selectedAdviserId;
            } else {
                coadviserId = selectedAdviserId;
            }

            const result = await assignAdviserAndCoAdviser(
                selectedGroup._id,
                adviserId,
                coadviserId
            );

            if (result.success) {
                const updatedGroup = {
                    ...selectedGroup,
                    adviserId: adviserModalType === 'adviser'
                        ? selectedUser || { _id: selectedAdviserId, first_name: 'Loading...', last_name: '' }
                        : selectedGroup.adviserId,
                    coadviserId: adviserModalType === 'coadviser'
                        ? selectedUser || { _id: selectedAdviserId, first_name: 'Loading...', last_name: '' }
                        : selectedGroup.coadviserId,
                    adviserStatus: adviserModalType === 'adviser' ? 'pending' : selectedGroup.adviserStatus,
                    coadviserStatus: adviserModalType === 'coadviser' ? 'pending' : selectedGroup.coadviserStatus
                };

                setSelectedGroup(updatedGroup);
                setShowAdviserModal(false);
                setSelectedAdviserId('');

                if (selectedGroup?.referralCode) {
                    await fetchReferralBy(selectedGroup.referralCode);
                }
            } else {
                setAssignError(result.message || result.error || 'Failed to assign adviser');
            }
        } catch (error) {
            setAssignError(error.message || 'Failed to assign adviser');
            console.error('Error assigning adviser:', error);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleRemoveAdviser = async (type) => {
        try {
            let adviserId = selectedGroup.adviserId?._id || null;
            let coadviserId = selectedGroup.coadviserId?._id || null;

            if (type === 'adviser') {
                adviserId = null;
            } else {
                coadviserId = null;
            }

            const result = await assignAdviserAndCoAdviser(
                selectedGroup._id,
                adviserId,
                coadviserId
            );

            if (result.success) {
                const updatedGroup = {
                    ...selectedGroup,
                    adviserId: adviserId ? selectedGroup.adviserId : null,
                    coadviserId: coadviserId ? selectedGroup.coadviserId : null,
                    adviserStatus: type === 'adviser' ? null : selectedGroup.adviserStatus,
                    coadviserStatus: type === 'coadviser' ? null : selectedGroup.coadviserStatus
                };
                setSelectedGroup(updatedGroup);

                if (selectedGroup?.referralCode) {
                    await fetchReferralBy(selectedGroup.referralCode);
                }
            } else {
                setError(result.message || result.error || 'Failed to remove adviser');
            }
        } catch (error) {
            setError(error.message || 'Failed to remove adviser');
            console.error('Error removing adviser:', error);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateTime = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'Active': { bg: 'bg-green-100', text: 'text-green-700', icon: BadgeCheck },
            'Inactive': { bg: 'bg-gray-100', text: 'text-gray-600', icon: Clock },
            'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock }
        };
        const config = statusMap[status] || statusMap['Inactive'];
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <Icon className="w-3 h-3" />
                {status}
            </span>
        );
    };

    // ===================== ADVISER STATUS DISPLAY HELPER =====================
    const getAdviserStatusDisplay = (status, type) => {
        const statusConfigs = {
            'approved': {
                bg: 'bg-green-100',
                text: 'text-green-700',
                icon: BadgeCheck,
                label: 'Approved ✓',
                description: 'Adviser has been approved'
            },
            'pending': {
                bg: 'bg-yellow-100',
                text: 'text-yellow-700',
                icon: Hourglass,
                label: 'Waiting for Approval ⏳',
                description: 'Request is pending approval'
            },
            'rejected': {
                bg: 'bg-red-100',
                text: 'text-red-700',
                icon: X,
                label: 'Rejected ✗',
                description: 'Request has been rejected'
            }
        };

        const config = statusConfigs[status] || statusConfigs['pending'];
        const Icon = config.icon;

        return {
            badge: (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {config.label}
                </span>
            ),
            description: config.description,
            isPending: status === 'pending',
            isApproved: status === 'approved',
            isRejected: status === 'rejected'
        };
    };

    // ===================== PROPOSED TITLE STATUS BADGE =====================
    const getProposedTitleStatusBadge = (status) => {
        const statusMap = {
            'Approved':  { bg: 'bg-green-100',  text: 'text-green-700',  icon: BadgeCheck, label: 'Approved' },
            'Pending':   { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Hourglass,  label: 'Pending' },
            'Rejected':  { bg: 'bg-red-100',    text: 'text-red-700',    icon: X,          label: 'Rejected' },
        };
        const config = statusMap[status] || { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock, label: status || 'N/A' };
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    // ===================== STATISTICS COMPUTATIONS =====================
    const calculateGroupStats = (group) => {
        let members = group?.members || [];
        if (isReferralData?.length > 0 && group?.referralCode) {
            members = isReferralData;
        }

        const total = members.length;

        const active = members.filter(m => m.status === 'Active' || m.isActive !== false).length;
        const inactive = members.filter(m => m.status === 'Inactive' || m.isActive === false).length;
        const pending = members.filter(m => m.status === 'Pending').length;

        const roles = {};
        members.forEach(m => {
            const role = m.role || 'student';
            roles[role] = (roles[role] || 0) + 1;
        });

        const activityRate = total > 0 ? Math.round((active / total) * 100) : 0;

        const sortedMembers = [...members].sort((a, b) =>
            new Date(a.createdAt) - new Date(b.createdAt)
        );
        const recentMembers = sortedMembers.slice(-3);

        return {
            total,
            active,
            inactive,
            pending,
            roles,
            activityRate,
            recentMembers,
            oldestMember: sortedMembers[0],
            newestMember: sortedMembers[sortedMembers.length - 1],
            roleCount: Object.keys(roles).length
        };
    };

    // ===================== STATISTICS CARD COMPONENT =====================
    const StatCard = ({ icon: Icon, title, value, subtitle, color, trend, trendLabel }) => (
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
            {trend !== undefined && trend !== null && (
                <div className="flex items-center gap-1 mt-2">
                    {trend > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    ) : trend < 0 ? (
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    ) : null}
                    <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {trend > 0 ? '+' : ''}{trend}% {trendLabel}
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToSections}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sections
                    </button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">
                                {section?.title || section?.name || 'Section'}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleCloseDashboard}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
                {selectedGroup ? (
                    // ==================== DETAIL VIEW ====================
                    <div>


                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-start gap-3">
                                    <span className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                        <Folder className="w-5 h-5" />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        {isEditing ? (
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => {
                                                        setEditName(e.target.value);
                                                        setError('');
                                                    }}
                                                    className="w-full max-w-md px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg font-bold"
                                                    autoFocus
                                                    disabled={isSaving}
                                                />
                                                {error && <p className="text-xs text-red-600">{error}</p>}
                                            </div>
                                        ) : (
                                            <h3 className="text-xl font-bold text-gray-900">{selectedGroup.name}</h3>
                                        )}
                                        <p className="text-sm text-gray-500">
                                            Section: {section?.title || section?.name || 'N/A'} • {calculateGroupStats(selectedGroup).total} members
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isEditing && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Edit Group Name"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {isEditing && (
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={handleSaveEdit}
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                            ) : (
                                                <><Save className="w-4 h-4" /> Save Changes</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditName(selectedGroup.name);
                                                setError('');
                                            }}
                                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Adviser/Co-Adviser Section */}
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-purple-600" />
                                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                            Advisers
                                        </h4>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenAdviserModal('adviser')}
                                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition flex items-center gap-1"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            Add Adviser
                                        </button>
                                        <button
                                            onClick={() => handleOpenAdviserModal('coadviser')}
                                            className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-lg transition flex items-center gap-1"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            Add Co-Adviser
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Adviser Card */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-100 rounded-lg">
                                                    <UserCog className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Main Adviser</p>
                                                    {selectedGroup.adviserId && selectedGroup.adviserId._id ? (
                                                        <>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {selectedGroup.adviserId.first_name} {selectedGroup.adviserId.last_name}
                                                                {selectedGroup.adviserId.email && (
                                                                    <span className="text-xs font-normal text-gray-400 block">
                                                                        {selectedGroup.adviserId.email}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <div className="mt-1.5">
                                                                {(() => {
                                                                    const statusDisplay = getAdviserStatusDisplay(
                                                                        selectedGroup.adviserStatus || 'pending',
                                                                        'adviser'
                                                                    );
                                                                    return (
                                                                        <div className="flex flex-col gap-0.5">
                                                                            {statusDisplay.badge}
                                                                            {statusDisplay.isPending && (
                                                                                <p className="text-[10px] text-yellow-600">
                                                                                    ⚠️ This request is waiting for approval from the approver
                                                                                </p>
                                                                            )}
                                                                            {statusDisplay.isApproved && (
                                                                                <p className="text-[10px] text-green-600">
                                                                                    ✅ Adviser has been approved and can now manage the group
                                                                                </p>
                                                                            )}
                                                                            {statusDisplay.isRejected && (
                                                                                <p className="text-[10px] text-red-600">
                                                                                    ❌ Request has been rejected. Please contact the approver.
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-gray-400">Not assigned</p>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedGroup.adviserId && selectedGroup.adviserId._id && selectedGroup.adviserStatus !== 'pending' && (
                                                <button
                                                    onClick={() => handleRemoveAdviser('adviser')}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Remove Adviser"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Co-Adviser Card */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-pink-100 rounded-lg">
                                                    <UserCircle className="w-4 h-4 text-pink-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Co-Adviser</p>
                                                    {selectedGroup.coadviserId && selectedGroup.coadviserId._id ? (
                                                        <>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {selectedGroup.coadviserId.first_name} {selectedGroup.coadviserId.last_name}
                                                                {selectedGroup.coadviserId.email && (
                                                                    <span className="text-xs font-normal text-gray-400 block">
                                                                        {selectedGroup.coadviserId.email}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <div className="mt-1.5">
                                                                {(() => {
                                                                    const statusDisplay = getAdviserStatusDisplay(
                                                                        selectedGroup.coadviserStatus || 'pending',
                                                                        'coadviser'
                                                                    );
                                                                    return (
                                                                        <div className="flex flex-col gap-0.5">
                                                                            {statusDisplay.badge}
                                                                            {statusDisplay.isPending && (
                                                                                <p className="text-[10px] text-yellow-600">
                                                                                    ⚠️ This request is waiting for approval from the approver
                                                                                </p>
                                                                            )}
                                                                            {statusDisplay.isApproved && (
                                                                                <p className="text-[10px] text-green-600">
                                                                                    ✅ Co-adviser has been approved and can now assist with the group
                                                                                </p>
                                                                            )}
                                                                            {statusDisplay.isRejected && (
                                                                                <p className="text-[10px] text-red-600">
                                                                                    ❌ Request has been rejected. Please contact the approver.
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-gray-400">Not assigned</p>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedGroup.coadviserId && selectedGroup.coadviserId._id && selectedGroup.coadviserStatus !== 'pending' && (
                                                <button
                                                    onClick={() => handleRemoveAdviser('coadviser')}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Remove Co-Adviser"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                            </div>

                            {/* Group Statistics Section */}
                            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Group Statistics & Analytics
                                    </h4>
                                    <span className="ml-auto text-xs text-gray-400">
                                        Updated: {formatDateTime(new Date().toISOString())}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <StatCard
                                        icon={Users}
                                        title="Total Members"
                                        value={calculateGroupStats(selectedGroup).total}
                                        subtitle={`${calculateGroupStats(selectedGroup).active} active`}
                                        color="bg-blue-500"
                                        trend={calculateGroupStats(selectedGroup).activityRate}
                                        trendLabel="active rate"
                                    />
                                    <StatCard
                                        icon={UserCheck}
                                        title="Active"
                                        value={calculateGroupStats(selectedGroup).active}
                                        subtitle={`${calculateGroupStats(selectedGroup).activityRate}% of total`}
                                        color="bg-green-500"
                                    />
                                    <StatCard
                                        icon={UserX}
                                        title="Inactive"
                                        value={calculateGroupStats(selectedGroup).inactive}
                                        subtitle={`${calculateGroupStats(selectedGroup).pending} pending`}
                                        color="bg-gray-500"
                                    />
                                    <StatCard
                                        icon={Layers}
                                        title="Roles"
                                        value={calculateGroupStats(selectedGroup).roleCount}
                                        subtitle={`${Object.keys(calculateGroupStats(selectedGroup).roles).join(', ')}`}
                                        color="bg-purple-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                    {/* Role Distribution */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-4 h-4 text-purple-500" />
                                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Role Distribution</span>
                                        </div>
                                        {Object.entries(calculateGroupStats(selectedGroup).roles).length > 0 ? (
                                            <div className="space-y-1">
                                                {Object.entries(calculateGroupStats(selectedGroup).roles).map(([role, count]) => (
                                                    <div key={role} className="flex items-center justify-between text-sm">
                                                        <span className="capitalize text-gray-600">{role}</span>
                                                        <span className="font-semibold text-gray-900">{count}</span>
                                                    </div>
                                                ))}
                                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-1 flex">
                                                    {Object.entries(calculateGroupStats(selectedGroup).roles).map(([role, count], idx) => {
                                                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
                                                        return (
                                                            <div
                                                                key={role}
                                                                className={`h-full ${colors[idx % colors.length]}`}
                                                                style={{ width: `${(count / calculateGroupStats(selectedGroup).total) * 100}%` }}
                                                                title={`${role}: ${count} (${Math.round((count / calculateGroupStats(selectedGroup).total) * 100)}%)`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400">No roles data</p>
                                        )}
                                    </div>

                                    {/* Status Distribution */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <PieChart className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Status Distribution</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-16 h-16">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-gray-700">{calculateGroupStats(selectedGroup).total}</span>
                                                </div>
                                                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                                                    {calculateGroupStats(selectedGroup).total > 0 && (
                                                        <>
                                                            <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-gray-100" strokeWidth="3.6" />
                                                            {calculateGroupStats(selectedGroup).active > 0 && (
                                                                <circle
                                                                    cx="18" cy="18" r="15.9"
                                                                    fill="none"
                                                                    className="stroke-green-500"
                                                                    strokeWidth="3.6"
                                                                    strokeDasharray={`${(calculateGroupStats(selectedGroup).active / calculateGroupStats(selectedGroup).total) * 100} 100`}
                                                                    strokeLinecap="round"
                                                                />
                                                            )}

                    
                                                            {calculateGroupStats(selectedGroup).pending > 0 && (
                                                                <circle
                                                                    cx="18" cy="18" r="15.9"
                                                                    fill="none"
                                                                    className="stroke-yellow-500"
                                                                    strokeWidth="3.6"
                                                                    strokeDasharray={`${(calculateGroupStats(selectedGroup).pending / calculateGroupStats(selectedGroup).total) * 100} 100`}
                                                                    strokeLinecap="round"
                                                                    strokeDashoffset={`-${(calculateGroupStats(selectedGroup).active / calculateGroupStats(selectedGroup).total) * 100}`}
                                                                />
                                                            )}
                                                            {calculateGroupStats(selectedGroup).inactive > 0 && (
                                                                <circle
                                                                    cx="18" cy="18" r="15.9"
                                                                    fill="none"
                                                                    className="stroke-gray-400"
                                                                    strokeWidth="3.6"
                                                                    strokeDasharray={`${(calculateGroupStats(selectedGroup).inactive / calculateGroupStats(selectedGroup).total) * 100} 100`}
                                                                    strokeLinecap="round"
                                                                    strokeDashoffset={`-${((calculateGroupStats(selectedGroup).active + calculateGroupStats(selectedGroup).pending) / calculateGroupStats(selectedGroup).total) * 100}`}
                                                                />
                                                            )}
                                                        </>
                                                    )}
                                                </svg>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                        Active
                                                    </span>
                                                    <span className="font-semibold">{calculateGroupStats(selectedGroup).active}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                                        Pending
                                                    </span>
                                                    <span className="font-semibold">{calculateGroupStats(selectedGroup).pending}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                                        Inactive
                                                    </span>
                                                    <span className="font-semibold">{calculateGroupStats(selectedGroup).inactive}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap className="w-4 h-4 text-yellow-500" />
                                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Recent Activity</span>
                                        </div>
                                        {calculateGroupStats(selectedGroup).recentMembers.length > 0 ? (
                                            <div className="space-y-1.5">
                                                {calculateGroupStats(selectedGroup).recentMembers.slice(0, 3).map((member, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-600 truncate max-w-[100px]">
                                                            {member.first_name} {member.last_name}
                                                        </span>
                                                        <span className="text-gray-400">
                                                            {formatDate(member.createdAt)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {calculateGroupStats(selectedGroup).recentMembers.length > 3 && (
                                                    <p className="text-xs text-gray-400">+{calculateGroupStats(selectedGroup).recentMembers.length - 3} more</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400">No recent activity</p>
                                        )}
                                        {calculateGroupStats(selectedGroup).oldestMember && (
                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-400">First member</span>
                                                    <span className="text-gray-600">
                                                        {calculateGroupStats(selectedGroup).oldestMember.first_name} {calculateGroupStats(selectedGroup).oldestMember.last_name}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                                    <div className="bg-white/80 rounded-lg px-3 py-2 text-center border border-gray-100">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Referral Code</p>
                                        <p className="font-mono font-bold text-sm text-blue-600">{selectedGroup.referralCode || 'N/A'}</p>
                                    </div>
                                    <div className="bg-white/80 rounded-lg px-3 py-2 text-center border border-gray-100">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Created</p>
                                        <p className="font-semibold text-sm text-gray-700">{formatDate(selectedGroup.createdAt)}</p>
                                    </div>
                                    <div className="bg-white/80 rounded-lg px-3 py-2 text-center border border-gray-100">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Activity Rate</p>
                                        <p className="font-semibold text-sm text-green-600">{calculateGroupStats(selectedGroup).activityRate}%</p>
                                    </div>
                                    <div className="bg-white/80 rounded-lg px-3 py-2 text-center border border-gray-100">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Roles</p>
                                        <p className="font-semibold text-sm text-purple-600">{calculateGroupStats(selectedGroup).roleCount}</p>
                                    </div>
                                </div>
                            </div>

                            {/* ==================== PROPOSED TITLES TABLE (BELOW STATISTICS) ==================== */}
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-indigo-600" />
                                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                            Proposed Titles
                                        </h4>
                                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                                            {isProposedTitle?.length || 0}
                                        </span>
                                    </div>
                                </div>

                                {isProposedTitle && isProposedTitle.length > 0 ? (
                                    <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adviser</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Co-Adviser</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selected</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {isProposedTitle.map((item, index) => (
                                                    <tr key={item._id || index} className="hover:bg-gray-50 transition">
                                                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-gray-900">{item.title || 'Untitled'}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm text-gray-600 max-w-[220px] truncate" title={item.description}>
                                                                {item.description || '—'}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {item.adviser ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                                    <UserCog className="w-3 h-3" /> Yes
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">No</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {item.coAdviser ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                                                                    <UserCircle className="w-3 h-3" /> Yes
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">No</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {getProposedTitleStatusBadge(item.status)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {item.isSelected ? (
                                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                                                                    <Check className="w-4 h-4" /> Selected
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm text-gray-600 max-w-[180px] truncate" title={item.remarks}>
                                                                {item.remarks || '—'}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {item.fileUrl ? (
                                                                <a
                                                                    href={item.fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                                                >
                                                                    <Folder className="w-3.5 h-3.5" /> View File
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">No file</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
                                        <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No proposed titles yet</p>
                                    </div>
                                )}
                            </div>

                            {/* Referral Link */}
                            {selectedGroup.referralCode && (
                                <div className="p-6 border-b border-gray-100">
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <p className="text-sm text-gray-700 font-medium mb-2 flex items-center gap-2">
                                            <UserPlus className="w-4 h-4 text-blue-600" />
                                            Referral Link
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 truncate">
                                                {getReferralLink(selectedGroup.referralCode)}
                                            </div>
                                            <button
                                                onClick={() => handleCopyReferralLink(selectedGroup.referralCode, selectedGroup._id)}
                                                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition flex-shrink-0"
                                            >
                                                {copiedCode === selectedGroup._id ? (
                                                    <Check className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <Copy className="w-5 h-5 text-gray-500" />
                                                )}
                                            </button>
                                        </div>
                                        {copiedCode === selectedGroup._id && (
                                            <p className="text-sm text-green-600 mt-2">✓ Copied to clipboard!</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Member Table */}
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-gray-600" />
                                        <h4 className="text-lg font-semibold text-gray-900">
                                            Members ({filteredMembers.length})
                                        </h4>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="relative">
                                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Search members..."
                                                value={memberSearchTerm}
                                                onChange={(e) => setMemberSearchTerm(e.target.value)}
                                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm w-full sm:w-48"
                                            />
                                        </div>
                                        <select
                                            value={memberFilter}
                                            onChange={(e) => setMemberFilter(e.target.value)}
                                            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email / Username</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredMembers.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                        {memberSearchTerm ? 'No members match your search' : 'No members in this group yet'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredMembers.map((member) => (
                                                    <tr key={member.id || member._id} className="hover:bg-gray-50 transition">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                                                                    {member.first_name?.[0]}{member.last_name?.[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">
                                                                        {member.first_name} {member.middle_name || ''} {member.last_name}
                                                                        {member.suffix && ` ${member.suffix}`}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400">ID: {member.id?.slice(-6) || member._id?.slice(-6) || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                                    {member.email}
                                                                </p>
                                                                <p className="text-xs text-gray-400">@{member.username}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                                                                {member.role || 'student'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">{getStatusBadge(member.status)}</td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm text-gray-600">{formatDateTime(member.createdAt)}</p>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        </div>
                    </div>
                ) : (
                    // ==================== GROUP LIST VIEW ====================
                    <>
                        {/* Dashboard Controls */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search groups..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-48 md:w-64 text-sm"
                                    />
                                </div>

                                <div className="flex bg-gray-100 rounded-xl p-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <Grid3x3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                New Group
                            </button>
                        </div>

                        {/* ADD GROUP FORM */}
                        {showForm && (
                            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 animate-fadeIn">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-blue-600" />
                                        Create New Group
                                    </h4>
                                    <button
                                        onClick={handleCancel}
                                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={groupName}
                                                onChange={(e) => {
                                                    setGroupName(e.target.value);
                                                    setError('');
                                                }}
                                                placeholder="Enter group name..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                                autoFocus
                                                disabled={isLoading}
                                            />
                                            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {isLoading ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                                                ) : (
                                                    <><Plus className="w-4 h-4" /> Create Group</>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition"
                                                disabled={isLoading}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Groups Grid/List */}
                        {contextLoading || isLoadingGroupsData ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : searchedGroups.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-10 h-10 text-gray-400" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-700">
                                    {searchTerm ? 'No matching groups found' : 'No groups yet'}
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">
                                    {searchTerm ? 'Try adjusting your search terms' : 'Click "New Group" to create your first group'}
                                </p>
                                {!searchTerm && (
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition flex items-center gap-2 mx-auto"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create First Group
                                    </button>
                                )}
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {searchedGroups.map((group) => {
                                    const groupStats = calculateGroupStats(group);
                                    return (
                                        <div
                                            key={group._id || group.id}
                                            onClick={() => handleSelectGroup(group)}
                                            className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                        <Folder className="w-4 h-4" />
                                                    </span>
                                                    <h5 className="font-semibold text-gray-900 truncate max-w-[150px]">
                                                        {group.name}
                                                    </h5>
                                                </div>
                                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    #{filteredGroups.indexOf(group) + 1}
                                                </span>
                                            </div>

                                            {/* Display Adviser/Co-Adviser in Grid View with status */}
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {group.adviserId && group.adviserId._id && (
                                                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${group.adviserStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                                            group.adviserStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                group.adviserStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                    'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        <UserCog className="w-3 h-3" />
                                                        {group.adviserId.first_name} {group.adviserId.last_name}
                                                        {group.adviserStatus === 'pending' && (
                                                            <span className="ml-1 text-[10px] font-semibold text-yellow-600">⏳ Waiting</span>
                                                        )}
                                                        {group.adviserStatus === 'approved' && (
                                                            <BadgeCheck className="w-3 h-3 text-green-600" />
                                                        )}
                                                        {group.adviserStatus === 'rejected' && (
                                                            <X className="w-3 h-3 text-red-600" />
                                                        )}
                                                    </span>
                                                )}
                                                {group.coadviserId && group.coadviserId._id && (
                                                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${group.coadviserStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                                            group.coadviserStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                group.coadviserStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                    'bg-pink-100 text-pink-700'
                                                        }`}>
                                                        <UserCircle className="w-3 h-3" />
                                                        {group.coadviserId.first_name} {group.coadviserId.last_name}
                                                        {group.coadviserStatus === 'pending' && (
                                                            <span className="ml-1 text-[10px] font-semibold text-yellow-600">⏳ Waiting</span>
                                                        )}
                                                        {group.coadviserStatus === 'approved' && (
                                                            <BadgeCheck className="w-3 h-3 text-green-600" />
                                                        )}
                                                        {group.coadviserStatus === 'rejected' && (
                                                            <X className="w-3 h-3 text-red-600" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5" />
                                                    {groupStats.total}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'N/A'}
                                                </span>
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <BadgeCheck className="w-3.5 h-3.5" />
                                                    {groupStats.activityRate}%
                                                </span>
                                            </div>

                                            {group.referralCode && (
                                                <div className="mt-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCopyReferralLink(group.referralCode, group._id);
                                                        }}
                                                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors w-full justify-center"
                                                    >
                                                        {copiedCode === group._id ? (
                                                            <><Check className="w-3.5 h-3.5" /> Copied!</>
                                                        ) : (
                                                            <><Copy className="w-3.5 h-3.5" /> Copy Referral Link</>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adviser</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Co-Adviser</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active %</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referral Link</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {searchedGroups.map((group) => {
                                            const groupStats = calculateGroupStats(group);
                                            return (
                                                <tr
                                                    key={group._id || group.id}
                                                    onClick={() => handleSelectGroup(group)}
                                                    className="hover:bg-gray-50 transition cursor-pointer"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Folder className="w-4 h-4 text-blue-600" />
                                                            <span className="font-medium text-gray-900">{group.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {group.adviserId && group.adviserId._id ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-gray-700">
                                                                    {group.adviserId.first_name} {group.adviserId.last_name}
                                                                </span>
                                                                <span className={`text-[10px] font-medium flex items-center gap-1 ${group.adviserStatus === 'approved' ? 'text-green-600' :
                                                                        group.adviserStatus === 'pending' ? 'text-yellow-600' :
                                                                            group.adviserStatus === 'rejected' ? 'text-red-600' :
                                                                                'text-gray-500'
                                                                    }`}>
                                                                    {group.adviserStatus === 'pending' && <Hourglass className="w-3 h-3" />}
                                                                    {group.adviserStatus === 'approved' && <BadgeCheck className="w-3 h-3" />}
                                                                    {group.adviserStatus === 'rejected' && <X className="w-3 h-3" />}
                                                                    {group.adviserStatus === 'approved' ? '✓ Approved' :
                                                                        group.adviserStatus === 'pending' ? '⏳ Waiting for Approval' :
                                                                            group.adviserStatus === 'rejected' ? '✗ Rejected' :
                                                                                group.adviserStatus || 'Pending'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">Not assigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {group.coadviserId && group.coadviserId._id ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-gray-700">
                                                                    {group.coadviserId.first_name} {group.coadviserId.last_name}
                                                                </span>
                                                                <span className={`text-[10px] font-medium flex items-center gap-1 ${group.coadviserStatus === 'approved' ? 'text-green-600' :
                                                                        group.coadviserStatus === 'pending' ? 'text-yellow-600' :
                                                                            group.coadviserStatus === 'rejected' ? 'text-red-600' :
                                                                                'text-gray-500'
                                                                    }`}>
                                                                    {group.coadviserStatus === 'pending' && <Hourglass className="w-3 h-3" />}
                                                                    {group.coadviserStatus === 'approved' && <BadgeCheck className="w-3 h-3" />}
                                                                    {group.coadviserStatus === 'rejected' && <X className="w-3 h-3" />}
                                                                    {group.coadviserStatus === 'approved' ? '✓ Approved' :
                                                                        group.coadviserStatus === 'pending' ? '⏳ Waiting for Approval' :
                                                                            group.coadviserStatus === 'rejected' ? '✗ Rejected' :
                                                                                group.coadviserStatus || 'Pending'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">Not assigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="flex items-center gap-1 text-gray-600">
                                                            <User className="w-3.5 h-3.5" />
                                                            {groupStats.total}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-green-500 rounded-full"
                                                                    style={{ width: `${groupStats.activityRate}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm text-gray-600">{groupStats.activityRate}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 text-sm">
                                                        {group.createdAt ? formatDate(group.createdAt) : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {group.referralCode && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCopyReferralLink(group.referralCode, group._id);
                                                                }}
                                                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                                            >
                                                                {copiedCode === group._id ? (
                                                                    <><Check className="w-4 h-4" /> Copied</>
                                                                ) : (
                                                                    <><Copy className="w-4 h-4" /> Copy Link</>
                                                                )}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ==================== ADVISER MODAL ==================== */}
            {showAdviserModal && (
                <div
                    className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center animate-fadeIn"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowAdviserModal(false);
                            setAssignError('');
                            setSelectedAdviserId('');
                        }
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <UserCog className="w-5 h-5 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {adviserModalType === 'adviser' ? 'Add Adviser' : 'Add Co-Adviser'}
                                </h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAdviserModal(false);
                                    setAssignError('');
                                    setSelectedAdviserId('');
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                            {adviserModalType === 'adviser'
                                ? 'Select a main adviser to assign to this group. The request will need approval.'
                                : 'Select a co-adviser to assist the main adviser. The request will need approval.'}
                        </p>

                        {assignError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                {assignError}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select {adviserModalType === 'adviser' ? 'Adviser' : 'Co-Adviser'}
                            </label>
                            {advisersLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                                    <span className="ml-2 text-sm text-gray-500">Loading advisers...</span>
                                </div>
                            ) : (
                                <div className="relative">
                                    <select
                                        value={selectedAdviserId}
                                        onChange={(e) => {
                                            setSelectedAdviserId(e.target.value);
                                            setAssignError('');
                                        }}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white text-gray-700"
                                    >
                                        <option value="">Select an adviser...</option>
                                        {availableUsers.length === 0 ? (
                                            <option value="" disabled>No available advisers</option>
                                        ) : (
                                            availableUsers.map((user) => {
                                                const hasPendingAdviser = selectedGroup?.adviserStatus === 'pending' &&
                                                    selectedGroup?.adviserId?._id === user._id;
                                                const hasPendingCoAdviser = selectedGroup?.coadviserStatus === 'pending' &&
                                                    selectedGroup?.coadviserId?._id === user._id;
                                                const isPending = hasPendingAdviser || hasPendingCoAdviser;

                                                return (
                                                    <option key={user._id} value={user._id}>
                                                        {user.first_name} {user.last_name} {user.email ? `(${user.email})` : ''}
                                                        {isPending ? ' ⏳ (Pending Request)' : ''}
                                                    </option>
                                                );
                                            })
                                        )}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            )}
                            {availableUsers.length === 0 && !advisersLoading && (
                                <p className="text-xs text-gray-500 mt-1">No advisers available to assign</p>
                            )}
                        </div>

                        {selectedAdviserId && (
                            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Selected</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {availableUsers.find(u => u._id === selectedAdviserId)?.first_name}
                                    {availableUsers.find(u => u._id === selectedAdviserId)?.last_name}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {availableUsers.find(u => u._id === selectedAdviserId)?.email}
                                </p>
                            </div>
                        )}

                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-700 flex items-center gap-1.5">
                                <Hourglass className="w-4 h-4" />
                                <span>Once assigned, this request will need approval from the approver before it becomes active.</span>
                            </p>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={handleAssignAdviser}
                                disabled={isAssigning || !selectedAdviserId}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isAssigning ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</>
                                ) : (
                                    <><UserPlus className="w-4 h-4" /> Assign {adviserModalType === 'adviser' ? 'Adviser' : 'Co-Adviser'}</>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowAdviserModal(false);
                                    setAssignError('');
                                    setSelectedAdviserId('');
                                }}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupDashboard;