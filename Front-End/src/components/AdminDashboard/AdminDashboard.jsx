import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
    Users,
    FileText,
    BookOpen,
    Layers,
    PieChart as PieIcon,
    TrendingUp,
    CheckCircle2,
    BookMarked,
    Eye,
    EyeOff,
    AlertCircle,
    Inbox,
} from 'lucide-react';

import { StatisticalContext } from '../../contexts/StatisticalContext/StatisticalContext';
import { AuthContext } from '../../contexts/AuthContext';
import UploadDocuments from './UploadDocuments';
import UserDashboardBanner from '../UserDashboard/components/UserDashboardBanner';

/* ⭐ CHART COLORS — blue → yellow accent palette */
const CHART_COLORS = [
    '#1E3A8A', // Blue 900
    '#FACC15', // Yellow 400
    '#3B82F6', // Blue 500
    '#93C5FD', // Blue 300
    '#2563EB', // Blue 600
    '#FDE047', // Yellow 300
];

/* ⭐ SEMANTIC status colors — always meaningful */
const STATUS_COLOR_MAP = {
    Pending: '#FACC15',           // yellow
    Approved: '#1E3A8A',          // navy
    Revision: '#A855F7',          // purple
    'Ready for Defense': '#10B981', // emerald
    Rejected: '#EF4444',          // red
};

const getStatusColor = (label, fallbackIdx = 0) => {
    return STATUS_COLOR_MAP[label] || CHART_COLORS[fallbackIdx % CHART_COLORS.length];
};

const formatRole = (role) => {
    if (!role) return '';
    return role
        .toLowerCase()
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('-');
};

/* ============================
   SKELETON LOADING COMPONENTS
   ============================ */

const SkeletonPulse = ({ className = '' }) => (
    <div className={`animate-pulse bg-blue-100 rounded ${className}`} />
);

const StatCardSkeleton = () => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 border-t-4 border-t-yellow-300 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
            <SkeletonPulse className="h-3 w-14" />
            <SkeletonPulse className="h-8 w-8 rounded-xl" />
        </div>
        <div>
            <SkeletonPulse className="h-5 w-10 mb-2" />
            <SkeletonPulse className="h-3 w-16" />
        </div>
    </div>
);

const DonutChartSkeleton = ({ size = 140 }) => (
    <div className="relative flex items-center justify-center" style={{ height: size }}>
        <div
            className="rounded-full border-[14px] border-blue-100 animate-pulse"
            style={{ width: size, height: size }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <SkeletonPulse className="h-4 w-7" />
            <SkeletonPulse className="h-2 w-8" />
        </div>
    </div>
);

const PieCardSkeleton = () => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 border-t-4 border-t-blue-900 flex flex-col">
        <div className="mb-2 space-y-2">
            <SkeletonPulse className="h-4 w-32" />
            <SkeletonPulse className="h-3 w-24" />
        </div>
        <div className="flex-1 flex items-center justify-center py-1">
            <DonutChartSkeleton size={140} />
        </div>
        <div className="mt-2 space-y-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <SkeletonPulse className="h-2 w-2 rounded-sm" />
                        <SkeletonPulse className="h-3 w-20" />
                    </div>
                    <SkeletonPulse className="h-3 w-4" />
                </div>
            ))}
        </div>
    </div>
);

const LineGraphSkeleton = () => (
    <div className="w-full">
        <div className="relative w-full" style={{ height: 180 }}>
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-4">
                {[...Array(5)].map((_, i) => (
                    <SkeletonPulse key={i} className="h-2 w-4" />
                ))}
            </div>
            <div className="ml-6 h-full flex items-end gap-1 pb-6">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                        <SkeletonPulse
                            className="w-full rounded-sm"
                            style={{ height: `${10 + Math.random() * 40}%` }}
                        />
                    </div>
                ))}
            </div>
            <div className="ml-6 flex justify-between pt-2">
                {[...Array(6)].map((_, i) => (
                    <SkeletonPulse key={i} className="h-2 w-8" />
                ))}
            </div>
        </div>
    </div>
);

/* ============================
   EMPTY STATE COMPONENT
   ============================ */
const EmptyChartState = ({ icon: Icon = Inbox, title = 'No data available', subtitle = 'Data will appear once available' }) => (
    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
            <Icon className="w-6 h-6 text-blue-300" />
        </div>
        <p className="text-sm font-semibold text-blue-900">{title}</p>
        <p className="text-[11px] text-blue-400 mt-1 max-w-[180px]">{subtitle}</p>
    </div>
);

