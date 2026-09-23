import React, { useState, useMemo, useContext, useEffect, useRef, useCallback } from 'react';
import {
    GraduationCap,
    Copy,
    Code,
    Moon,
    Sun,
    CheckCircle2,
    Lightbulb,
    UserPlus,
    FileSpreadsheet,
    Users,
    BookOpen,
    Server,
    PenSquare,
    Paperclip,
    ListCheck,
    Check,
    RotateCcw,
    X,
    Search,
    Eye,
    Share2,
    FileText,
    MessageSquare,
    Download,
    AlertCircle,
    QrCode,
    Clock,
    Sparkles,
    Loader2,
    UserCog,
    Mail,
    Phone,
    Calendar,
    ChevronDown,
    Hourglass,
    UserCheck,
    UserX,
    Shield,
    User,
    BadgeCheck,
    UserCircle,
    PieChart as PieChartIcon,
    TrendingUp
} from 'lucide-react';
import { ProposedTitleContext } from '../../contexts/ProposedTitleContext/ProposedTitleContext';
import { AuthContext } from '../../contexts/AuthContext';
import { GroupContext } from '../../contexts/GroupNameContext/GroupNameContext';
import { UserDisplayContext } from '../../contexts/UserManagementContext/UserManagementContext';

// Import separated components
import UserDashboardBanner from './components/UserDashboardBanner';
import ProposedTitleSection from './components/ProposedTitleSection';
import ReferredUsersList from './components/ReferredUsersList';
import ClassShareLink from './components/ClassShareLink';
import StatCards from './components/StatCards';
import FormatDetailsCard from './components/FormatDetailsCard';

