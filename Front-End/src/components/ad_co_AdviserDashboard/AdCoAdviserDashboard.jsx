import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
    Users,
    FileText,
    CheckCircle2,
    Clock,
    Layers,
    UserCheck,
    Search,
    ExternalLink,
    Loader2,
    ChevronLeft,
    ChevronRight,
    X,
    UserCog,
    Check,
    XCircle,
    BarChart3,
    PieChart as PieChartIcon,
    TrendingUp,
} from 'lucide-react';

import { AuthContext } from '../../contexts/AuthContext';
import { StatisticalContext } from '../../contexts/StatisticalContext/StatisticalContext';
import { GroupContext } from '../../contexts/GroupNameContext/GroupNameContext';
import UserDashboardBanner from '../UserDashboard/components/UserDashboardBanner';

/* ============================================================
   THEME — BLUE · WHITE · YELLOW
   ============================================================ */

const PAGE_BG = 'bg-gradient-to-b from-blue-100 via-blue-50 to-sky-50';
const CARD = 'bg-white rounded-2xl shadow-md shadow-blue-900/10 border border-blue-200';

/* ============================
   SKELETON LOADING COMPONENTS
   ============================ */

const SkeletonPulse = ({ className = '' }) => (
    <div className={`animate-pulse bg-blue-200/70 rounded ${className}`} />
);

const StatCardSkeleton = () => (
    <div className={`${CARD} border-t-4 border-t-yellow-300 p-5 flex flex-col justify-between`}>
        <div className="flex items-center justify-between mb-2">
            <SkeletonPulse className="h-3 w-16" />
            <SkeletonPulse className="h-7 w-7 rounded-lg" />
        </div>
        <div>
            <SkeletonPulse className="h-7 w-12 mb-2" />
            <SkeletonPulse className="h-3 w-20" />
        </div>
    </div>
);

const ChartSkeleton = () => (
    <div className={`${CARD} p-6 flex flex-col justify-between`}>
        <div className="flex items-center gap-2 mb-4">
            <SkeletonPulse className="h-5 w-5 rounded-md" />
            <SkeletonPulse className="h-5 w-36" />
        </div>
        <div className="flex items-center justify-center h-48">
            <SkeletonPulse className="h-40 w-40 rounded-full" />
        </div>
    </div>
);

const TableRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="py-4 px-6">
            <div className="flex items-center gap-2">
                <SkeletonPulse className="h-8 w-8 rounded-lg" />
                <SkeletonPulse className="h-4 w-28" />
            </div>
        </td>
        <td className="py-4 px-6"><SkeletonPulse className="h-6 w-20 rounded-lg" /></td>
        <td className="py-4 px-6"><SkeletonPulse className="h-4 w-20" /></td>
        <td className="py-4 px-6"><SkeletonPulse className="h-6 w-16 rounded-md" /></td>
        <td className="py-4 px-6">
            <div className="flex gap-2">
                <SkeletonPulse className="h-6 w-24 rounded-lg" />
                <SkeletonPulse className="h-6 w-20 rounded-lg" />
            </div>
        </td>
        <td className="py-4 px-6 text-right"><SkeletonPulse className="h-7 w-16 rounded-xl ml-auto" /></td>
    </tr>
);

const HeaderSkeleton = () => (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-blue-900 p-6 rounded-2xl shadow-md border-b-4 border-yellow-400">
        <div className="space-y-3 w-full">
            <div className="flex items-center gap-2">
                <div className="h-6 w-24 rounded-full bg-yellow-300/70 animate-pulse" />
                <div className="h-4 w-40 rounded bg-blue-700 animate-pulse" />
            </div>
            <div className="h-8 w-72 rounded bg-blue-700 animate-pulse" />
            <div className="h-4 w-64 rounded bg-blue-800 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
            <div className="h-9 w-28 rounded-xl bg-blue-700 animate-pulse" />
            <div className="h-9 w-28 rounded-xl bg-blue-700 animate-pulse" />
        </div>
    </header>
);

