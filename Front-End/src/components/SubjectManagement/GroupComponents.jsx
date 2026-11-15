// GroupDashboard.jsx — My Groups Design (Blue, Yellow & White Theme)
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
    GraduationCap,
    BookOpen,
    School
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

    const [showForm, setShowForm] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copiedCode, setCopiedCode] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const [memberFilter, setMemberFilter] = useState('all');

    const [showAdviserModal, setShowAdviserModal] = useState(false);
    const [adviserModalType, setAdviserModalType] = useState('adviser');
    const [selectedAdviserId, setSelectedAdviserId] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignError, setAssignError] = useState('');

    const [availableUsers, setAvailableUsers] = useState([]);

    const displayGroups = groupsData.length > 0 ? groupsData : contextGroupsData || [];

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

    console.log("section",section)

    useEffect(() => {
        if (!isOpen) {
            if (setReferralData) setReferralData(null);
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
        if (setReferralData) setReferralData(null);
        setSelectedGroup(null);
        setIsEditing(false);
        setShowDeleteConfirm(false);
        setShowAdviserModal(false);
        setAvailableUsers([]);
        setSelectedAdviserId('');
    }, [section, setReferralData]);

    useEffect(() => {
        if (!showForm) return;
        const handleEscape = (e) => {
            if (e.key === 'Escape' && !isLoading) handleCancel();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showForm, isLoading]);

    if (!isOpen || !section) return null;

    const filteredGroups = displayGroups?.filter(group => {
        const groupSectionId = group.sectionId?._id || group.sectionId || group.sectionId?.id;
        const currentSectionId = section?.id || section?._id || section?.sectionId;
        return groupSectionId === currentSectionId;
    }) || [];

    const searchedGroups = filteredGroups.filter(group =>
        group.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getGroupMembers = () => {
        if (isReferralData?.length > 0 && selectedGroup?.referralCode) return isReferralData;
        return selectedGroup?.members || [];
    };

    const filteredMembers = getGroupMembers().filter(member => {
        const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
        const matchesSearch = fullName.includes(memberSearchTerm.toLowerCase()) ||
            (member.email || '').toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
            (member.username || '').toLowerCase().includes(memberSearchTerm.toLowerCase());
        const matchesStatus = memberFilter === 'all' ||
            (member.status || 'Active').toLowerCase() === memberFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const handleBackToSections = () => {
        if (setReferralData) setReferralData(null);
        setSelectedGroup(null);
        setIsEditing(false);
        setShowDeleteConfirm(false);
        setError('');
        setShowAdviserModal(false);
        setAvailableUsers([]);
        setSelectedAdviserId('');
        if (onBackToSections) onBackToSections();
        else if (onSectionChange) onSectionChange(null);
        else if (onClose) onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) { setError('Group name is required'); return; }
        setIsLoading(true);
        setError('');
        try {
            const sectionId = section?.id || section?._id || section?.sectionId;
            if (!sectionId) throw new Error('Section ID is missing');
            await createGroup({ name: groupName.trim(), sectionId });
            setGroupName('');
            setShowForm(false);
        } catch (err) {
            setError(err.message || 'Failed to create group');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (isLoading) return;
        setGroupName('');
        setShowForm(false);
        setError('');
    };

    const openCreateModal = () => {
        setGroupName('');
        setError('');
        setShowForm(true);
    };

    const getReferralLink = (referralCode) => {
        if (!referralCode) return '';
        const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        return `${baseUrl}/register?ref=${referralCode}`;
    };

    const handleCopyReferralLink = (referralCode, groupId) => {
        const link = getReferralLink(referralCode);
        navigator.clipboard.writeText(link).then(() => {
            setCopiedCode(groupId);
            setTimeout(() => setCopiedCode(null), 2000);
        }).catch(() => {
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
                await fetchReferralBy(group.referralCode);
            } catch (error) {
                console.error("Error fetching referral data:", error);
            }
        }
    };

    const handleCloseDashboard = () => {
        if (setReferralData) setReferralData(null);
        setSelectedGroup(null);
        setIsEditing(false);
        setShowDeleteConfirm(false);
        setError('');
        setShowAdviserModal(false);
        setAvailableUsers([]);
        setSelectedAdviserId('');
        if (onClose) onClose();
        else if (onSectionChange) onSectionChange(null);
    };

    const handleSaveEdit = async () => {
        if (!editName.trim()) { setError('Group name is required'); return; }
        setIsSaving(true);
        setError('');
        try {
            await updateGroup(selectedGroup._id, { name: editName.trim() });
            setIsEditing(false);
            setSelectedGroup({ ...selectedGroup, name: editName.trim() });
        } catch (err) {
            setError(err.message || 'Failed to update group');
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenAdviserModal = (type) => {
        setAdviserModalType(type);
        setShowAdviserModal(true);
        setSelectedAdviserId('');
        setAssignError('');
        if (selectedGroup && advisers && advisers.length > 0) {
            const available = advisers.filter(user => {
                const isCurrentAdviser = selectedGroup.adviserId?._id === user._id;
                const isCurrentCoAdviser = selectedGroup.coadviserId?._id === user._id;
                return !isCurrentAdviser && !isCurrentCoAdviser;
            });
            setAvailableUsers(available);
        } else if (advisers && advisers.length > 0) {
            setAvailableUsers(advisers);
        } else {
            setAvailableUsers([]);
            setAssignError('No advisers available');
        }
    };

    const handleAssignAdviser = async () => {
        if (!selectedAdviserId) { setAssignError('Please select an adviser'); return; }
        setIsAssigning(true);
        setAssignError('');
        try {
            const selectedUser = availableUsers.find(u => u._id === selectedAdviserId);
            let adviserId = selectedGroup.adviserId?._id || null;
            let coadviserId = selectedGroup.coadviserId?._id || null;
            if (adviserModalType === 'adviser') adviserId = selectedAdviserId;
            else coadviserId = selectedAdviserId;

            const result = await assignAdviserAndCoAdviser(selectedGroup._id, adviserId, coadviserId);
            if (result.success) {
                const updatedGroup = {
                    ...selectedGroup,
                    adviserId: adviserModalType === 'adviser'
                        ? selectedUser || { _id: selectedAdviserId, first_name: 'Loading...', last_name: '' }
                        : selectedGroup.adviserId,
                    coadviserId: adviserModalType === 'coadviser'
                        ? selectedUser || { _id: selectedAdviserId, first_name: 'Loading...', last_name: '' }
                        : selectedGroup.coadviserId,
                    adviserStatus: adviserModalType === 'adviser' ? 'approved' : selectedGroup.adviserStatus,
                    coadviserStatus: adviserModalType === 'coadviser' ? 'approved' : selectedGroup.coadviserStatus
                };
                setSelectedGroup(updatedGroup);
                setShowAdviserModal(false);
                setSelectedAdviserId('');
                if (selectedGroup?.referralCode) await fetchReferralBy(selectedGroup.referralCode);
            } else {
                setAssignError(result.message || result.error || 'Failed to assign adviser');
            }
        } catch (error) {
            setAssignError(error.message || 'Failed to assign adviser');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleRemoveAdviser = async (type) => {
        try {
            let adviserId = selectedGroup.adviserId?._id || null;
            let coadviserId = selectedGroup.coadviserId?._id || null;
            if (type === 'adviser') adviserId = null;
            else coadviserId = null;

            const result = await assignAdviserAndCoAdviser(selectedGroup._id, adviserId, coadviserId);
            if (result.success) {
                const updatedGroup = {
                    ...selectedGroup,
                    adviserId: adviserId ? selectedGroup.adviserId : null,
                    coadviserId: coadviserId ? selectedGroup.coadviserId : null,
                    adviserStatus: type === 'adviser' ? null : selectedGroup.adviserStatus,
                    coadviserStatus: type === 'coadviser' ? null : selectedGroup.coadviserStatus
                };
                setSelectedGroup(updatedGroup);
                if (selectedGroup?.referralCode) await fetchReferralBy(selectedGroup.referralCode);
            } else {
                setError(result.message || result.error || 'Failed to remove adviser');
            }
        } catch (error) {
            setError(error.message || 'Failed to remove adviser');
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });
    };

    const formatDateTime = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // ===== BLUE / YELLOW / WHITE BADGES =====
    const getStatusBadge = (status) => {
        const statusMap = {
            'Active':   { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: BadgeCheck },
            'Inactive': { bg: 'bg-slate-100',  text: 'text-slate-600',  icon: Clock },
            'Pending':  { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: Clock }
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

    const getAdviserStatusDisplay = (status) => {
        const statusConfigs = {
            'approved': {
                bg: 'bg-yellow-100', text: 'text-yellow-800',
                icon: BadgeCheck, label: 'Approved ✓',
            },
            'rejected': {
                bg: 'bg-slate-100', text: 'text-slate-600',
                icon: X, label: 'Rejected ✗',
            }
        };
        const config = statusConfigs[status] || statusConfigs['approved'];
        const Icon = config.icon;
        return {
            badge: (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {config.label}
                </span>
            ),
            isApproved: status === 'approved',
            isRejected: status === 'rejected'
        };
    };

    const getProposedTitleStatusBadge = (status) => {
        const statusMap = {
            'Approved': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: BadgeCheck, label: 'Approved' },
            'Pending':  { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: Clock,      label: 'Pending' },
            'Rejected': { bg: 'bg-slate-100',  text: 'text-slate-600',  icon: X,          label: 'Rejected' },
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

    const calculateGroupStats = (group) => {
        let members = group?.members || [];
        if (isReferralData?.length > 0 && group?.referralCode) members = isReferralData;

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
        const sortedMembers = [...members].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        return {
            total, active, inactive, pending, roles, activityRate,
            recentMembers: sortedMembers.slice(-3),
            oldestMember: sortedMembers[0],
            newestMember: sortedMembers[sortedMembers.length - 1],
            roleCount: Object.keys(roles).length
        };
    };

    // ===== BLUE / YELLOW / WHITE STAT CARD =====
    const StatCard = ({ icon: Icon, title, value, subtitle, color, trend, trendLabel }) => (
        <div className="bg-white rounded-xl border border-blue-100 p-4 hover:shadow-md hover:border-yellow-200 transition">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
            {trend !== undefined && trend !== null && (
                <div className="flex items-center gap-1 mt-2">
                    {trend > 0 ? <TrendingUp className="w-3.5 h-3.5 text-yellow-600" />
                        : trend < 0 ? <TrendingDown className="w-3.5 h-3.5 text-slate-500" /> : null}
                    <span className={`text-xs font-medium ${trend > 0 ? 'text-yellow-700' : trend < 0 ? 'text-slate-500' : 'text-slate-400'}`}>
                        {trend > 0 ? '+' : ''}{trend}% {trendLabel}
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full h-full bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden flex flex-col">
            {/* ==================== HEADER (BLUE) ==================== */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-blue-500 shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                        onClick={handleBackToSections}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition text-white shrink-0"
                        title="Back to Groups"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="p-1.5 bg-yellow-400 text-blue-900 rounded-lg shrink-0 shadow-sm">
                        <School className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-bold text-white truncate">My Groups</h2>
                        <p className="text-[11px] text-blue-100 truncate">
                            {section?.title || section?.name || 'Section'} • {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleCloseDashboard}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition text-blue-100 hover:text-white shrink-0"
                    title="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {selectedGroup ? (
                    // ==================== DETAIL VIEW ====================
                    <div>
                        <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm">
                            {/* Group Header */}
                            <div className="p-6 border-b border-blue-50 bg-gradient-to-r from-white to-blue-50/40">
                                <div className="flex items-start gap-3">
                                    <span className="p-2 bg-yellow-400 text-blue-900 rounded-xl shadow-sm">
                                        <Folder className="w-5 h-5" />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        {isEditing ? (
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => { setEditName(e.target.value); setError(''); }}
                                                    className="w-full max-w-md px-3 py-1 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg font-bold"
                                                    autoFocus
                                                    disabled={isSaving}
                                                />
                                                {error && <p className="text-xs text-red-600">{error}</p>}
                                            </div>
                                        ) : (
                                            <h3 className="text-xl font-bold text-slate-900">{selectedGroup.name}</h3>
                                        )}
                                        <p className="text-sm text-blue-600">
                                            Section: {section?.title || section?.name || 'N/A'} • {calculateGroupStats(selectedGroup).total} members
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isEditing && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
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
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                            ) : (
                                                <><Save className="w-4 h-4" /> Save Changes</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => { setIsEditing(false); setEditName(selectedGroup.name); setError(''); }}
                                            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-xl transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Adviser / Co-Adviser Section (YELLOW ACCENT) */}
                            <div className="p-6 border-b border-blue-50 bg-gradient-to-r from-blue-50 to-yellow-50">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                        <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">
                                            Advisers
                                        </h4>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenAdviserModal('adviser')}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition flex items-center gap-1 shadow-sm"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            Add Adviser
                                        </button>
                                        <button
                                            onClick={() => handleOpenAdviserModal('coadviser')}
                                            className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-blue-900 text-sm font-semibold rounded-lg transition flex items-center gap-1 shadow-sm"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            Add Co-Adviser
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Adviser Card */}
                                    <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <UserCog className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider">Main Adviser</p>
                                                    {selectedGroup.adviserId && selectedGroup.adviserId._id ? (
                                                        <>
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {selectedGroup.adviserId.first_name} {selectedGroup.adviserId.last_name}
                                                                {selectedGroup.adviserId.email && (
                                                                    <span className="text-xs font-normal text-slate-400 block">
                                                                        {selectedGroup.adviserId.email}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <div className="mt-1.5">
                                                                {(() => {
                                                                    const s = getAdviserStatusDisplay(selectedGroup.adviserStatus || 'approved');
                                                                    return (
                                                                        <div className="flex flex-col gap-0.5">
                                                                            {s.badge}
                                                                            {s.isApproved && <p className="text-[10px] text-yellow-700">✅ Approved</p>}
                                                                            {s.isRejected && <p className="text-[10px] text-slate-500">❌ Rejected</p>}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-slate-400">Not assigned</p>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedGroup.adviserId && selectedGroup.adviserId._id && (
                                                <button
                                                    onClick={() => handleRemoveAdviser('adviser')}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Remove Adviser"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Co-Adviser Card */}
                                    <div className="bg-white rounded-xl border border-yellow-200 p-4 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-yellow-100 rounded-lg">
                                                    <UserCircle className="w-4 h-4 text-yellow-700" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wider">Co-Adviser</p>
                                                    {selectedGroup.coadviserId && selectedGroup.coadviserId._id ? (
                                                        <>
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {selectedGroup.coadviserId.first_name} {selectedGroup.coadviserId.last_name}
                                                                {selectedGroup.coadviserId.email && (
                                                                    <span className="text-xs font-normal text-slate-400 block">
                                                                        {selectedGroup.coadviserId.email}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <div className="mt-1.5">
                                                                {(() => {
                                                                    const s = getAdviserStatusDisplay(selectedGroup.coadviserStatus || 'approved');
                                                                    return (
                                                                        <div className="flex flex-col gap-0.5">
                                                                            {s.badge}
                                                                            {s.isApproved && <p className="text-[10px] text-yellow-700">✅ Approved</p>}
                                                                            {s.isRejected && <p className="text-[10px] text-slate-500">❌ Rejected</p>}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-slate-400">Not assigned</p>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedGroup.coadviserId && selectedGroup.coadviserId._id && (
                                                <button
                                                    onClick={() => handleRemoveAdviser('coadviser')}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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

                            {/* Group Statistics (BLUE → YELLOW gradient) */}
                            <div className="p-6 bg-gradient-to-r from-blue-50 via-white to-yellow-50 border-b border-blue-50">
                                <div className="flex items-center gap-2 mb-4">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                    <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">
                                        Group Statistics & Analytics
                                    </h4>
                                    <span className="ml-auto text-xs text-slate-400">
                                        Updated: {formatDateTime(new Date().toISOString())}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <StatCard
                                        icon={Users}
                                        title="Total Members"
                                        value={calculateGroupStats(selectedGroup).total}
                                        subtitle={`${calculateGroupStats(selectedGroup).active} active`}
                                        color="bg-blue-600"
                                        trend={calculateGroupStats(selectedGroup).activityRate}
                                        trendLabel="active rate"
                                    />
                                    <StatCard
                                        icon={UserCheck}
                                        title="Active"
                                        value={calculateGroupStats(selectedGroup).active}
                                        subtitle={`${calculateGroupStats(selectedGroup).activityRate}% of total`}
                                        color="bg-yellow-500"
                                    />
                                    <StatCard
                                        icon={UserX}
                                        title="Inactive"
                                        value={calculateGroupStats(selectedGroup).inactive}
                                        subtitle={`${calculateGroupStats(selectedGroup).pending} pending`}
                                        color="bg-slate-500"
                                    />
                                    <StatCard
                                        icon={Layers}
                                        title="Roles"
                                        value={calculateGroupStats(selectedGroup).roleCount}
                                        subtitle={`${Object.keys(calculateGroupStats(selectedGroup).roles).join(', ')}`}
                                        color="bg-blue-400"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                    {/* Role Distribution */}
                                    <div className="bg-white rounded-xl border border-blue-100 p-3 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-4 h-4 text-blue-600" />
                                            <span className="text-xs text-blue-500 font-semibold uppercase tracking-wider">Role Distribution</span>
                                        </div>
                                        {Object.entries(calculateGroupStats(selectedGroup).roles).length > 0 ? (
                                            <div className="space-y-1">
                                                {Object.entries(calculateGroupStats(selectedGroup).roles).map(([role, count]) => (
                                                    <div key={role} className="flex items-center justify-between text-sm">
                                                        <span className="capitalize text-slate-600">{role}</span>
                                                        <span className="font-semibold text-slate-900">{count}</span>
                                                    </div>
                                                ))}
                                                <div className="w-full h-2 bg-blue-50 rounded-full overflow-hidden mt-1 flex">
                                                    {Object.entries(calculateGroupStats(selectedGroup).roles).map(([role, count], idx) => {
                                                        const colors = ['bg-blue-600', 'bg-yellow-400', 'bg-blue-400', 'bg-yellow-300', 'bg-blue-300'];
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
                                            <p className="text-sm text-slate-400">No roles data</p>
                                        )}
                                    </div>

                                    {/* Status Distribution */}
                                    <div className="bg-white rounded-xl border border-blue-100 p-3 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <PieChart className="w-4 h-4 text-yellow-600" />
                                            <span className="text-xs text-blue-500 font-semibold uppercase tracking-wider">Status Distribution</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-16 h-16">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-slate-700">{calculateGroupStats(selectedGroup).total}</span>
                                                </div>
                                                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                                                    {calculateGroupStats(selectedGroup).total > 0 && (
                                                        <>
                                                            <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-blue-50" strokeWidth="3.6" />
                                                            {calculateGroupStats(selectedGroup).active > 0 && (
                                                                <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-yellow-400"
                                                                    strokeWidth="3.6"
                                                                    strokeDasharray={`${(calculateGroupStats(selectedGroup).active / calculateGroupStats(selectedGroup).total) * 100} 100`}
                                                                    strokeLinecap="round" />
                                                            )}
                                                            {calculateGroupStats(selectedGroup).pending > 0 && (
                                                                <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-blue-500"
                                                                    strokeWidth="3.6"
                                                                    strokeDasharray={`${(calculateGroupStats(selectedGroup).pending / calculateGroupStats(selectedGroup).total) * 100} 100`}
                                                                    strokeLinecap="round"
                                                                    strokeDashoffset={`-${(calculateGroupStats(selectedGroup).active / calculateGroupStats(selectedGroup).total) * 100}`} />
                                                            )}
                                                            {calculateGroupStats(selectedGroup).inactive > 0 && (
                                                                <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-slate-300"
                                                                    strokeWidth="3.6"
                                                                    strokeDasharray={`${(calculateGroupStats(selectedGroup).inactive / calculateGroupStats(selectedGroup).total) * 100} 100`}
                                                                    strokeLinecap="round"
                                                                    strokeDashoffset={`-${((calculateGroupStats(selectedGroup).active + calculateGroupStats(selectedGroup).pending) / calculateGroupStats(selectedGroup).total) * 100}`} />
                                                            )}
                                                        </>
                                                    )}
                                                </svg>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1 text-slate-600">
                                                        <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Active
                                                    </span>
                                                    <span className="font-semibold text-slate-900">{calculateGroupStats(selectedGroup).active}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1 text-slate-600">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Pending
                                                    </span>
                                                    <span className="font-semibold text-slate-900">{calculateGroupStats(selectedGroup).pending}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1 text-slate-600">
                                                        <span className="w-2 h-2 rounded-full bg-slate-300"></span> Inactive
                                                    </span>
                                                    <span className="font-semibold text-slate-900">{calculateGroupStats(selectedGroup).inactive}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="bg-white rounded-xl border border-yellow-200 p-3 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap className="w-4 h-4 text-yellow-500" />
                                            <span className="text-xs text-yellow-700 font-semibold uppercase tracking-wider">Recent Activity</span>
                                        </div>
                                        {calculateGroupStats(selectedGroup).recentMembers.length > 0 ? (
                                            <div className="space-y-1.5">
                                                {calculateGroupStats(selectedGroup).recentMembers.slice(0, 3).map((member, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-600 truncate max-w-[100px]">
                                                            {member.first_name} {member.last_name}
                                                        </span>
                                                        <span className="text-slate-400">{formatDate(member.createdAt)}</span>
                                                    </div>
                                                ))}
                                                {calculateGroupStats(selectedGroup).recentMembers.length > 3 && (
                                                    <p className="text-xs text-slate-400">+{calculateGroupStats(selectedGroup).recentMembers.length - 3} more</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400">No recent activity</p>
                                        )}
                                        {calculateGroupStats(selectedGroup).oldestMember && (
                                            <div className="mt-2 pt-2 border-t border-blue-50">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-400">First member</span>
                                                    <span className="text-slate-600">
                                                        {calculateGroupStats(selectedGroup).oldestMember.first_name} {calculateGroupStats(selectedGroup).oldestMember.last_name}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                                    <div className="bg-white rounded-lg px-3 py-2 text-center border border-blue-100 shadow-sm">
                                        <p className="text-[10px] text-blue-500 uppercase tracking-wider font-semibold">Referral Code</p>
                                        <p className="font-mono font-bold text-sm text-blue-700">{selectedGroup.referralCode || 'N/A'}</p>
                                    </div>
                                    <div className="bg-white rounded-lg px-3 py-2 text-center border border-yellow-200 shadow-sm">
                                        <p className="text-[10px] text-yellow-700 uppercase tracking-wider font-semibold">Created</p>
                                        <p className="font-semibold text-sm text-slate-700">{formatDate(selectedGroup.createdAt)}</p>
                                    </div>
                                    <div className="bg-white rounded-lg px-3 py-2 text-center border border-yellow-200 shadow-sm">
                                        <p className="text-[10px] text-yellow-700 uppercase tracking-wider font-semibold">Activity Rate</p>
                                        <p className="font-semibold text-sm text-yellow-700">{calculateGroupStats(selectedGroup).activityRate}%</p>
                                    </div>
                                    <div className="bg-white rounded-lg px-3 py-2 text-center border border-blue-100 shadow-sm">
                                        <p className="text-[10px] text-blue-500 uppercase tracking-wider font-semibold">Roles</p>
                                        <p className="font-semibold text-sm text-blue-700">{calculateGroupStats(selectedGroup).roleCount}</p>
                                    </div>
                                </div>
                            </div>

                            {/* PROPOSED TITLES TABLE */}
                            <div className="p-6 border-b border-blue-50 bg-gradient-to-r from-yellow-50 to-white">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-blue-600" />
                                        <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">
                                            Proposed Titles
                                        </h4>
                                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-400 text-blue-900 rounded-full">
                                            {isProposedTitle?.length || 0}
                                        </span>
                                    </div>
                                </div>

                                {isProposedTitle && isProposedTitle.length > 0 ? (
                                    <div className="overflow-x-auto border border-blue-100 rounded-xl bg-white">
                                        <table className="w-full">
                                            <thead className="bg-blue-600 border-b border-blue-700">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">#</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Title</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Description</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Adviser</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Co-Adviser</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Selected</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Remarks</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">File</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Created</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-blue-50">
                                                {isProposedTitle.map((item, index) => (
                                                    <tr key={item._id || index} className="hover:bg-yellow-50/50 transition">
                                                        <td className="px-4 py-3 text-sm text-slate-500">{index + 1}</td>
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-slate-900">{item.title || 'Untitled'}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm text-slate-600 max-w-[220px] truncate" title={item.description}>
                                                                {item.description || '—'}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {item.adviser ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                                    <UserCog className="w-3 h-3" /> Yes
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">No</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {item.coAdviser ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                    <UserCircle className="w-3 h-3" /> Yes
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">No</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">{getProposedTitleStatusBadge(item.status)}</td>
                                                        <td className="px-4 py-3">
                                                            {item.isSelected ? (
                                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700">
                                                                    <Check className="w-4 h-4" /> Selected
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm text-slate-600 max-w-[180px] truncate" title={item.remarks}>
                                                                {item.remarks || '—'}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {item.fileUrl ? (
                                                                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline">
                                                                    <Folder className="w-3.5 h-3.5" /> View File
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">No file</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-white rounded-xl border border-blue-100">
                                        <Award className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">No proposed titles yet</p>
                                    </div>
                                )}
                            </div>

                            {/* Referral Link */}
                            {selectedGroup.referralCode && (
                                <div className="p-6 border-b border-blue-50">
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <p className="text-sm text-blue-900 font-semibold mb-2 flex items-center gap-2">
                                            <UserPlus className="w-4 h-4 text-blue-600" />
                                            Referral Link
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-slate-600 truncate">
                                                {getReferralLink(selectedGroup.referralCode)}
                                            </div>
                                            <button
                                                onClick={() => handleCopyReferralLink(selectedGroup.referralCode, selectedGroup._id)}
                                                className="p-2 bg-yellow-400 border border-yellow-500 rounded-lg hover:bg-yellow-500 transition flex-shrink-0"
                                            >
                                                {copiedCode === selectedGroup._id ? (
                                                    <Check className="w-5 h-5 text-blue-900" />
                                                ) : (
                                                    <Copy className="w-5 h-5 text-blue-900" />
                                                )}
                                            </button>
                                        </div>
                                        {copiedCode === selectedGroup._id && (
                                            <p className="text-sm text-yellow-700 mt-2 font-medium">✓ Copied to clipboard!</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Member Table */}
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-blue-600" />
                                        <h4 className="text-lg font-semibold text-slate-900">
                                            Members ({filteredMembers.length})
                                        </h4>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="relative">
                                            <Search className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Search members..."
                                                value={memberSearchTerm}
                                                onChange={(e) => setMemberSearchTerm(e.target.value)}
                                                className="pl-9 pr-4 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm w-full sm:w-48"
                                            />
                                        </div>
                                        <select
                                            value={memberFilter}
                                            onChange={(e) => setMemberFilter(e.target.value)}
                                            className="px-4 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto border border-blue-100 rounded-xl">
                                    <table className="w-full">
                                        <thead className="bg-blue-600 border-b border-blue-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Member</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Email / Username</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-blue-50 bg-white">
                                            {filteredMembers.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                                        {memberSearchTerm ? 'No members match your search' : 'No members in this group yet'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredMembers.map((member) => (
                                                    <tr key={member.id || member._id} className="hover:bg-yellow-50/40 transition">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-blue-900 font-semibold text-sm">
                                                                    {member.first_name?.[0]}{member.last_name?.[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-slate-900">
                                                                        {member.first_name} {member.middle_name || ''} {member.last_name}
                                                                        {member.suffix && ` ${member.suffix}`}
                                                                    </p>
                                                                    <p className="text-xs text-slate-400">ID: {member.id?.slice(-6) || member._id?.slice(-6) || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="text-sm text-slate-600 flex items-center gap-1">
                                                                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                                                                    {member.email}
                                                                </p>
                                                                <p className="text-xs text-slate-400">@{member.username}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                                                                {member.role || 'student'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">{getStatusBadge(member.status)}</td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm text-slate-600">{formatDateTime(member.createdAt)}</p>
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
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search groups..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-48 md:w-64 text-sm bg-white"
                                    />
                                </div>

                                <div className="flex bg-blue-50 rounded-xl p-1 border border-blue-100">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-400 hover:text-blue-600'}`}
                                    >
                                        <Grid3x3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-400 hover:text-blue-600'}`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={openCreateModal}
                                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold rounded-xl shadow-sm transition flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Create Group
                            </button>
                        </div>

                        {contextLoading || isLoadingGroupsData ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : searchedGroups.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-blue-100">
                                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-10 h-10 text-yellow-500" />
                                </div>
                                <h4 className="text-lg font-semibold text-slate-700">
                                    {searchTerm ? 'No matching groups found' : 'No groups yet'}
                                </h4>
                                <p className="text-sm text-slate-500 mt-1">
                                    {searchTerm ? 'Try adjusting your search terms' : 'Click "Create Group" to create your first group'}
                                </p>
                                {!searchTerm && (
                                    <button
                                        onClick={openCreateModal}
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
                                            className="bg-white border border-blue-100 rounded-2xl p-5 hover:border-yellow-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="p-2 bg-yellow-400 text-blue-900 rounded-lg shadow-sm">
                                                        <Folder className="w-4 h-4" />
                                                    </span>
                                                    <h5 className="font-semibold text-slate-900 truncate max-w-[150px]">
                                                        {group.name}
                                                    </h5>
                                                </div>
                                                <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                                                    #{filteredGroups.indexOf(group) + 1}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {group.adviserId && group.adviserId._id && (
                                                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                                        group.adviserStatus === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                        group.adviserStatus === 'rejected' ? 'bg-slate-100 text-slate-600' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        <UserCog className="w-3 h-3" />
                                                        {group.adviserId.first_name} {group.adviserId.last_name}
                                                        {group.adviserStatus === 'approved' && <BadgeCheck className="w-3 h-3 text-blue-700" />}
                                                        {group.adviserStatus === 'rejected' && <X className="w-3 h-3 text-slate-500" />}
                                                    </span>
                                                )}
                                                {group.coadviserId && group.coadviserId._id && (
                                                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                                        group.coadviserStatus === 'approved' ? 'bg-yellow-100 text-yellow-800' :
                                                        group.coadviserStatus === 'rejected' ? 'bg-slate-100 text-slate-600' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        <UserCircle className="w-3 h-3" />
                                                        {group.coadviserId.first_name} {group.coadviserId.last_name}
                                                        {group.coadviserStatus === 'approved' && <BadgeCheck className="w-3 h-3 text-yellow-700" />}
                                                        {group.coadviserStatus === 'rejected' && <X className="w-3 h-3 text-slate-500" />}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5 text-blue-500" />
                                                    {groupStats.total}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                    {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'N/A'}
                                                </span>
                                                <span className="flex items-center gap-1 text-yellow-700 font-medium">
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
                                                        className="flex items-center gap-2 text-xs text-blue-700 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-yellow-100 transition-colors w-full justify-center font-medium"
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
                            <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-blue-600 border-b border-blue-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Group</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Adviser</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Co-Adviser</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Members</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Active %</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Created</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Referral Link</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-blue-50">
                                        {searchedGroups.map((group) => {
                                            const groupStats = calculateGroupStats(group);
                                            return (
                                                <tr
                                                    key={group._id || group.id}
                                                    onClick={() => handleSelectGroup(group)}
                                                    className="hover:bg-yellow-50/40 transition cursor-pointer"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Folder className="w-4 h-4 text-blue-600" />
                                                            <span className="font-medium text-slate-900">{group.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {group.adviserId && group.adviserId._id ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-slate-700">
                                                                    {group.adviserId.first_name} {group.adviserId.last_name}
                                                                </span>
                                                                <span className={`text-[10px] font-medium flex items-center gap-1 ${
                                                                    group.adviserStatus === 'approved' ? 'text-blue-600' :
                                                                    group.adviserStatus === 'rejected' ? 'text-slate-500' :
                                                                    'text-slate-500'
                                                                }`}>
                                                                    {group.adviserStatus === 'approved' && <BadgeCheck className="w-3 h-3" />}
                                                                    {group.adviserStatus === 'rejected' && <X className="w-3 h-3" />}
                                                                    {group.adviserStatus === 'approved' ? '✓ Approved' :
                                                                     group.adviserStatus === 'rejected' ? '✗ Rejected' :
                                                                     group.adviserStatus || 'Approved'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">Not assigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {group.coadviserId && group.coadviserId._id ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-slate-700">
                                                                    {group.coadviserId.first_name} {group.coadviserId.last_name}
                                                                </span>
                                                                <span className={`text-[10px] font-medium flex items-center gap-1 ${
                                                                    group.coadviserStatus === 'approved' ? 'text-yellow-700' :
                                                                    group.coadviserStatus === 'rejected' ? 'text-slate-500' :
                                                                    'text-slate-500'
                                                                }`}>
                                                                    {group.coadviserStatus === 'approved' && <BadgeCheck className="w-3 h-3" />}
                                                                    {group.coadviserStatus === 'rejected' && <X className="w-3 h-3" />}
                                                                    {group.coadviserStatus === 'approved' ? '✓ Approved' :
                                                                     group.coadviserStatus === 'rejected' ? '✗ Rejected' :
                                                                     group.coadviserStatus || 'Approved'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">Not assigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="flex items-center gap-1 text-slate-600">
                                                            <User className="w-3.5 h-3.5 text-blue-500" />
                                                            {groupStats.total}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-yellow-400 rounded-full"
                                                                    style={{ width: `${groupStats.activityRate}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm text-slate-600">{groupStats.activityRate}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 text-sm">
                                                        {group.createdAt ? formatDate(group.createdAt) : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {group.referralCode && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCopyReferralLink(group.referralCode, group._id);
                                                                }}
                                                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
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

            {/* ==================== CREATE GROUP MODAL ==================== */}
            {showForm && (
                <div
                    className="fixed inset-0 z-[1000] bg-blue-950/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
                    onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto border border-blue-100">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-blue-500 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-400 text-blue-900 rounded-xl">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Create New Group</h3>
                                    <p className="text-xs text-blue-100">Add a new group to this section</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCancel}
                                disabled={isLoading}
                                className="p-2 text-blue-100 hover:text-white hover:bg-white/20 rounded-xl transition disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-blue-900 mb-1.5">
                                    Group Name *
                                </label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => { setGroupName(e.target.value); setError(''); }}
                                    placeholder="e.g. Group A - Web Development"
                                    className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition"
                                    autoFocus
                                    disabled={isLoading}
                                />
                                <p className="mt-1.5 text-[11px] text-slate-500">
                                    Give your group a clear and descriptive name.
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800 text-sm flex items-start gap-2">
                                    <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-3 border-t border-blue-100">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={isLoading}
                                    className="px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-xl transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !groupName.trim()}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-blue-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                                    ) : (
                                        <><Check className="w-4 h-4" /> Create Group</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== ADVISER MODAL ==================== */}
            {showAdviserModal && (
                <div
                    className="fixed inset-0 z-[1000] bg-blue-950/50 flex items-center justify-center animate-fadeIn"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowAdviserModal(false);
                            setAssignError('');
                            setSelectedAdviserId('');
                        }
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-blue-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <UserCog className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {adviserModalType === 'adviser' ? 'Add Adviser' : 'Add Co-Adviser'}
                                </h3>
                            </div>
                            <button
                                onClick={() => { setShowAdviserModal(false); setAssignError(''); setSelectedAdviserId(''); }}
                                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-blue-50 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-500 mb-4">
                            {adviserModalType === 'adviser'
                                ? 'Select a main adviser to assign to this group.'
                                : 'Select a co-adviser to assist the main adviser.'}
                        </p>

                        {assignError && (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800">
                                {assignError}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-blue-900 mb-1">
                                Select {adviserModalType === 'adviser' ? 'Adviser' : 'Co-Adviser'}
                            </label>
                            {advisersLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                    <span className="ml-2 text-sm text-slate-500">Loading advisers...</span>
                                </div>
                            ) : (
                                <div className="relative">
                                    <select
                                        value={selectedAdviserId}
                                        onChange={(e) => { setSelectedAdviserId(e.target.value); setAssignError(''); }}
                                        className="w-full px-4 py-2.5 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white text-slate-700"
                                    >
                                        <option value="">Select an adviser...</option>
                                        {availableUsers.length === 0 ? (
                                            <option value="" disabled>No available advisers</option>
                                        ) : (
                                            availableUsers.map((user) => (
                                                <option key={user._id} value={user._id}>
                                                    {user.first_name} {user.last_name} {user.email ? `(${user.email})` : ''}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                                </div>
                            )}
                            {availableUsers.length === 0 && !advisersLoading && (
                                <p className="text-xs text-slate-500 mt-1">No advisers available to assign</p>
                            )}
                        </div>

                        {selectedAdviserId && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider">Selected</p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {availableUsers.find(u => u._id === selectedAdviserId)?.first_name}
                                    {availableUsers.find(u => u._id === selectedAdviserId)?.last_name}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {availableUsers.find(u => u._id === selectedAdviserId)?.email}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={handleAssignAdviser}
                                disabled={isAssigning || !selectedAdviserId}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                            >
                                {isAssigning ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</>
                                ) : (
                                    <><UserPlus className="w-4 h-4" /> Assign {adviserModalType === 'adviser' ? 'Adviser' : 'Co-Adviser'}</>
                                )}
                            </button>
                            <button
                                onClick={() => { setShowAdviserModal(false); setAssignError(''); setSelectedAdviserId(''); }}
                                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-xl transition"
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