// ============================
// HELPER FUNCTIONS
// ============================
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// ============================
// ADVISER STATUS DISPLAY HELPER
// ============================
const getAdviserStatusDisplay = (status, type) => {
    const statusConfigs = {
        'approved': {
            bg: 'bg-green-100 dark:bg-green-900/40',
            text: 'text-green-700 dark:text-green-400',
            icon: BadgeCheck,
            label: 'Approved ✓',
            description: 'Adviser has been approved'
        },
        'pending': {
            bg: 'bg-yellow-100 dark:bg-yellow-900/40',
            text: 'text-yellow-700 dark:text-yellow-400',
            icon: Hourglass,
            label: 'Waiting for Approval ⏳',
            description: 'Request is pending approval'
        },
        'rejected': {
            bg: 'bg-red-100 dark:bg-red-900/40',
            text: 'text-red-700 dark:text-red-400',
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

// ============================
// PIE CHART COMPONENT (Pure SVG — no external library needed)
// ============================
const PieChart = ({ data, size = 180, thickness = 40, title, subtitle }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    const radius = (size - thickness) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    let cumulativePercent = 0;

    const segments = data.map((d, i) => {
        const percent = d.value / total;
        const dashArray = `${percent * circumference} ${circumference}`;
        const dashOffset = -cumulativePercent * circumference;
        cumulativePercent += percent;

        return {
            ...d,
            percent,
            dashArray,
            dashOffset,
            key: i
        };
    });

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <PieChartIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {title || 'Proposed Titles Overview'}
                    </h3>
                    {subtitle && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{subtitle}</p>
                    )}
                </div>
            </div>

            {/* Chart + Legend */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* SVG Donut */}
                <div className="relative shrink-0" style={{ width: size, height: size }}>
                    <svg width={size} height={size} className="-rotate-90">
                        {/* Background ring */}
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={thickness}
                            className="text-slate-100 dark:text-slate-700"
                        />
                        {/* Data segments */}
                        {segments.map((seg) => (
                            <circle
                                key={seg.key}
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={thickness}
                                strokeDasharray={seg.dashArray}
                                strokeDashoffset={seg.dashOffset}
                                strokeLinecap="butt"
                                className="transition-all duration-700 ease-out"
                            />
                        ))}
                    </svg>

                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                            {total}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                            Total
                        </span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 w-full space-y-2">
                    {segments.map((seg) => (
                        <div
                            key={seg.key}
                            className="flex items-center justify-between gap-2 text-xs"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    className="w-3 h-3 rounded-sm shrink-0"
                                    style={{ backgroundColor: seg.color }}
                                />
                                <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                                    {seg.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {seg.value}
                                </span>
                                <span className="text-slate-400 text-[10px] w-10 text-right">
                                    {Math.round(seg.percent * 100)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ============================
// MAIN COMPONENT
// ============================
export default function UserDashboard() {
    const { authToken, user, referredBy } = useContext(AuthContext);
    const {
        proposedTitles,
        totalProposedTitles,
        isLoading,
        CreateProposedTitle,
        UpdateProposedTitle,
        DeleteProposedTitle,
        FetchProposedTitles,
        GetFileFromCloudinary,
        ViewFileInNewTab,
    } = useContext(ProposedTitleContext);

    // ============================================================
    // KUHAIN ANG ADVISERS MULA SA UserDisplayContext
    // ============================================================
    const { advisers, advisersLoading } = useContext(UserDisplayContext);
    const { getGroupDetails, groupDetails, referralUrl, assignAdviserAndCoAdviser } = useContext(GroupContext);

    console.log("groupDetails", groupDetails)

    // ============================
    // STATE
    // ============================
    const [darkMode, setDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [toastMessage, setToastMessage] = useState(null);
    const [showJsonModal, setShowJsonModal] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [selectedUserModal, setSelectedUserModal] = useState(null);
    const [uploading, setUploading] = useState(false);

    // ADVISER MODAL STATE
    const [showAdviserModal, setShowAdviserModal] = useState(false);
    const [adviserModalType, setAdviserModalType] = useState('adviser');
    const [selectedAdviserId, setSelectedAdviserId] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignError, setAssignError] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);

    // Remarks Modal State
    const [remarksModal, setRemarksModal] = useState({
        open: false,
        titleId: null,
        targetStatus: '',
        currentRemarks: ''
    });

    // Form State
    const [formState, setFormState] = useState({
        title: '',
        description: '',
        remarks: '',
        file: null
    });

    // File View Modal State
    const [fileViewModal, setFileViewModal] = useState({
        open: false,
        url: '',
        title: '',
        fileName: ''
    });

    // ============================
    // REFS
    // ============================
    const isFetching = useRef(false);

    // ============================
    // EFFECTS
    // ============================
    useEffect(() => {
        if (authToken) {
            FetchProposedTitles(1, 10);
        }
    }, [authToken]);

    useEffect(() => {
        if (isFetching.current) return;

        if (referredBy) {
            isFetching.current = true;
            getGroupDetails(referredBy).finally(() => {
                isFetching.current = false;
            });
        }
    }, [referredBy]);

    useEffect(() => {
        if (groupDetails && groupDetails.group) {
            setSelectedGroup(groupDetails.group);
            console.log("✅ Group set in state:", groupDetails.group);
        }
    }, [groupDetails]);

    // ============================
    // MEMOIZED VALUES
    // ============================
    const approvedTitle = useMemo(() => {
        return proposedTitles.find(t => t.status === 'Approved') || null;
    }, [proposedTitles]);

    const displayData = useMemo(() => {
        if (groupDetails && groupDetails.group) {
            return {
                group: groupDetails.group,
                referredUsers: groupDetails.referredUsers || [],
                userCount: groupDetails.userCount || 0,
                status: groupDetails.status || "success"
            };
        }
        return {
            group: {
                _id: "",
                name: "Loading...",
                referralCode: "N/A",
                section: {
                    name: "N/A",
                    subject: {
                        title: "N/A",
                        createdBy: "N/A"
                    }
                },
                memberCount: 0,
                members: [],
                createdAt: "",
                updatedAt: ""
            },
            referredUsers: [],
            userCount: 0,
            status: "loading"
        };
    }, [groupDetails]);

    // ============================
    // PIE CHART DATA (Dynamic from proposedTitles)
    // ============================
    const pieChartData = useMemo(() => {
        const counts = {
            Approved: 0,
            Pending: 0,
            Revision: 0,
            Rejected: 0,
            Draft: 0
        };

        proposedTitles?.forEach(t => {
            const status = t.status || 'Pending';
            if (counts[status] !== undefined) {
                counts[status]++;
            } else {
                counts.Pending++;
            }
        });

        // If no titles yet, show sample placeholder data
        const hasData = Object.values(counts).some(v => v > 0);

        if (!hasData) {
            return [
                { label: 'Approved', value: 3, color: '#10b981' },
                { label: 'Pending', value: 5, color: '#f59e0b' },
                { label: 'Revision', value: 2, color: '#3b82f6' },
                { label: 'Rejected', value: 1, color: '#ef4444' }
            ];
        }

        return [
            { label: 'Approved', value: counts.Approved, color: '#10b981' },
            { label: 'Pending', value: counts.Pending, color: '#f59e0b' },
            { label: 'Revision', value: counts.Revision, color: '#3b82f6' },
            { label: 'Rejected', value: counts.Rejected, color: '#ef4444' }
        ].filter(d => d.value > 0);
    }, [proposedTitles]);

    // ============================
    // RESOLVE FORMAT DETAILS (with fallback)
    // ============================
    const resolvedFormatDetails = useMemo(() => {
        const fromSection = displayData?.group?.section?.formatDetails;
        const fromGroup = displayData?.group?.formatDetails;
        const resolved = fromSection || fromGroup || null;
        console.log("🎨 [FormatDetails] fromSection:", fromSection);
        console.log("🎨 [FormatDetails] fromGroup:", fromGroup);
        console.log("🎨 [FormatDetails] resolved:", resolved);
        return resolved;
    }, [displayData]);

    const filteredUsers = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return displayData.referredUsers;
        return displayData.referredUsers.filter(u => {
            const full = `${u.first_name || ''} ${u.middle_name || ''} ${u.last_name || ''}`.toLowerCase();
            const email = u.email || u.username || '';
            return full.includes(q) || email.toLowerCase().includes(q);
        });
    }, [displayData.referredUsers, searchQuery]);

    // ============================
    // GET ADVISER FROM GROUP
    // ============================
    const getAdviserFromGroup = useCallback(() => {
        const currentGroup = selectedGroup || displayData.group;

        console.log("🔍 Finding adviser in group:", currentGroup);
        console.log("🔍 AdviserId in group:", currentGroup.adviserId);
        console.log("🔍 CoAdviserId in group:", currentGroup.coadviserId);
        console.log("🔍 All advisers from UserDisplayContext:", advisers);

        let adviser = null;
        let coadviser = null;

        if (currentGroup.adviserId) {
            const adviserId = currentGroup.adviserId._id || currentGroup.adviserId;
            adviser = advisers?.find(a => a._id === adviserId) || null;

            if (!adviser && currentGroup.adviserId._id) {
                adviser = currentGroup.adviserId;
            }
            console.log("✅ Found Adviser:", adviser);
        }

        if (currentGroup.coadviserId) {
            const coadviserId = currentGroup.coadviserId._id || currentGroup.coadviserId;
            coadviser = advisers?.find(a => a._id === coadviserId) || null;

            if (!coadviser && currentGroup.coadviserId._id) {
                coadviser = currentGroup.coadviserId;
            }
            console.log("✅ Found Co-Adviser:", coadviser);
        }

        return { adviser, coadviser };
    }, [selectedGroup, displayData.group, advisers]);

    // ============================
    // GET ADVISER DISPLAY FORMAT
    // ============================
    const getCurrentAdviserDisplay = useCallback(() => {
        const { adviser, coadviser } = getAdviserFromGroup();
        const currentGroup = selectedGroup || displayData.group;

        console.log("🎯 Adviser from group:", adviser);
        console.log("🎯 Co-Adviser from group:", coadviser);

        let adviserDisplay = { exists: false };
        let coadviserDisplay = { exists: false };

        if (adviser) {
            adviserDisplay = {
                exists: true,
                name: `${adviser.first_name || ''} ${adviser.last_name || ''}`.trim() || 'Unknown Adviser',
                username: adviser.username,
                role: adviser.role,
                status: currentGroup?.adviserStatus || 'pending',
                id: adviser._id,
                email: adviser.username || adviser.email,
                _id: adviser._id,
                first_name: adviser.first_name,
                last_name: adviser.last_name,
                adviserStatus: currentGroup?.adviserStatus || 'pending'
            };
            console.log("✅ Adviser Display Ready:", adviserDisplay);
        }

        if (coadviser) {
            coadviserDisplay = {
                exists: true,
                name: `${coadviser.first_name || ''} ${coadviser.last_name || ''}`.trim() || 'Unknown Co-Adviser',
                username: coadviser.username,
                role: coadviser.role,
                status: currentGroup?.coadviserStatus || 'pending',
                id: coadviser._id,
                email: coadviser.username || coadviser.email,
                _id: coadviser._id,
                first_name: coadviser.first_name,
                last_name: coadviser.last_name,
                coadviserStatus: currentGroup?.coadviserStatus || 'pending'
            };
            console.log("✅ Co-Adviser Display Ready:", coadviserDisplay);
        }

        console.log("📊 Final Display - Adviser:", adviserDisplay);
        console.log("📊 Final Display - Co-Adviser:", coadviserDisplay);

        return { adviserDisplay, coadviserDisplay };
    }, [getAdviserFromGroup, selectedGroup, displayData.group]);

    // ============================
    // UTILITY FUNCTIONS
    // ============================
    const triggerToast = (msg, type = 'success') => {
        setToastMessage({ msg, type });
        setTimeout(() => {
            setToastMessage(null);
        }, 2800);
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        triggerToast(label || 'Copied to clipboard!');
    };

    const getUserNameById = (userId) => {
        const user = displayData.referredUsers.find(u => u.id === userId || u._id === userId);
        if (user) return `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return `User (${userId ? userId.substring(0, 8) : 'Unknown'})`;
    };

    const getFileNameFromUrl = (url) => {
        try {
            const parts = url.split('/');
            const lastPart = parts[parts.length - 1];
            const fileName = lastPart.split('?')[0] || 'document.pdf';
            return decodeURIComponent(fileName);
        } catch (e) {
            return 'document.pdf';
        }
    };

    // ============================
    // RESET FORM
    // ============================
    const handleResetForm = () => {
        setFormState({
            title: '',
            description: '',
            remarks: '',
            file: null
        });
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
    };

    // ============================
    // HANDLE VIEW USER
    // ============================
    const handleViewUser = (user) => {
        setSelectedUserModal(user);
    };

    // ============================
    // ADVISER MODAL FUNCTIONS
    // ============================
    const handleOpenAdviserModal = (type) => {
        setAdviserModalType(type);
        setShowAdviserModal(true);
        setSelectedAdviserId('');
        setAssignError('');

        const currentGroup = selectedGroup || displayData.group;
        setSelectedGroup(currentGroup);

        console.log('📋 Advisers from UserDisplayContext:', advisers);
        console.log('📋 Current group:', currentGroup);

        if (advisers && advisers.length > 0) {
            const available = advisers.filter(user => {
                const isCurrentAdviser = currentGroup.adviserId?._id === user._id ||
                    currentGroup.adviserId === user._id;
                const isCurrentCoAdviser = currentGroup.coadviserId?._id === user._id ||
                    currentGroup.coadviserId === user._id;

                if (type === 'adviser') {
                    return !isCurrentAdviser && !isCurrentCoAdviser;
                } else {
                    return !isCurrentCoAdviser && !isCurrentAdviser;
                }
            });

            console.log('📋 Available for assignment:', available);
            setAvailableUsers(available);

            if (available.length === 0) {
                setAssignError(`No available ${type === 'adviser' ? 'advisers' : 'co-advisers'} to assign`);
            }
        } else {
            setAvailableUsers([]);
            if (!advisersLoading) {
                setAssignError('No advisers or panelists available');
            }
        }
    };

    const handleCloseAdviserModal = () => {
        setShowAdviserModal(false);
        setAssignError('');
        setSelectedAdviserId('');
        setIsAssigning(false);
    };

    const handleAssignAdviser = async () => {
        if (!selectedAdviserId) {
            setAssignError('Please select an adviser');
            return;
        }

        setIsAssigning(true);
        setAssignError('');

        try {
            const currentGroup = selectedGroup || displayData.group;
            const selectedUser = availableUsers.find(u => u._id === selectedAdviserId);

            let adviserId = currentGroup.adviserId?._id || currentGroup.adviserId || null;
            let coadviserId = currentGroup.coadviserId?._id || currentGroup.coadviserId || null;

            if (adviserModalType === 'adviser') {
                adviserId = selectedAdviserId;
            } else {
                coadviserId = selectedAdviserId;
            }

            const result = await assignAdviserAndCoAdviser(
                currentGroup._id,
                adviserId,
                coadviserId
            );

            if (result.success) {
                const updatedGroup = {
                    ...currentGroup,
                    adviserId: adviserModalType === 'adviser'
                        ? selectedUser || { _id: selectedAdviserId, first_name: 'Loading...', last_name: '' }
                        : currentGroup.adviserId,
                    coadviserId: adviserModalType === 'coadviser'
                        ? selectedUser || { _id: selectedAdviserId, first_name: 'Loading...', last_name: '' }
                        : currentGroup.coadviserId,
                    adviserStatus: adviserModalType === 'adviser' ? 'pending' : currentGroup.adviserStatus,
                    coadviserStatus: adviserModalType === 'coadviser' ? 'pending' : currentGroup.coadviserStatus
                };

                setSelectedGroup(updatedGroup);
                triggerToast(`Successfully assigned ${adviserModalType === 'adviser' ? 'Adviser' : 'Co-Adviser'}!`);
                handleCloseAdviserModal();

                if (referredBy) {
                    await getGroupDetails(referredBy);
                }
            } else {
                setAssignError(result.message || result.error || 'Failed to assign adviser');
            }
        } catch (error) {
            setAssignError(error.message || 'Failed to assign adviser');
            console.error('❌ Error assigning adviser:', error);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleRemoveAdviser = async (type) => {
        const currentGroup = selectedGroup || displayData.group;

        if (!currentGroup) {
            triggerToast('No group selected', 'error');
            return;
        }

        const confirmMessage = type === 'adviser'
            ? 'Are you sure you want to remove the Adviser?'
            : 'Are you sure you want to remove the Co-Adviser?';

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            let adviserId = currentGroup.adviserId?._id || currentGroup.adviserId || null;
            let coadviserId = currentGroup.coadviserId?._id || currentGroup.coadviserId || null;

            if (type === 'adviser') {
                adviserId = null;
            } else {
                coadviserId = null;
            }

            const result = await assignAdviserAndCoAdviser(
                currentGroup._id,
                adviserId,
                coadviserId
            );

            if (result.success) {
                const updatedGroup = {
                    ...currentGroup,
                    adviserId: adviserId ? currentGroup.adviserId : null,
                    coadviserId: coadviserId ? currentGroup.coadviserId : null,
                    adviserStatus: type === 'adviser' ? null : currentGroup.adviserStatus,
                    coadviserStatus: type === 'coadviser' ? null : currentGroup.coadviserStatus
                };
                setSelectedGroup(updatedGroup);
                triggerToast(`Successfully removed ${type === 'adviser' ? 'Adviser' : 'Co-Adviser'}`);

                if (referredBy) {
                    await getGroupDetails(referredBy);
                }
            } else {
                setAssignError(result.message || result.error || 'Failed to remove adviser');
            }
        } catch (error) {
            setAssignError(error.message || 'Failed to remove adviser');
            console.error('❌ Error removing adviser:', error);
        }
    };

    // ============================
    // RENDER ADVISER STATUS BADGE
    // ============================
    const renderAdviserStatusBadge = (status, type) => {
        const statusDisplay = getAdviserStatusDisplay(status, type);
        return (
            <div className="flex flex-col gap-0.5">
                {statusDisplay.badge}
                {statusDisplay.isPending && (
                    <p className="text-[10px] text-yellow-600 dark:text-yellow-400">
                        ⚠️ This request is waiting for approval from the approver
                    </p>
                )}
                {statusDisplay.isApproved && (
                    <p className="text-[10px] text-green-600 dark:text-green-400">
                        ✅ {type === 'adviser' ? 'Adviser' : 'Co-adviser'} has been approved and can now manage the group
                    </p>
                )}
                {statusDisplay.isRejected && (
                    <p className="text-[10px] text-red-600 dark:text-red-400">
                        ❌ Request has been rejected. Please contact the approver.
                    </p>
                )}
            </div>
        );
    };

    // ============================
    // HANDLE FORM SUBMIT
    // ============================
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!formState.title.trim()) {
            triggerToast('Please enter a project title!', 'error');
            return;
        }

        if (!formState.file) {
            triggerToast('Please select a document file to upload!', 'error');
            return;
        }

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append('title', formState.title.trim());
            formData.append('description', formState.description.trim());
            formData.append('remarks', formState.remarks.trim() || 'Awaiting review.');
            formData.append('groupId', displayData.group._id);
            formData.append('file', formState.file);

            const result = await CreateProposedTitle(formData);

            if (result.success) {
                triggerToast('Proposed title uploaded successfully!');
                handleResetForm();
                await FetchProposedTitles(1, 10);
            } else {
                triggerToast(result.error || 'Failed to upload proposed title', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            triggerToast('An error occurred during upload', 'error');
        } finally {
            setUploading(false);
        }
    };


    // ============================
    // HANDLE REVISION SUBMIT
    // ============================
    const handleRevisionSubmit = async (revisionData) => {
        // revisionData = { titleId, title, remarks, file }
        try {
            setUploading(true);

            const formData = new FormData();
            formData.append('titleId', revisionData.titleId);
            formData.append('action', 'revision');
            formData.append('title', revisionData.title);
            formData.append('remarks', revisionData.remarks?.trim() || 'Revision submitted.');
            formData.append('file', revisionData.file);

            const result = await CreateProposedTitle(formData);

            if (result.success) {
                triggerToast('Revision capstone uploaded successfully!');
                await FetchProposedTitles(1, 10);
                return { success: true };
            } else {
                triggerToast(result.error || 'Failed to upload revision', 'error');
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Revision upload error:', error);
            triggerToast('An error occurred during revision upload', 'error');
            return { success: false, error: error.message };
        } finally {
            setUploading(false);
        }
    };

    // ============================
    // HANDLE STATUS UPDATE
    // ============================
    const updateTitleStatus = (titleId, newStatus) => {
        if (newStatus === 'Revision' || newStatus === 'Rejected') {
            const existing = proposedTitles.find(t => t._id === titleId);
            setRemarksModal({
                open: true,
                titleId,
                targetStatus: newStatus,
                currentRemarks: existing?.remarks || ''
            });
            return;
        }

        applyStatusUpdate(titleId, newStatus, null);
    };

    const applyStatusUpdate = async (titleId, newStatus, customRemarks) => {
        try {
            const updateData = {
                status: newStatus,
                ...(customRemarks !== null && { remarks: customRemarks })
            };

            const result = await UpdateProposedTitle(titleId, updateData);

            if (result.success) {
                triggerToast(`Title status updated to: ${newStatus}`);
                await FetchProposedTitles(1, 10);
            } else {
                triggerToast(result.error || 'Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Update error:', error);
            triggerToast('An error occurred', 'error');
        }
    };

    const saveRemarksAndStatus = () => {
        applyStatusUpdate(remarksModal.titleId, remarksModal.targetStatus, remarksModal.currentRemarks.trim());
        setRemarksModal({ open: false, titleId: null, targetStatus: '', currentRemarks: '' });
    };

    // ============================
    // HANDLE DELETE
    // ============================
    const handleDelete = async (titleId) => {
        if (!window.confirm('Are you sure you want to delete this proposed title?')) return;

        try {
            const result = await DeleteProposedTitle(titleId);
            if (result.success) {
                triggerToast('Proposed title deleted successfully');
                await FetchProposedTitles(1, 10);
            } else {
                triggerToast(result.error || 'Failed to delete', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            triggerToast('An error occurred', 'error');
        }
    };

    const handleViewFile = async (id) => {
        try {
            const title = proposedTitles.find(t => t._id === id);
            if (!title || !title.fileUrl) {
                triggerToast('File not found', 'error');
                return;
            }
            window.open(title.fileUrl, '_blank');
            triggerToast('Opening file...');
        } catch (error) {
            console.error('Error:', error);
            triggerToast('Failed to open file', 'error');
        }
    };

    const handleDownloadFile = async (id) => {
        try {
            const title = proposedTitles.find(t => t._id === id);
            if (!title) {
                triggerToast('Title not found', 'error');
                return;
            }

            if (title.fileUrl) {
                let fileUrl = title.fileUrl;
                if (fileUrl.includes('/image/upload/')) {
                    fileUrl = fileUrl.replace('/image/upload/', '/raw/upload/');
                }
                if (fileUrl.includes('/upload/')) {
                    fileUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
                }

                let filename = getFileNameFromUrl(title.fileUrl);
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                triggerToast(`Downloading: ${filename}`);
                return;
            }

            const result = await GetFileFromCloudinary(id);
            if (!result.success) {
                triggerToast(result.error || 'Failed to download file', 'error');
            } else {
                triggerToast('File downloaded successfully!');
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            triggerToast('Failed to download file', 'error');
        }
    };

    // ============================
    // FORMAT FILE HANDLERS
    // ============================
    const handleViewFormatFile = (url, title, fileName) => {
        if (!url) {
            triggerToast('File not found', 'error');
            return;
        }
        setFileViewModal({
            open: true,
            url: url,
            title: title || 'Format Document',
            fileName: fileName || 'document.pdf'
        });
    };

    const handleDownloadFormatFile = (url) => {
        if (!url) {
            triggerToast('File not found', 'error');
            return;
        }

        try {
            let fileUrl = url;
            if (fileUrl.includes('/image/upload/')) {
                fileUrl = fileUrl.replace('/image/upload/', '/raw/upload/');
            }
            if (fileUrl.includes('/upload/')) {
                fileUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
            }

            const filename = getFileNameFromUrl(url);
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            triggerToast(`Downloading: ${filename}`);
        } catch (error) {
            console.error('Error downloading format file:', error);
            triggerToast('Failed to download file', 'error');
        }
    };


    // ============================
    // RENDER - GET ADVISER DISPLAY
    // ============================
    const { adviserDisplay, coadviserDisplay } = getCurrentAdviserDisplay();

    console.log("🖥️ RENDER - Adviser Display:", adviserDisplay);
    console.log("🖥️ RENDER - Co-Adviser Display:", coadviserDisplay);

    // ============================
    // HANDLE COPY REFERRAL CODE
    // ============================
    const handleCopyReferralCode = () => {
        copyToClipboard(displayData.group.referralCode, 'Referral Code copied!');
    };

    return (
        <div className={`min-h-screen font-sans ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors duration-200`}>
            {/* TOAST NOTIFICATION */}
            {toastMessage && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl transition-all duration-300 ${toastMessage.type === 'error'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    }`}>
                    {toastMessage.type === 'error' ? (
                        <AlertCircle className="w-4 h-4" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                    )}
                    <span>{toastMessage.msg}</span>
                </div>
            )}

            {/* ADVISER MODAL */}
            {showAdviserModal && (
                <div
                    className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center animate-fadeIn"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            handleCloseAdviserModal();
                        }
                    }}
                >
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                                    <UserCog className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {adviserModalType === 'adviser' ? 'Assign Adviser' : 'Assign Co-Adviser'}
                                </h3>
                            </div>
                            <button
                                onClick={handleCloseAdviserModal}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {adviserModalType === 'adviser'
                                ? 'Select a main adviser to assign to this group. The request will need approval.'
                                : 'Select a co-adviser to assist the main adviser. The request will need approval.'}
                        </p>

                        {/* Current advisers display */}
                        <div className="mb-4 space-y-2">
                            {adviserDisplay.exists && (
                                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                                            <UserCog className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Main Adviser</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {adviserDisplay.name}
                                            </p>
                                            <div className="mt-1">
                                                {renderAdviserStatusBadge(adviserDisplay.status, 'adviser')}
                                            </div>
                                        </div>
                                    </div>
                                    {adviserDisplay.status !== 'pending' && (
                                        <button
                                            onClick={() => handleRemoveAdviser('adviser')}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                            title="Remove Adviser"
                                        >
                                            <UserX className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {coadviserDisplay.exists && (
                                <div className="flex items-center justify-between p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-pink-100 dark:bg-pink-900/40 rounded-lg">
                                            <UserCircle className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Co-Adviser</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {coadviserDisplay.name}
                                            </p>
                                            <div className="mt-1">
                                                {renderAdviserStatusBadge(coadviserDisplay.status, 'coadviser')}
                                            </div>
                                        </div>
                                    </div>
                                    {coadviserDisplay.status !== 'pending' && (
                                        <button
                                            onClick={() => handleRemoveAdviser('coadviser')}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                            title="Remove Co-Adviser"
                                        >
                                            <UserX className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {assignError && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                                {assignError}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300"
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
                                                        {user.first_name} {user.last_name}
                                                        {user.username ? ` (${user.username})` : ''}
                                                        {user.role ? ` - ${user.role}` : ''}
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
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    No advisers or panelists available to assign
                                </p>
                            )}
                        </div>

                        {selectedAdviserId && (
                            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Selected</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {availableUsers.find(u => u._id === selectedAdviserId)?.first_name}
                                    {availableUsers.find(u => u._id === selectedAdviserId)?.last_name}
                                    {availableUsers.find(u => u._id === selectedAdviserId)?.role &&
                                        ` (${availableUsers.find(u => u._id === selectedAdviserId)?.role})`
                                    }
                                </p>
                                <p className="text-xs text-gray-400">
                                    {availableUsers.find(u => u._id === selectedAdviserId)?.username}
                                </p>
                            </div>
                        )}

                        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                                <Hourglass className="w-4 h-4" />
                                <span>Once assigned, this request will need approval before it becomes active.</span>
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
                                onClick={handleCloseAdviserModal}
                                className="px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT */}
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* BANNER */}
                <UserDashboardBanner
                    displayData={displayData}
                    adviserDisplay={adviserDisplay}
                    coadviserDisplay={coadviserDisplay}
                    onAssignAdviser={() => handleOpenAdviserModal('adviser')}
                    onAssignCoAdviser={() => handleOpenAdviserModal('coadviser')}
                    onProposeTitle={() =>
                        document
                            .getElementById('proposed-title-section')
                            ?.scrollIntoView({
                                behavior: 'smooth'
                            })
                    }
                    advisers={advisers}
                    advisersLoading={advisersLoading}
                />

                {/* STAT CARDS (FULL WIDTH) */}
                <StatCards
                    userCount={displayData.userCount}
                    referralCode={displayData.group.referralCode}
                    sectionName={displayData.group.section?.name || 'N/A'}
                    subjectTitle={displayData.group.section?.subject?.title || 'N/A'}
                    status={displayData.status}
                    updatedAt={formatDate(displayData.group.updatedAt)}
                    onCopyReferralCode={handleCopyReferralCode}
                    onViewQR={() => setShowQrModal(true)}
                />

                {/* ============================================
                    LEFT: PIE CHART + FORMAT DETAILS + CLASS SHARE LINK (stacked)
                    RIGHT: PROPOSED TITLE SECTION (wider)
                   ============================================ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* LEFT COLUMN (1/3 width) — Pie Chart + Format Details + Class Share Link */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* 🥧 SAMPLE PIE CHART — nasa TAAS ng Format Details */}
                        <PieChart
                            data={pieChartData}
                            size={180}
                            thickness={40}
                            title="Proposed Titles Overview"
                            subtitle="Status distribution ng iyong titles"
                        />

                        <FormatDetailsCard
                            formatDetails={displayData.group.section.subject.formatDetails}
                            onViewFile={handleViewFormatFile}
                            onDownloadFile={handleDownloadFormatFile}
                        />

                        <ClassShareLink
                            referralUrl={referralUrl}
                            referralCode={displayData.group.referralCode}
                            onCopy={copyToClipboard}
                        />
                    </div>

                    {/* RIGHT COLUMN (2/3 width - MAS MALAPAD) — Proposed Title Section */}
                    <div id="proposed-title-section" className="lg:col-span-2">
                        <ProposedTitleSection
                            proposedTitles={proposedTitles}
                            totalProposedTitles={totalProposedTitles}
                            isLoading={isLoading}
                            handleRevisionSubmit={handleRevisionSubmit}
                            approvedTitle={approvedTitle}
                            formState={formState}
                            setFormState={setFormState}
                            uploading={uploading}
                            handleFormSubmit={handleFormSubmit}
                            handleResetForm={handleResetForm}
                            updateTitleStatus={updateTitleStatus}
                            handleDelete={handleDelete}
                            handleViewFile={handleViewFile}
                            handleDownloadFile={handleDownloadFile}
                            getUserNameById={getUserNameById}
                            formatDate={formatDate}
                        />
                    </div>
                </div>

                {/* REFERRED USERS (FULL WIDTH) */}
                <ReferredUsersList
                    displayData={displayData}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filteredUsers={filteredUsers}
                    formatDate={formatDate}
                    onViewUser={handleViewUser}
                />

            </main>

            {/* FOOTER */}
            <footer className="mt-auto bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-4 transition-colors">
                <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    Academic Group & Referral Management Dashboard &bull; Code: <strong className="text-blue-600">{displayData.group.referralCode}</strong>
                </div>
            </footer>

            {/* MODALS */}
            {/* RAW JSON MODAL */}
            {showJsonModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-2">
                                <Code className="w-5 h-5 text-blue-500" />
                                <h3 className="font-bold text-slate-900 dark:text-white">Raw JSON Response Inspector</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copyToClipboard(JSON.stringify(displayData, null, 2), 'Full JSON copied!')}
                                    className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Copy All JSON
                                </button>
                                <button onClick={() => setShowJsonModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 bg-slate-900 text-emerald-400 font-mono text-xs">
                            <pre>{JSON.stringify(displayData, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            )}

            {/* QR CODE MODAL */}
            {showQrModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
                        <h3 className="font-bold text-slate-900 dark:text-white">Referral Code QR</h3>
                        <p className="text-xs text-slate-500">Scan to join section <strong>{displayData.group.section?.name || 'N/A'}</strong></p>
                        <div className="flex justify-center py-2">
                            <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-inner">
                                <QrCode className="w-40 h-40 text-blue-900" />
                            </div>
                        </div>
                        <button
                            onClick={() => setShowQrModal(false)}
                            className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* STUDENT DETAIL MODAL */}
            {selectedUserModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg">
                                    {selectedUserModal.first_name?.[0] || '?'}{selectedUserModal.last_name?.[0] || '?'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                        {`${selectedUserModal.first_name || ''} ${selectedUserModal.middle_name ? selectedUserModal.middle_name + ' ' : ''}${selectedUserModal.last_name || ''} ${selectedUserModal.suffix || ''}`.trim() || 'Unnamed User'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUserModal.email || selectedUserModal.username || 'No email'}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUserModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                                <span className="text-slate-500">User ID:</span>
                                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedUserModal.id || selectedUserModal._id}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                                <span className="text-slate-500">Role:</span>
                                <span className="font-semibold text-blue-600 uppercase">{selectedUserModal.role || 'student'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                                <span className="text-slate-500">Status:</span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{selectedUserModal.status || 'Active'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                                <span className="text-slate-500">Referred By Code:</span>
                                <span className="font-mono font-bold text-indigo-600">{selectedUserModal.referredBy || displayData.group.referralCode}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-500">Registration Date:</span>
                                <span className="text-slate-700 dark:text-slate-300">{formatDate(selectedUserModal.createdAt)}</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => setSelectedUserModal(null)}
                                className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REMARKS MODAL */}
            {remarksModal.open && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                Enter Remarks for: <span className="text-amber-500">{remarksModal.targetStatus}</span>
                            </h3>
                            <button
                                onClick={() => setRemarksModal({ open: false, titleId: null, targetStatus: '', currentRemarks: '' })}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <textarea
                            rows="3"
                            value={remarksModal.currentRemarks}
                            onChange={(e) => setRemarksModal({ ...remarksModal, currentRemarks: e.target.value })}
                            placeholder="e.g. Please clarify methodology section and refine objectives..."
                            className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setRemarksModal({ open: false, titleId: null, targetStatus: '', currentRemarks: '' })}
                                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveRemarksAndStatus}
                                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow transition"
                            >
                                Save & Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FILE VIEW MODAL */}
            {fileViewModal.open && (
                <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                                <h3 className="font-bold text-slate-900 dark:text-white truncate" title={fileViewModal.title}>
                                    {fileViewModal.title || 'File Viewer'}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => {
                                        if (fileViewModal.url) {
                                            const link = document.createElement('a');
                                            link.href = fileViewModal.url;
                                            link.download = fileViewModal.fileName || 'document.pdf';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            triggerToast('Download started!');
                                        }
                                    }}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download
                                </button>
                                <button
                                    onClick={() => setFileViewModal({ open: false, url: '', title: '', fileName: '' })}
                                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition text-slate-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-2 bg-slate-100 dark:bg-slate-900/50 min-h-[500px]">
                            {fileViewModal.url && fileViewModal.url.endsWith('.pdf') ? (
                                <iframe
                                    src={fileViewModal.url}
                                    className="w-full h-[600px] rounded-lg bg-white"
                                    title="PDF Viewer"
                                />
                            ) : fileViewModal.url && fileViewModal.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/) ? (
                                <img
                                    src={fileViewModal.url}
                                    alt={fileViewModal.title || 'File preview'}
                                    className="w-full h-auto max-h-[600px] object-contain bg-white rounded-lg"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-lg">
                                    <FileText className="w-20 h-20 text-slate-300 mb-4" />
                                    <p className="text-slate-600 dark:text-slate-300 font-medium">Preview not available</p>
                                    <p className="text-xs text-slate-400 mt-1">Click Download to save the file</p>
                                    <button
                                        onClick={() => {
                                            if (fileViewModal.url) {
                                                window.open(fileViewModal.url, '_blank');
                                            }
                                        }}
                                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
                                    >
                                        Open in New Tab
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}