/* ============================
   CHART COMPONENTS
   ============================ */

const DonutChart = ({ data = [], size = 160, innerRadius = 46 }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const total = data.reduce((sum, d) => sum + (d.value || 0), 0);

    if (total === 0) {
        return (
            <div className="flex items-center justify-center" style={{ height: size }}>
                <EmptyChartState
                    icon={PieIcon}
                    title="No data available"
                    subtitle="Charts will populate once submissions arrive"
                />
            </div>
        );
    }

    const radius = size / 2;
    const center = radius;
    let cumulativeAngle = -Math.PI / 2;

    const slices = data.map((d) => {
        const angle = (d.value / total) * Math.PI * 2;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + angle;
        cumulativeAngle = endAngle;

        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);

        const largeArcFlag = angle > Math.PI ? 1 : 0;

        const ix1 = center + innerRadius * Math.cos(endAngle);
        const iy1 = center + innerRadius * Math.sin(endAngle);
        const ix2 = center + innerRadius * Math.cos(startAngle);
        const iy2 = center + innerRadius * Math.sin(startAngle);

        const donutPath = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L ${ix1} ${iy1}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
            'Z',
        ].join(' ');

        return {
            path: donutPath,
            color: d.color,
            label: d.label,
            value: d.value,
            percent: ((d.value / total) * 100).toFixed(1),
        };
    });

    const hoveredSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

    return (
        <div className="relative flex items-center justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm mx-auto overflow-visible">
                {slices.map((slice, i) => {
                    const isHovered = hoveredIndex === i;
                    const scale = isHovered ? 1.05 : 1;
                    const translate = isHovered ? 'translate(2px, -2px)' : 'translate(0, 0)';

                    return (
                        <g
                            key={i}
                            style={{
                                transform: `${translate} scale(${scale})`,
                                transformOrigin: `${center}px ${center}px`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                filter: isHovered ? 'drop-shadow(0 4px 6px rgba(30, 58, 138, 0.3))' : 'none',
                            }}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <path
                                d={slice.path}
                                fill={slice.color}
                                stroke="#ffffff"
                                strokeWidth={isHovered ? 2.5 : 1.5}
                                style={{
                                    transition: 'all 0.3s ease',
                                    opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1,
                                }}
                            >
                                <title>{`${slice.label}: ${slice.value} (${slice.percent}%)`}</title>
                            </path>
                        </g>
                    );
                })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {hoveredSlice ? (
                    <>
                        <span
                            className="text-xl font-extrabold transition-all duration-300 leading-none"
                            style={{ color: hoveredSlice.color }}
                        >
                            {hoveredSlice.value}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-blue-500 font-bold text-center px-1 leading-tight mt-1">
                            {hoveredSlice.label}
                        </span>
                        <span className="text-[10px] font-semibold text-blue-700 mt-0.5">
                            {hoveredSlice.percent}%
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-2xl font-extrabold text-blue-950 transition-all duration-300 leading-none">{total}</span>
                        <span className="text-[9px] uppercase tracking-widest text-blue-500 font-bold mt-1">
                            Total
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};

const LineGraph = ({ data = [], labels = [], label = "Proposals Submitted" }) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const maxVal = Math.max(...data, 5);
    const width = 600;
    const height = 180;
    const padding = 30;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const points = data.map((val, idx) => {
        const x = padding + (idx / (labels.length - 1 || 1)) * graphWidth;
        const y = height - padding - (val / maxVal) * graphHeight;
        return { x, y, val, label: labels[idx], index: idx };
    });

    const pathD = points.length > 0
        ? points.reduce((acc, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '')
        : '';

    const areaD = points.length > 0
        ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
        : '';

    const hasData = data.some((v) => v > 0);

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                    <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#1E3A8A" />
                            <stop offset="60%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#FACC15" />
                        </linearGradient>
                    </defs>

                    {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
                        const y = padding + graphHeight * ratio;
                        const val = Math.round(maxVal * (1 - ratio));
                        return (
                            <g key={i}>
                                <line
                                    x1={padding}
                                    y1={y}
                                    x2={width - padding}
                                    y2={y}
                                    stroke="#dbeafe"
                                    strokeDasharray="4 4"
                                    strokeWidth="1"
                                />
                                <text
                                    x={padding - 8}
                                    y={y + 3}
                                    fontSize="8"
                                    fill="#93c5fd"
                                    textAnchor="end"
                                    fontWeight="500"
                                >
                                    {val}
                                </text>
                            </g>
                        );
                    })}

                    {hasData && areaD && (
                        <path
                            d={areaD}
                            fill="url(#lineGrad)"
                            className="transition-all duration-500"
                            style={{ opacity: hoveredPoint !== null ? 0.7 : 1 }}
                        />
                    )}

                    {hasData && pathD && (
                        <path
                            d={pathD}
                            fill="none"
                            stroke="url(#strokeGrad)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-all duration-500"
                            style={{
                                filter: hoveredPoint !== null ? 'drop-shadow(0 2px 4px rgba(30, 58, 138, 0.25))' : 'none',
                            }}
                        />
                    )}

                    {points.map((pt, i) => {
                        const isHovered = hoveredPoint === i;
                        const isEmpty = !pt.val;
                        return (
                            <g
                                key={i}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPoint(i)}
                                onMouseLeave={() => setHoveredPoint(null)}
                            >
                                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                                {isHovered && !isEmpty && (
                                    <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r="9"
                                        fill="none"
                                        stroke="#FACC15"
                                        strokeWidth="1.5"
                                        opacity="0.6"
                                        className="animate-ping"
                                        style={{ animationDuration: '1.5s' }}
                                    />
                                )}

                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={isHovered ? 4.5 : (isEmpty ? 2.5 : 3.5)}
                                    fill={isEmpty ? '#CBD5E1' : '#3B82F6'}
                                    stroke={isHovered ? '#FACC15' : (isEmpty ? '#94A3B8' : '#1E3A8A')}
                                    strokeWidth={isHovered ? 2 : 1.5}
                                    className="transition-all duration-300 ease-out"
                                    style={{
                                        filter: isHovered ? 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5))' : 'none',
                                    }}
                                />

                                {isHovered && (
                                    <g>
                                        <rect
                                            x={pt.x - 40}
                                            y={pt.y - 38}
                                            width="80"
                                            height="26"
                                            rx="6"
                                            fill="#1E3A8A"
                                            className="drop-shadow-lg"
                                            style={{ animation: 'fadeIn 0.2s ease-out' }}
                                        />
                                        <polygon
                                            points={`${pt.x - 5},${pt.y - 12} ${pt.x + 5},${pt.y - 12} ${pt.x},${pt.y - 7}`}
                                            fill="#1E3A8A"
                                        />
                                        <text
                                            x={pt.x}
                                            y={pt.y - 26}
                                            textAnchor="middle"
                                            fill="#FACC15"
                                            fontSize="8"
                                            fontWeight="700"
                                        >
                                            {pt.val} {label}
                                        </text>
                                        <text
                                            x={pt.x}
                                            y={pt.y - 17}
                                            textAnchor="middle"
                                            fill="#FFFFFF"
                                            fontSize="6.5"
                                            fontWeight="500"
                                            opacity="0.85"
                                        >
                                            {pt.label}
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    {hoveredPoint !== null && points[hoveredPoint] && (
                        <line
                            x1={points[hoveredPoint].x}
                            y1={padding}
                            x2={points[hoveredPoint].x}
                            y2={height - padding}
                            stroke="#FACC15"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                            opacity="0.5"
                            className="transition-all duration-200"
                        />
                    )}
                </svg>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 w-full text-[9px] text-blue-600 font-medium text-center mt-2 border-t border-blue-100 pt-2">
                {labels.map((lbl, idx) => {
                    const isHovered = hoveredPoint === idx;
                    const [month, year] = lbl.split(' ');
                    return (
                        <div
                            key={idx}
                            className={`truncate transition-all duration-200 cursor-default ${isHovered ? 'text-blue-900 font-semibold' : ''
                                }`}
                            title={lbl}
                            onMouseEnter={() => setHoveredPoint(idx)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        >
                            <div className={`${isHovered ? 'scale-110' : ''} transition-transform`}>
                                {month}{' '}
                                <span className={`text-[8px] font-normal ${isHovered ? 'text-yellow-600' : 'text-blue-400'}`}>
                                    {year}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ⭐ STAT CARD — yellow top accent + navy icon badge */
const StatCard = ({ label, value, sublabel, icon: Icon, iconColor }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 border-t-4 border-t-yellow-400 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/15 transition-all duration-300 group">
        <div className="flex items-center justify-between text-blue-800 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            <div className="p-1.5 bg-blue-900 rounded-lg group-hover:scale-110 transition-all duration-300 shadow-sm">
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
        </div>
        <div>
            <div className="text-lg font-extrabold text-blue-950 group-hover:text-blue-800 transition-colors duration-300 leading-tight">{value}</div>
            <div className="text-[10px] text-blue-600/80 mt-0.5 font-normal">{sublabel}</div>
        </div>
    </div>
);

/* ⭐ PROFESSIONAL LEGEND ROW */
const LegendRow = ({ color, label, value, total }) => {
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    return (
        <div className="flex items-center justify-between text-[11px] hover:bg-blue-50 rounded-lg px-2 py-1.5 transition-colors duration-200 group">
            <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                <span className="text-blue-800 font-medium truncate">{label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-blue-400 font-normal tabular-nums">{pct}%</span>
                <span className="font-bold text-blue-900 tabular-nums min-w-[20px] text-right">{value}</span>
            </div>
        </div>
    );
};

export default function App() {
    const { Admindata } = useContext(StatisticalContext);
    const { role, first_name, last_name } = useContext(AuthContext);

    const [isLoading, setIsLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const dashboardData = useMemo(() => {
        const empty = {
            statisticalCards: {
                totalUsers: 0,
                totalGroups: 0,
                totalProposals: 0,
                totalSubjects: 0,
                totalSections: 0,
                pendingProposals: 0,
                approvedProposals: 0,
                rejectedProposals: 0,
                revisionProposals: 0,
                readyForDefenseProposals: 0,
                selectedProposals: 0,
            },
            pieGraph: { labels: [], data: [] },
            lineGraph: { labels: [], data: [], label: 'Proposals Submitted' },
            pieGraphGroups: { labels: [], data: [] },
        };

        if (!Admindata) return empty;

        return {
            statisticalCards: {
                ...empty.statisticalCards,
                ...(Admindata.statisticalCards || {}),
            },
            pieGraph: {
                labels: Admindata.pieGraph?.labels || [],
                data: Admindata.pieGraph?.data || [],
            },
            lineGraph: {
                labels: Admindata.lineGraph?.labels || [],
                data: Admindata.lineGraph?.data || [],
                label: Admindata.lineGraph?.label || 'Proposals Submitted',
            },
            pieGraphGroups: {
                labels: Admindata.pieGraphGroups?.labels || [],
                data: Admindata.pieGraphGroups?.data || [],
            },
        };
    }, [Admindata]);

    const stats = dashboardData.statisticalCards;

    const displayRole = formatRole(role) || 'User';

    const bannerDisplayData = useMemo(() => ({
        group: {
            name: 'BiPSU Faculty Portal',
            referralCode: 'N/A',
            section: {
                name: `${displayRole} Access`,
                subject: {
                    title: 'Institutional Dashboard',
                },
            },
        },
        referredUsers: [],
        userCount: stats.totalUsers || 0,
        status: 'success',
    }), [displayRole, stats.totalUsers]);

    /* ⭐ computed totals for pie cards */
    const proposalStatusTotal = useMemo(
        () => dashboardData.pieGraph.data.reduce((s, v) => s + (v || 0), 0),
        [dashboardData.pieGraph.data]
    );

    const groupDistTotal = useMemo(
        () => dashboardData.pieGraphGroups.data.reduce((s, v) => s + (v || 0), 0),
        [dashboardData.pieGraphGroups.data]
    );

    const peakProposals = useMemo(() => {
        const arr = dashboardData.lineGraph.data.length ? dashboardData.lineGraph.data : [0];
        return Math.max(...arr);
    }, [dashboardData.lineGraph.data]);

    /* ⭐ peak label */
    const peakLabel = useMemo(() => {
        const arr = dashboardData.lineGraph.data;
        const labels = dashboardData.lineGraph.labels;
        if (!arr.length || !labels.length) return 'N/A';
        const max = Math.max(...arr);
        const idx = arr.indexOf(max);
        return labels[idx] || 'N/A';
    }, [dashboardData.lineGraph.data, dashboardData.lineGraph.labels]);

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-sky-50 font-sans overflow-hidden">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* ⭐ Banner */}
                {isLoading ? (
                    <div className="w-full space-y-3 bg-white p-6 rounded-3xl shadow-sm border border-blue-100 border-t-4 border-t-yellow-400">
                        <div className="flex items-center gap-2">
                            <SkeletonPulse className="h-6 w-28 rounded-full" />
                            <SkeletonPulse className="h-4 w-40" />
                        </div>
                        <SkeletonPulse className="h-8 w-72" />
                        <SkeletonPulse className="h-4 w-96 max-w-full" />
                    </div>
                ) : (
                    <UserDashboardBanner
                        first_name={first_name}
                        last_name={last_name}
                        role={role}
                        displayData={bannerDisplayData}
                    />
                )}

                {/* Statistical Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {isLoading ? (
                        [...Array(6)].map((_, i) => <StatCardSkeleton key={i} />)
                    ) : (
                        <>
                            <StatCard label="Users" value={stats.totalUsers} sublabel="System users" icon={Users} iconColor="text-yellow-300" />
                            <StatCard label="Groups" value={stats.totalGroups} sublabel="Total groups" icon={Layers} iconColor="text-yellow-300" />
                            <StatCard label="Proposals" value={stats.totalProposals} sublabel="Submitted total" icon={FileText} iconColor="text-yellow-300" />
                            <StatCard label="Subjects" value={stats.totalSubjects} sublabel="Total subjects" icon={BookMarked} iconColor="text-yellow-300" />
                            <StatCard label="Sections" value={stats.totalSections} sublabel="Total sections" icon={BookOpen} iconColor="text-yellow-300" />
                            <StatCard label="Ready Defense" value={stats.readyForDefenseProposals} sublabel="Cleared status" icon={CheckCircle2} iconColor="text-yellow-300" />
                        </>
                    )}
                </div>

                {/* Upload Documents */}
                <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowUpload((prev) => !prev)}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-blue-50 transition-colors duration-200"
                    >
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-blue-900 rounded-lg">
                                <FileText className="w-3.5 h-3.5 text-yellow-300" />
                            </span>
                            <span className="text-sm font-semibold text-blue-900">
                                Upload Documents
                            </span>
                            <span className="text-[10px] text-blue-500 font-normal hidden sm:inline">
                                • Manage proposal attachments
                            </span>
                        </div>

                        <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all duration-300 bg-yellow-100 text-yellow-900 border-yellow-300 hover:bg-yellow-200">
                            {showUpload ? (
                                <>
                                    <EyeOff className="w-3 h-3" />
                                    Hide
                                </>
                            ) : (
                                <>
                                    <Eye className="w-3 h-3" />
                                    Show
                                </>
                            )}
                        </span>
                    </button>

                    <div
                        className={`transition-all duration-300 ease-in-out ${showUpload
                            ? 'max-h-[2000px] opacity-100'
                            : 'max-h-0 opacity-0 overflow-hidden'
                            }`}
                    >
                        <div className="px-4 pb-4 pt-1 border-t border-blue-100">
                            <UploadDocuments isLoading={isLoading} />
                        </div>
                    </div>
                </div>

                {/* Two Pie Graphs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isLoading ? (
                        <>
                            <PieCardSkeleton />
                            <PieCardSkeleton />
                        </>
                    ) : (
                        <>
                            {/* ── Proposal Status ── */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 border-t-4 border-t-blue-900 flex flex-col hover:shadow-lg transition-shadow duration-300">
                                <div className="mb-3 flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                            <span className="p-1.5 bg-blue-900 rounded-lg">
                                                <PieIcon className="w-3.5 h-3.5 text-yellow-300" />
                                            </span>
                                            Proposal Status
                                        </h3>
                                        <p className="text-[11px] text-blue-500 font-normal mt-0.5">By lifecycle status</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${proposalStatusTotal > 0
                                        ? 'text-blue-900 bg-yellow-300'
                                        : 'text-blue-600 bg-blue-100 border border-blue-200'
                                        }`}>
                                        {proposalStatusTotal} total
                                    </span>
                                </div>

                                <div className="flex-1 flex items-center justify-center py-2 min-h-[180px]">
                                    {proposalStatusTotal > 0 ? (
                                        <DonutChart
                                            data={dashboardData.pieGraph.labels.map((label, idx) => ({
                                                label,
                                                value: dashboardData.pieGraph.data[idx],
                                                color: getStatusColor(label, idx),
                                            }))}
                                            size={160}
                                            innerRadius={46}
                                        />
                                    ) : (
                                        <EmptyChartState
                                            icon={PieIcon}
                                            title="No data available"
                                            subtitle="Status breakdown will appear once proposals are submitted"
                                        />
                                    )}
                                </div>

                                <div className="mt-3 pt-3 border-t border-blue-100 space-y-0.5">
                                    {dashboardData.pieGraph.labels.length > 0 ? (
                                        dashboardData.pieGraph.labels.map((label, idx) => {
                                            const val = dashboardData.pieGraph.data[idx];
                                            const color = getStatusColor(label, idx);
                                            return (
                                                <LegendRow
                                                    key={label}
                                                    color={color}
                                                    label={label}
                                                    value={val}
                                                    total={proposalStatusTotal}
                                                />
                                            );
                                        })
                                    ) : (
                                        <p className="text-[11px] text-blue-400 text-center py-2 italic">
                                            No status categories defined
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ── Group Distribution ── */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 border-t-4 border-t-blue-900 flex flex-col hover:shadow-lg transition-shadow duration-300">
                                <div className="mb-3 flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                            <span className="p-1.5 bg-blue-900 rounded-lg">
                                                <Layers className="w-3.5 h-3.5 text-yellow-300" />
                                            </span>
                                            Group Distribution
                                        </h3>
                                        <p className="text-[11px] text-blue-500 font-normal mt-0.5">Members across units</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${groupDistTotal > 0
                                        ? 'text-blue-900 bg-yellow-300'
                                        : 'text-blue-600 bg-blue-100 border border-blue-200'
                                        }`}>
                                        {groupDistTotal} total
                                    </span>
                                </div>

                                <div className="flex-1 flex items-center justify-center py-2 min-h-[180px]">
                                    {groupDistTotal > 0 ? (
                                        <DonutChart
                                            data={dashboardData.pieGraphGroups.labels.map((label, idx) => ({
                                                label,
                                                value: dashboardData.pieGraphGroups.data[idx],
                                                color: CHART_COLORS[idx % CHART_COLORS.length],
                                            }))}
                                            size={160}
                                            innerRadius={46}
                                        />
                                    ) : (
                                        <EmptyChartState
                                            icon={Layers}
                                            title="No groups yet"
                                            subtitle="Group assignments will appear once created"
                                        />
                                    )}
                                </div>

                                <div className="mt-3 pt-3 border-t border-blue-100 space-y-0.5">
                                    {dashboardData.pieGraphGroups.labels.length > 0 ? (
                                        dashboardData.pieGraphGroups.labels.map((label, idx) => {
                                            const val = dashboardData.pieGraphGroups.data[idx];
                                            const color = CHART_COLORS[idx % CHART_COLORS.length];
                                            return (
                                                <LegendRow
                                                    key={label}
                                                    color={color}
                                                    label={label}
                                                    value={val}
                                                    total={groupDistTotal}
                                                />
                                            );
                                        })
                                    ) : (
                                        <p className="text-[11px] text-blue-400 text-center py-2 italic">
                                            No group categories defined
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Line Graph — Proposals Submitted */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 border-t-4 border-t-blue-900 flex flex-col hover:shadow-lg transition-shadow duration-300">
                    {isLoading ? (
                        <>
                            <div className="flex items-start justify-between mb-2">
                                <div className="space-y-2">
                                    <SkeletonPulse className="h-4 w-40" />
                                    <SkeletonPulse className="h-3 w-32" />
                                </div>
                                <SkeletonPulse className="h-3 w-40" />
                            </div>
                            <div className="flex-1">
                                <LineGraphSkeleton />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                        <span className="p-1.5 bg-blue-900 rounded-lg">
                                            <TrendingUp className="w-3.5 h-3.5 text-yellow-300" />
                                        </span>
                                        Proposals Submitted
                                    </h3>
                                    <p className="text-[11px] text-blue-500 font-normal mt-0.5">
                                        12-month submission trend
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-blue-600 font-normal flex-wrap">
                                    <span className="flex items-center gap-1.5">
                                        <span className="text-blue-500">Peak:</span>
                                        <span className="font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                            {peakLabel}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1.5 font-bold text-blue-900 bg-yellow-300 px-2.5 py-1 rounded-full shadow-sm">
                                        {peakProposals} Proposal{peakProposals !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 min-h-[200px]">
                                {dashboardData.lineGraph.data.length > 0 ? (
                                    <LineGraph
                                        data={dashboardData.lineGraph.data}
                                        labels={dashboardData.lineGraph.labels}
                                        label={dashboardData.lineGraph.label}
                                    />
                                ) : (
                                    <EmptyChartState
                                        icon={TrendingUp}
                                        title="No submission history"
                                        subtitle="Trend data will appear once proposals are logged"
                                    />
                                )}
                            </div>

                            {dashboardData.lineGraph.data.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-blue-100 text-[10px] text-blue-500 flex justify-between items-center">
                                    <span>Hover points to inspect values</span>
                                    <span className="font-semibold text-blue-900">
                                        {dashboardData.lineGraph.data.reduce((s, v) => s + (v || 0), 0)} total in period
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}