const SkeletonDashboard = () => (
    <div className={`min-h-screen ${PAGE_BG} text-slate-800 font-sans p-4 md:p-8`}>
        <div className="max-w-7xl mx-auto space-y-8">
            <HeaderSkeleton />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (<StatCardSkeleton key={i} />))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartSkeleton />
                <div className="lg:col-span-2"><ChartSkeleton /></div>
            </div>
            <div className={`${CARD} overflow-hidden`}>
                <div className="p-6 bg-blue-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-6 w-40 rounded bg-blue-700 animate-pulse" />
                        <div className="h-4 w-72 max-w-full rounded bg-blue-800 animate-pulse" />
                    </div>
                    <div className="h-10 w-full sm:w-64 rounded-xl bg-blue-700 animate-pulse" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-100 border-b-2 border-yellow-400 text-xs uppercase tracking-wider text-blue-950 font-bold">
                                <th className="py-4 px-6">Group Name</th>
                                <th className="py-4 px-6">Referral Code</th>
                                <th className="py-4 px-6">Students</th>
                                <th className="py-4 px-6">Role Assignment</th>
                                <th className="py-4 px-6">Statuses</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-100 text-sm">
                            {[...Array(5)].map((_, i) => (<TableRowSkeleton key={i} />))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-blue-50">
                    <SkeletonPulse className="h-5 w-64" />
                    <SkeletonPulse className="h-9 w-48 rounded-lg" />
                </div>
            </div>
        </div>
    </div>
);

/* ============================
   MODAL BODY SKELETON
   ============================ */
const ModalBodySkeleton = () => (
    <div className="space-y-4">
        <div>
            <div className="flex items-center gap-2 mb-2">
                <SkeletonPulse className="h-4 w-4 rounded" />
                <SkeletonPulse className="h-4 w-32" />
            </div>
            <div className="space-y-1.5">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-100">
                        <div className="flex items-center gap-2">
                            <SkeletonPulse className="h-7 w-7 rounded-full" />
                            <div className="space-y-1">
                                <SkeletonPulse className="h-3.5 w-32" />
                                <SkeletonPulse className="h-2.5 w-44" />
                            </div>
                        </div>
                        <SkeletonPulse className="h-5 w-16 rounded" />
                    </div>
                ))}
            </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-100">
            <div className="flex items-center gap-2">
                <SkeletonPulse className="h-3.5 w-12" />
                <SkeletonPulse className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex gap-1.5">
                <SkeletonPulse className="h-5 w-16 rounded" />
                <SkeletonPulse className="h-5 w-20 rounded" />
            </div>
        </div>
    </div>
);

/* ============================
   HELPERS — Status Mapping
   ============================ */
const STATUS_MAP = {
    confirm: 'Approved',
    confirmed: 'Approved',
    approved: 'Approved',
    rejected: 'Rejected',
    reject: 'Rejected',
    pending: 'Pending',
    '': 'Pending',
};

const normalizeStatus = (rawStatus) => {
    if (!rawStatus) return 'Pending';
    return STATUS_MAP[String(rawStatus).toLowerCase()] || rawStatus;
};

const statusChipClasses = (normalizedStatus) => {
    switch (normalizedStatus) {
        case 'Approved':
            return 'bg-blue-100 text-blue-900 border-blue-300';
        case 'Rejected':
            return 'bg-red-50 text-red-800 border-red-200';
        default:
            return 'bg-yellow-100 text-yellow-900 border-yellow-300';
    }
};

const formatRole = (role) => {
    if (!role) return '';
    return role
        .toLowerCase()
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('-');
};

/* ============================================================
   CHART COMPONENTS
   ============================================================ */

/* ── PIE GRAPH ── */
const STATUS_COLORS = {
    Approved: '#1E3A8A', // navy
    Pending: '#FACC15',  // yellow
    Rejected: '#EF4444', // red
};

