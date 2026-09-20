import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
    Users,
    FileText,
    BookOpen,
    Layers,
    PieChart as PieIcon,
    TrendingUp,
    CheckCircle2,
    BookMarked
} from 'lucide-react';

import { StatisticalContext } from '../../contexts/StatisticalContext/StatisticalContext';
import { AuthContext } from '../../contexts/AuthContext';

const CHART_COLORS = [
    '#1E3A8A', // Blue 900
    '#FBBF24', // Yellow 400
    '#3B82F6', // Blue 500
    '#FCD34D', // Yellow 300
    '#1E40AF', // Blue 800
    '#F59E0B', // Amber 500
];

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
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const StatCardSkeleton = () => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-between">
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

const DonutChartSkeleton = ({ size = 120 }) => (
    <div className="relative flex items-center justify-center" style={{ height: size }}>
        <div
            className="rounded-full border-[14px] border-slate-200 animate-pulse"
            style={{ width: size, height: size }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <SkeletonPulse className="h-4 w-7" />
            <SkeletonPulse className="h-2 w-8" />
        </div>
    </div>
);

const PieCardSkeleton = () => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex flex-col">
        <div className="mb-2 space-y-2">
            <SkeletonPulse className="h-4 w-32" />
            <SkeletonPulse className="h-3 w-24" />
        </div>
        <div className="flex-1 flex items-center justify-center py-1">
            <DonutChartSkeleton size={120} />
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
        <div className="relative w-full" style={{ height: 160 }}>
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
   CHART COMPONENTS
   ============================ */

const DonutChart = ({ data = [], size = 180, innerRadius = 48 }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
    if (total === 0) return (
        <div className="flex flex-col items-center justify-center text-slate-400 text-xs font-medium" style={{ height: size }}>
            No data available
        </div>
    );

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
            
            {/* Center label with hover info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {hoveredSlice ? (
                    <>
                        <span 
                            className="text-sm font-semibold transition-all duration-300 leading-none"
                            style={{ color: hoveredSlice.color }}
                        >
                            {hoveredSlice.value}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-medium text-center px-1 leading-tight mt-0.5">
                            {hoveredSlice.label}
                        </span>
                        <span className="text-[9px] font-medium text-slate-500 mt-0.5">
                            {hoveredSlice.percent}%
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-sm font-semibold text-blue-950 transition-all duration-300 leading-none">{total}</span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-medium mt-0.5">
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
    const height = 160;
    const padding = 25;
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

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                    <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines - THINNER */}
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
                                    stroke="#e2e8f0" 
                                    strokeDasharray="4 4" 
                                    strokeWidth="1"
                                />
                                <text 
                                    x={padding - 8} 
                                    y={y + 3} 
                                    fontSize="7.5" 
                                    fill="#94a3b8" 
                                    textAnchor="end"
                                    fontWeight="400"
                                >
                                    {val}
                                </text>
                            </g>
                        );
                    })}

                    {/* Area fill */}
                    {areaD && (
                        <path 
                            d={areaD} 
                            fill="url(#lineGrad)" 
                            className="transition-all duration-500"
                            style={{
                                opacity: hoveredPoint !== null ? 0.7 : 1,
                            }}
                        />
                    )}

                    {/* Line path - THINNER STROKE */}
                    {pathD && (
                        <path 
                            d={pathD} 
                            fill="none" 
                            stroke="#1E3A8A" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className="transition-all duration-500"
                            style={{
                                filter: hoveredPoint !== null ? 'drop-shadow(0 2px 4px rgba(30, 58, 138, 0.25))' : 'none',
                            }}
                        />
                    )}

                    {/* Data points with hover effect */}
                    {points.map((pt, i) => {
                        const isHovered = hoveredPoint === i;
                        return (
                            <g 
                                key={i} 
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPoint(i)}
                                onMouseLeave={() => setHoveredPoint(null)}
                            >
                                {/* Invisible larger hit area */}
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="14"
                                    fill="transparent"
                                />
                                
                                {/* Outer glow ring on hover */}
                                {isHovered && (
                                    <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r="9"
                                        fill="none"
                                        stroke="#3B82F6"
                                        strokeWidth="1.5"
                                        opacity="0.5"
                                        className="animate-ping"
                                        style={{ animationDuration: '1.5s' }}
                                    />
                                )}
                                
                                {/* Main point - SMALLER & THINNER */}
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={isHovered ? 4.5 : 3}
                                    fill="#FBBF24"
                                    stroke={isHovered ? '#3B82F6' : '#1E3A8A'}
                                    strokeWidth={isHovered ? 2 : 1.5}
                                    className="transition-all duration-300 ease-out"
                                    style={{
                                        filter: isHovered ? 'drop-shadow(0 2px 4px rgba(251, 191, 36, 0.5))' : 'none',
                                    }}
                                />
                                
                                {/* Tooltip on hover */}
                                {isHovered && (
                                    <g>
                                        {/* Tooltip background */}
                                        <rect
                                            x={pt.x - 38}
                                            y={pt.y - 36}
                                            width="76"
                                            height="24"
                                            rx="5"
                                            fill="#1E3A8A"
                                            className="drop-shadow-lg"
                                            style={{
                                                animation: 'fadeIn 0.2s ease-out',
                                            }}
                                        />
                                        {/* Tooltip arrow */}
                                        <polygon
                                            points={`${pt.x - 5},${pt.y - 12} ${pt.x + 5},${pt.y - 12} ${pt.x},${pt.y - 7}`}
                                            fill="#1E3A8A"
                                        />
                                        {/* Tooltip text - THINNER */}
                                        <text
                                            x={pt.x}
                                            y={pt.y - 24}
                                            textAnchor="middle"
                                            fill="#FBBF24"
                                            fontSize="7.5"
                                            fontWeight="600"
                                        >
                                            {pt.val} {label}
                                        </text>
                                        <text
                                            x={pt.x}
                                            y={pt.y - 16}
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            fontSize="6"
                                            fontWeight="400"
                                            opacity="0.85"
                                        >
                                            {pt.label}
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    {/* Vertical hover guide line - THINNER */}
                    {hoveredPoint !== null && (
                        <line
                            x1={points[hoveredPoint].x}
                            y1={padding}
                            x2={points[hoveredPoint].x}
                            y2={height - padding}
                            stroke="#3B82F6"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                            opacity="0.4"
                            className="transition-all duration-200"
                        />
                    )}
                </svg>
            </div>

            {/* X-axis labels - THINNER */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 w-full text-[9px] text-slate-500 font-medium text-center mt-2 border-t border-slate-100 pt-2">
                {labels.map((lbl, idx) => {
                    const isHovered = hoveredPoint === idx;
                    return (
                        <div 
                            key={idx} 
                            className={`truncate transition-all duration-200 cursor-default ${
                                isHovered ? 'text-blue-900 font-semibold scale-105' : ''
                            }`}
                            title={lbl}
                            onMouseEnter={() => setHoveredPoint(idx)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        >
                            {lbl.split(' ')[0]} <span className={`text-[8px] font-normal ${isHovered ? 'text-blue-600' : 'text-slate-400'}`}>{lbl.split(' ')[1]}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// StatCard - THINNER borders, cleaner look
const StatCard = ({ label, value, sublabel, icon: Icon, iconColor }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-between hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
            <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-100 group-hover:scale-110 group-hover:bg-blue-100 group-hover:border-blue-200 transition-all duration-300">
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
        </div>
        <div>
            <div className="text-lg font-semibold text-blue-950 group-hover:text-blue-800 transition-colors duration-300 leading-tight">{value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-normal">{sublabel}</div>
        </div>
    </div>
);

export default function App() {
    const { Admindata } = useContext(StatisticalContext);
    const { role } = useContext(AuthContext);

    const [isLoading, setIsLoading] = useState(true);

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

    // Use context role, fallback to 'User' if none provided
    const displayRole = formatRole(role) || 'User';

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {/* Welcome Banner */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                    {isLoading ? (
                        <div className="w-full space-y-3">
                            <div className="flex items-center gap-2">
                                <SkeletonPulse className="h-6 w-28 rounded-full" />
                                <SkeletonPulse className="h-4 w-40" />
                            </div>
                            <SkeletonPulse className="h-8 w-72" />
                            <SkeletonPulse className="h-4 w-96 max-w-full" />
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-3 py-1 bg-blue-50 text-blue-900 text-xs font-semibold rounded-full uppercase tracking-wider border border-blue-200">
                                    Active Session
                                </span>
                                <span className="text-slate-400 text-sm font-normal">• BiPSU Faculty Portal</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-blue-950 tracking-tight">
                                BiPSU {displayRole} Dashboard
                            </h2>
                            <p className="text-slate-500 text-sm mt-1 font-normal">Manage assigned groups, reviews, and institutional project timelines.</p>
                        </div>
                    )}
                </div>

                {/* Statistical Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {isLoading ? (
                        [...Array(6)].map((_, i) => <StatCardSkeleton key={i} />)
                    ) : (
                        <>
                            <StatCard label="Users" value={stats.totalUsers} sublabel="System users" icon={Users} iconColor="text-blue-900" />
                            <StatCard label="Groups" value={stats.totalGroups} sublabel="Total groups" icon={Layers} iconColor="text-blue-800" />
                            <StatCard label="Proposals" value={stats.totalProposals} sublabel="Submitted total" icon={FileText} iconColor="text-blue-900" />
                            <StatCard label="Subjects" value={stats.totalSubjects} sublabel="Total subjects" icon={BookMarked} iconColor="text-blue-700" />
                            <StatCard label="Sections" value={stats.totalSections} sublabel="Total sections" icon={BookOpen} iconColor="text-amber-600" />
                            <StatCard label="Ready Defense" value={stats.readyForDefenseProposals} sublabel="Cleared status" icon={CheckCircle2} iconColor="text-emerald-600" />
                        </>
                    )}
                </div>

                {/* Row 1: Two Pie Graphs side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isLoading ? (
                        <>
                            <PieCardSkeleton />
                            <PieCardSkeleton />
                        </>
                    ) : (
                        <>
                            {/* Proposal Status Distribution */}
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-blue-950 flex items-center gap-2">
                                        <PieIcon className="w-4 h-4 text-blue-900" /> Proposal Status
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-normal">By lifecycle status</p>
                                </div>

                                <div className="flex-1 flex items-center justify-center py-1">
                                    <DonutChart
                                        data={dashboardData.pieGraph.labels.map((label, idx) => ({
                                            label,
                                            value: dashboardData.pieGraph.data[idx],
                                            color: CHART_COLORS[idx % CHART_COLORS.length]
                                        }))}
                                        size={120}
                                        innerRadius={34}
                                    />
                                </div>

                                <div className="mt-2 space-y-1">
                                    {dashboardData.pieGraph.labels.map((label, idx) => {
                                        const val = dashboardData.pieGraph.data[idx];
                                        const color = CHART_COLORS[idx % CHART_COLORS.length];
                                        return (
                                            <div key={label} className="flex items-center justify-between text-[11px] hover:bg-slate-50 rounded px-1.5 py-0.5 transition-colors duration-200">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                                                    <span className="text-slate-700 font-normal">{label}</span>
                                                </div>
                                                <span className="font-semibold text-slate-900">{val}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Group Distribution */}
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-blue-950 flex items-center gap-2">
                                        <PieIcon className="w-4 h-4 text-blue-900" /> Group Distribution
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-normal">Members across units</p>
                                </div>

                                <div className="flex-1 flex items-center justify-center py-1">
                                    <DonutChart
                                        data={dashboardData.pieGraphGroups.labels.map((label, idx) => ({
                                            label,
                                            value: dashboardData.pieGraphGroups.data[idx],
                                            color: CHART_COLORS[idx % CHART_COLORS.length]
                                        }))}
                                        size={120}
                                        innerRadius={34}
                                    />
                                </div>

                                <div className="mt-2 space-y-1">
                                    {dashboardData.pieGraphGroups.labels.map((label, idx) => {
                                        const val = dashboardData.pieGraphGroups.data[idx];
                                        const color = CHART_COLORS[idx % CHART_COLORS.length];
                                        return (
                                            <div key={label} className="flex items-center justify-between text-[11px] hover:bg-slate-50 rounded px-1.5 py-0.5 transition-colors duration-200">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                                                    <span className="text-slate-700 font-normal">{label}</span>
                                                </div>
                                                <span className="font-semibold text-slate-900">{val}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Row 2: Proposals Submitted Line Graph */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
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
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="text-sm font-semibold text-blue-950 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-blue-900" /> Proposals Submitted
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-normal">12-month submission trend</p>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-3 font-normal">
                                    <span>Peak: <span className="font-medium text-slate-700">Sep 2026</span></span>
                                    <span className="font-semibold text-blue-900">
                                        {Math.max(...(dashboardData.lineGraph.data.length ? dashboardData.lineGraph.data : [0]))} Proposal
                                        {Math.max(...(dashboardData.lineGraph.data.length ? dashboardData.lineGraph.data : [0])) !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1">
                                <LineGraph
                                    data={dashboardData.lineGraph.data}
                                    labels={dashboardData.lineGraph.labels}
                                    label={dashboardData.lineGraph.label}
                                />
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}