const PieGraph = ({ data }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);

    if (!total) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">
                No data available
            </div>
        );
    }

    let cumulative = 0;
    const radius = 40;
    const center = 50;

    const slices = data
        .filter((d) => d.value > 0)
        .map((d) => {
            const percentage = d.value / total;
            const angle = percentage * 360;
            const startAngle = cumulative;
            cumulative += angle;

            const x1 = center + radius * Math.cos((Math.PI * startAngle) / 180);
            const y1 = center + radius * Math.sin((Math.PI * startAngle) / 180);
            const x2 = center + radius * Math.cos((Math.PI * cumulative) / 180);
            const y2 = center + radius * Math.sin((Math.PI * cumulative) / 180);

            const largeArc = angle > 180 ? 1 : 0;

            const path =
                percentage === 1
                    ? `M ${center} ${center} m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`
                    : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            return { ...d, path, percentage };
        });

    return (
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90 drop-shadow-sm">
                    {slices.map((s, i) => (
                        <path
                            key={i}
                            d={s.path}
                            fill={s.color}
                            className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                        >
                            <title>{`${s.label}: ${s.value} (${Math.round(s.percentage * 100)}%)`}</title>
                        </path>
                    ))}
                    <circle cx={center} cy={center} r="20" className="fill-white" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-extrabold text-blue-950">{total}</span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Total</span>
                </div>
            </div>

            <div className="space-y-2 w-full">
                {slices.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-700 font-semibold">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.label}
                        </span>
                        <span className="text-slate-700 font-bold">
                            {s.value} <span className="text-slate-400 font-normal">({Math.round(s.percentage * 100)}%)</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ── WAVE CHART (smooth area line) ── */
const WaveChart = ({ data }) => {
    const [hovered, setHovered] = useState(null);

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">
                No data available
            </div>
        );
    }

    const W = 600;
    const H = 220;
    const PAD_X = 30;
    const PAD_Y = 30;

    const max = Math.max(...data.map((d) => d.value), 1);
    const stepX = (W - PAD_X * 2) / Math.max(data.length - 1, 1);
    const scaleY = (v) => H - PAD_Y - (v / max) * (H - PAD_Y * 2);

    const points = data.map((d, i) => ({
        x: PAD_X + i * stepX,
        y: scaleY(d.value),
        ...d,
    }));

    // Smooth cubic-bezier path (wave)
    const buildSmoothPath = (pts) => {
        if (pts.length === 0) return '';
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i];
            const p1 = pts[i + 1];
            const midX = (p0.x + p1.x) / 2;
            d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        return d;
    };

    const linePath = buildSmoothPath(points);
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${H - PAD_Y} L ${points[0].x} ${H - PAD_Y} Z`;

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1E3A8A" />
                        <stop offset="50%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#FACC15" />
                    </linearGradient>
                </defs>

                {/* horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                    <line
                        key={i}
                        x1={PAD_X}
                        x2={W - PAD_X}
                        y1={PAD_Y + p * (H - PAD_Y * 2)}
                        y2={PAD_Y + p * (H - PAD_Y * 2)}
                        stroke="#DBEAFE"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                ))}

                {/* filled area */}
                <path d={areaPath} fill="url(#waveGradient)" />

                {/* smooth line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                {/* points */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={hovered === i ? 6 : 4}
                            fill="#fff"
                            stroke="#1E3A8A"
                            strokeWidth="2.5"
                            className="transition-all cursor-pointer"
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        />
                        {hovered === i && (
                            <g>
                                <rect
                                    x={p.x - 32}
                                    y={p.y - 34}
                                    width="64"
                                    height="22"
                                    rx="6"
                                    fill="#1E3A8A"
                                />
                                <text
                                    x={p.x}
                                    y={p.y - 19}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fontWeight="bold"
                                    fill="#FACC15"
                                >
                                    {p.value}
                                </text>
                            </g>
                        )}
                    </g>
                ))}

                {/* x labels */}
                {points.map((p, i) => (
                    <text
                        key={`lbl-${i}`}
                        x={p.x}
                        y={H - 8}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#64748B"
                        fontWeight="600"
                    >
                        {p.label}
                    </text>
                ))}
            </svg>
        </div>
    );
};

/* ============================================================
   MAIN DASHBOARD COMPONENT
   ============================================================ */

export default function AdCoAdviserDashboard() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);

    const { role, first_name, last_name } = useContext(AuthContext);
    const { dashboardData, isLoading } = useContext(StatisticalContext);
    const {
        getGroupDetails,
        groupDetails,
        loading: groupLoading,
        approvedAndReject,
    } = useContext(GroupContext);

    useEffect(() => {
        const timer = setTimeout(() => setIsPageLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const bannerDisplayData = useMemo(() => {
        const cards = dashboardData?.cards || {};
        const isAdviser = dashboardData?.isAdviser;
        const isCoAdviser = dashboardData?.isCoAdviser;
        const roleDisplay = formatRole(role) || 'Mentor';
        const roleLabel = isAdviser && isCoAdviser
            ? 'Adviser & Co-Adviser'
            : isAdviser
                ? 'Adviser'
                : isCoAdviser
                    ? 'Co-Adviser'
                    : roleDisplay;

        return {
            group: {
                name: 'BiPSU Mentor Portal',
                referralCode: 'N/A',
                section: {
                    name: `${roleLabel} Access`,
                    subject: {
                        title: 'Adviser & Co-Adviser Dashboard',
                    },
                },
            },
            referredUsers: [],
            userCount: cards?.totalStudents || cards?.totalUsers || 0,
            status: 'success',
        };
    }, [role, dashboardData]);

    /* ── chart data derived from groups ── */
    const chartData = useMemo(() => {
        const groups = dashboardData?.groups || [];

        // Pie: adviser statuses count
        const statusCount = { Approved: 0, Pending: 0, Rejected: 0 };
        groups.forEach((g) => {
            const s = normalizeStatus(g.adviserStatus);
            if (statusCount[s] !== undefined) statusCount[s] += 1;
            else statusCount.Pending += 1;
        });

        const pieData = [
            { label: 'Approved', value: statusCount.Approved, color: STATUS_COLORS.Approved },
            { label: 'Pending', value: statusCount.Pending, color: STATUS_COLORS.Pending },
            { label: 'Rejected', value: statusCount.Rejected, color: STATUS_COLORS.Rejected },
        ];

        // Wave: students per group (first 7 groups for readability)
        const waveData = groups.slice(0, 7).map((g) => ({
            label: (g.groupName || 'Group').slice(0, 6),
            value: g.studentCount || 0,
        }));

        return { pieData, waveData };
    }, [dashboardData]);

    const handleViewGroup = async (group) => {
        setIsProcessing(false);
        setSelectedGroup(group);
        setIsModalOpen(true);
        setIsLoadingDetails(true);

        if (getGroupDetails && group?.referralCode) {
            try {
                await getGroupDetails(group.referralCode);
            } catch (err) {
                console.error('❌ getGroupDetails error:', err);
            } finally {
                setIsLoadingDetails(false);
            }
        } else {
            setIsLoadingDetails(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedGroup(null);
        setIsLoadingDetails(false);
        setIsProcessing(false);
    };

    const handleApprove = async (groupId) => {
        const referralCode = groupDetails?.group?.referralCode || selectedGroup?.referralCode;
        if (!referralCode) {
            alert('Referral code missing. Cannot approve.');
            return;
        }
        setIsProcessing(true);
        try {
            const result = await approvedAndReject(referralCode, 'confirm');
            if (result.success) {
                alert(result.message || 'Group approved successfully!');
                closeModal();
            } else {
                alert(result.error || result.message || 'Failed to approve group.');
            }
        } catch (error) {
            console.error('Error approving group:', error);
            alert('Failed to approve group. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (groupId) => {
        const referralCode = groupDetails?.group?.referralCode || selectedGroup?.referralCode;
        if (!referralCode) {
            alert('Referral code missing. Cannot reject.');
            return;
        }
        setIsProcessing(true);
        try {
            const result = await approvedAndReject(referralCode, 'rejected');
            if (result.success) {
                alert(result.message || 'Group rejected successfully.');
                closeModal();
            } else {
                alert(result.error || result.message || 'Failed to reject group.');
            }
        } catch (error) {
            console.error('Error rejecting group:', error);
            alert('Failed to reject group. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    if (isLoading || isPageLoading) {
        return <SkeletonDashboard />;
    }

    if (!dashboardData) {
        return (
            <div className={`min-h-screen ${PAGE_BG} flex items-center justify-center`}>
                <div className="text-center">
                    <p className="text-blue-900 font-medium">No data available</p>
                </div>
            </div>
        );
    }

    const { cards, groups } = dashboardData;

    const filteredGroups = groups?.filter(g =>
        g.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const totalItems = filteredGroups.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
    const indexOfLastItem = validCurrentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentGroups = filteredGroups.slice(indexOfFirstItem, indexOfLastItem);

    const goToPage = (pageNumber) => {
        setCurrentPage(Math.min(Math.max(1, pageNumber), totalPages || 1));
    };

    const statCards = [
        { label: 'Titles', value: cards?.totalTitles, hint: 'Total submitted', Icon: FileText },
        { label: 'Groups', value: cards?.totalGroups, hint: 'Active teams', Icon: Layers },
        { label: 'Users', value: cards?.totalUsers, hint: 'Associated users', Icon: Users },
        { label: 'Students', value: cards?.totalStudents, hint: 'Enrolled students', Icon: UserCheck },
        { label: 'Remarks', value: cards?.withRemarks, hint: 'With feedback', Icon: CheckCircle2 },
        { label: 'No Remarks', value: cards?.withoutRemarks, hint: 'Pending feedback', Icon: Clock },
    ];

    const GroupDetailsModal = ({ onClose, isLoadingDetails = false }) => {
        const isFetching = isLoadingDetails || groupLoading;
        const realGroup = groupDetails?.group || null;
        const referredUsers = groupDetails?.referredUsers || [];
        const userCount = groupDetails?.userCount ?? referredUsers.length;

        if (!isModalOpen) return null;

        const groupName = realGroup?.name || selectedGroup?.groupName || 'Group';
        const referralCode = realGroup?.referralCode || selectedGroup?.referralCode || '—';
        const memberCount = realGroup?.memberCount ?? userCount;
        const isUserCoAdviser = realGroup?.isCoAdviser || selectedGroup?.isCoAdviser;

        const rawStatus =
            (isUserCoAdviser
                ? realGroup?.coadviserStatus || selectedGroup?.coadviserStatus
                : realGroup?.adviserStatus || selectedGroup?.adviserStatus) || 'Pending';

        const currentStatus = normalizeStatus(rawStatus);
        const isApproved = currentStatus.toLowerCase() === 'approved';
        const isRejected = currentStatus.toLowerCase() === 'rejected';
        const isDecided = isApproved || isRejected;

        const instructor =
            realGroup?.instructor ||
            realGroup?.subjectInstructor ||
            realGroup?.subject?.createdBy ||
            null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60">
                <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-blue-200">
                    <div className="flex items-center justify-between p-4 bg-blue-900 border-b-4 border-yellow-400">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                {groupName}
                                {isFetching && <Loader2 className="w-4 h-4 animate-spin text-yellow-300" />}
                            </h2>
                            <p className="text-sm text-blue-200">
                                Code: <span className="font-mono font-semibold text-yellow-300">{referralCode}</span>
                                {!isFetching && ` • ${memberCount} member${memberCount === 1 ? '' : 's'}`}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="p-1.5 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 text-blue-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                        {isFetching ? (
                            <ModalBodySkeleton />
                        ) : (
                            <>
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                        <UserCheck className="w-4 h-4" />
                                        Members ({referredUsers.length})
                                    </h3>
                                    {referredUsers.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-slate-500 bg-blue-50 rounded-lg border border-dashed border-blue-200">
                                            No members have joined this group yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {referredUsers.map((member) => {
                                                const fullName = [
                                                    member.first_name,
                                                    member.middle_name ? `${member.middle_name}.` : '',
                                                    member.last_name,
                                                    member.suffix
                                                ].filter(Boolean).join(' ').trim() || 'Unnamed Member';

                                                const initials = fullName
                                                    .split(' ')
                                                    .map(n => n[0])
                                                    .join('')
                                                    .toUpperCase()
                                                    .slice(0, 2);

                                                return (
                                                    <div
                                                        key={member.id || member._id || member.email}
                                                        className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-blue-900 text-yellow-300 flex items-center justify-center text-xs font-bold">
                                                                {initials || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">{fullName}</p>
                                                                <p className="text-xs text-slate-500">{member.email || '—'}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs px-2 py-0.5 bg-white text-blue-800 rounded border border-blue-200 capitalize">
                                                            {member.role || 'student'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {instructor && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                            <UserCog className="w-4 h-4" />
                                            Subject Instructor
                                        </h3>
                                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-yellow-400 text-blue-950 flex items-center justify-center text-sm font-bold">
                                                    {(() => {
                                                        const name = instructor.name
                                                            || `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
                                                            || 'IN';
                                                        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                                    })()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">
                                                        {instructor.name
                                                            || `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
                                                            || 'Unknown Instructor'}
                                                    </p>
                                                    <p className="text-xs text-slate-600">{instructor.email || '—'}</p>
                                                    {instructor.department && (
                                                        <p className="text-xs text-slate-600">{instructor.department}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <div>
                                        <span className="text-sm text-slate-600">Status</span>
                                        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusChipClasses(currentStatus)}`}>
                                            {currentStatus}
                                        </span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {(realGroup?.isAdviser || selectedGroup?.isAdviser) && (
                                            <span className="px-2 py-0.5 bg-blue-900 text-white text-xs font-bold rounded">
                                                Adviser
                                            </span>
                                        )}
                                        {(realGroup?.isCoAdviser || selectedGroup?.isCoAdviser) && (
                                            <span className="px-2 py-0.5 bg-yellow-400 text-blue-950 text-xs font-bold rounded">
                                                Co-Adviser
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 p-4 border-t border-blue-100 bg-blue-50">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Close
                        </button>

                        {!isDecided && (
                            <>
                                <button
                                    onClick={() => handleApprove(realGroup?._id || selectedGroup?.groupId)}
                                    disabled={isProcessing || isFetching}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(realGroup?._id || selectedGroup?.groupId)}
                                    disabled={isProcessing || isFetching}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Reject
                                </button>
                            </>
                        )}

                        {isDecided && (
                            <span
                                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${isApproved
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-700'
                                    }`}
                            >
                                {isApproved ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {isApproved ? 'Already Approved' : 'Already Rejected'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`min-h-screen ${PAGE_BG} text-slate-800 font-sans p-4 md:p-8`}>
            <div className="max-w-7xl mx-auto space-y-8">

                {/* UserDashboardBanner */}
                <UserDashboardBanner
                    first_name={first_name}
                    last_name={last_name}
                    role={role}
                    displayData={bannerDisplayData}
                />

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {statCards.map(({ label, value, hint, Icon }) => (
                        <div
                            key={label}
                            className={`${CARD} border-t-4 border-t-yellow-400 p-5 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/15 transition-all`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-800">{label}</span>
                                <div className="p-1.5 bg-blue-900 rounded-lg">
                                    <Icon className="w-4 h-4 text-yellow-300" />
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-extrabold text-blue-950">{value || 0}</div>
                                <div className="text-xs text-slate-500 mt-1">{hint}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pie Graph */}
                    <div className={`${CARD} border-t-4 border-t-blue-900 p-6 flex flex-col`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-blue-950 flex items-center gap-2">
                                <span className="p-1.5 bg-blue-900 rounded-lg">
                                    <PieChartIcon className="w-4 h-4 text-yellow-300" />
                                </span>
                                Adviser Status
                            </h3>
                        </div>
                        <div className="flex-1 flex items-center">
                            <PieGraph data={chartData.pieData} />
                        </div>
                        <div className="mt-4 pt-4 border-t border-blue-100 text-xs text-slate-500 flex justify-between items-center">
                            <span>Distribution of group adviser statuses</span>
                            <span className="font-bold text-blue-900 bg-yellow-300 px-2 py-0.5 rounded-full">
                                {chartData.pieData.reduce((s, d) => s + d.value, 0)} groups
                            </span>
                        </div>
                    </div>

                    {/* Wave Chart */}
                    <div className={`${CARD} border-t-4 border-t-blue-900 p-6 lg:col-span-2 flex flex-col`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                            <h3 className="text-lg font-bold text-blue-950 flex items-center gap-2">
                                <span className="p-1.5 bg-blue-900 rounded-lg">
                                    <TrendingUp className="w-4 h-4 text-yellow-300" />
                                </span>
                                Students per Group
                            </h3>
                            <div className="flex items-center gap-3 text-xs font-semibold text-blue-950 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-1 rounded-full bg-blue-900"></span> Student count
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center">
                            <WaveChart data={chartData.waveData} />
                        </div>
                        <div className="mt-4 pt-4 border-t border-blue-100 text-xs text-slate-500 flex justify-between items-center">
                            <span>Hover points to see values</span>
                            <span className="font-bold text-blue-900">First {chartData.waveData.length} groups</span>
                        </div>
                    </div>
                </div>

                {/* Groups Management */}
                <div className={`${CARD} overflow-hidden`}>
                    <div className="p-6 bg-blue-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">Assigned Groups</h3>
                            <p className="text-blue-200 text-sm mt-0.5">Manage groups where you are assigned as adviser or co-adviser.</p>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                            <input
                                type="text"
                                placeholder="Search group or code..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10 pr-4 py-2 bg-white border-2 border-transparent rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-yellow-400 w-full sm:w-64"
                            />
                        </div>
                    </div>

                    {/* FIXED HEIGHT SCROLLABLE TABLE */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-blue-100 border-b-2 border-yellow-400 text-xs uppercase tracking-wider text-blue-950 font-bold">
                                    <th className="py-4 px-6">Group Name</th>
                                    <th className="py-4 px-6">Referral Code</th>
                                    <th className="py-4 px-6">Students</th>
                                    <th className="py-4 px-6">Role Assignment</th>
                                    <th className="py-4 px-6">Statuses</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                        </table>
                        <div className="max-h-[420px] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <tbody className="divide-y divide-blue-100 text-sm">
                                    {currentGroups.length > 0 ? (
                                        currentGroups.map((group) => {
                                            const advStatus = normalizeStatus(group.adviserStatus);
                                            const coStatus = normalizeStatus(group.coadviserStatus);

                                            return (
                                                <tr key={group.groupId} className="odd:bg-white even:bg-blue-50/60 hover:bg-yellow-50 transition-colors">
                                                    <td className="py-4 px-6 font-bold text-blue-950">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-900 text-yellow-300 flex items-center justify-center font-extrabold text-xs shadow-sm">
                                                                {group.groupName?.substring(0, 2).toUpperCase() || 'NA'}
                                                            </div>
                                                            {group.groupName}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <code className="px-2 py-1 bg-white text-blue-800 border border-blue-200 rounded-lg text-xs font-mono font-bold">
                                                            {group.referralCode}
                                                        </code>
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-700 font-semibold">
                                                        {group.studentCount} {group.studentCount === 1 ? 'student' : 'students'}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            {group.isAdviser && (
                                                                <span className="px-2.5 py-0.5 bg-blue-900 text-white text-xs font-bold rounded-md">
                                                                    Adviser
                                                                </span>
                                                            )}
                                                            {group.isCoAdviser && (
                                                                <span className="px-2.5 py-0.5 bg-yellow-400 text-blue-950 text-xs font-bold rounded-md">
                                                                    Co-Adviser
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex gap-2 items-center text-xs">
                                                            <span className={`capitalize px-2.5 py-1 rounded-lg border font-semibold ${statusChipClasses(advStatus)}`}>
                                                                Adviser: {advStatus}
                                                            </span>
                                                            <span className={`capitalize px-2.5 py-1 rounded-lg border font-semibold ${statusChipClasses(coStatus)}`}>
                                                                Co: {coStatus}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <button
                                                            onClick={() => handleViewGroup(group)}
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold text-xs rounded-xl transition-all shadow-sm"
                                                        >
                                                            View <ExternalLink className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-slate-500">
                                                No groups found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {filteredGroups.length > 0 && (
                        <div className="px-6 py-4 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-blue-50">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <span>Show</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                    className="px-2 py-1 border border-blue-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span>entries</span>
                                <span className="hidden sm:inline ml-2">
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} groups
                                </span>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => goToPage(validCurrentPage - 1)}
                                    disabled={validCurrentPage === 1}
                                    className={`p-2 rounded-lg border transition-all ${validCurrentPage === 1
                                        ? 'border-blue-100 text-blue-200 cursor-not-allowed'
                                        : 'border-blue-300 text-blue-900 bg-white hover:bg-yellow-100 hover:border-yellow-400'
                                        }`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let pageNumber;
                                        if (totalPages <= 5) {
                                            pageNumber = i + 1;
                                        } else if (validCurrentPage <= 3) {
                                            pageNumber = i + 1;
                                        } else if (validCurrentPage >= totalPages - 2) {
                                            pageNumber = totalPages - 4 + i;
                                        } else {
                                            pageNumber = validCurrentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => goToPage(pageNumber)}
                                                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${validCurrentPage === pageNumber
                                                    ? 'bg-blue-900 text-yellow-300 shadow-sm'
                                                    : 'text-blue-900 hover:bg-yellow-100'
                                                    }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => goToPage(validCurrentPage + 1)}
                                    disabled={validCurrentPage === totalPages || totalPages === 0}
                                    className={`p-2 rounded-lg border transition-all ${validCurrentPage === totalPages || totalPages === 0
                                        ? 'border-blue-100 text-blue-200 cursor-not-allowed'
                                        : 'border-blue-300 text-blue-900 bg-white hover:bg-yellow-100 hover:border-yellow-400'
                                        }`}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Group Details Modal */}
            <GroupDetailsModal
                onClose={closeModal}
                isLoadingDetails={isLoadingDetails}
            />
        </div>
    );
}