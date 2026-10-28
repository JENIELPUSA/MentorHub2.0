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
    TrendingUp,
    BarChart as BarChartIcon,
    Link as LinkIcon,
    CheckCircle,
    XCircle,
    Activity,
} from 'lucide-react';
import { ProposedTitleContext } from '../../contexts/ProposedTitleContext/ProposedTitleContext';
import { AuthContext } from '../../contexts/AuthContext';
import { GroupContext } from '../../contexts/GroupNameContext/GroupNameContext';
import { UserDisplayContext } from '../../contexts/UserManagementContext/UserManagementContext';

import UserDashboardBanner from './components/UserDashboardBanner';
import ClassShareLink from './components/ClassShareLink';
import FormatDetailsCard from './components/FormatDetailsCard';
import { StatisticalContext } from '../../contexts/StatisticalContext/StatisticalContext';

// ============================
// HELPERS
// ============================
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

const isWithinLast7Days = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const now = new Date();
    const diffMs = now - date;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return diffMs >= 0 && diffMs <= sevenDaysMs;
};

const toLocalDateKey = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const getAdviserStatusDisplay = (status) => {
    const statusConfigs = {
        approved: {
            bg: 'bg-blue-100',
            text: 'text-blue-800',
            icon: BadgeCheck,
            label: 'Approved ✓',
            description: 'Adviser has been approved',
        },
        pending: {
            bg: 'bg-yellow-100',
            text: 'text-yellow-800',
            icon: Hourglass,
            label: 'Waiting for Approval ⏳',
            description: 'Request is pending approval',
        },
        rejected: {
            bg: 'bg-rose-100',
            text: 'text-rose-800',
            icon: X,
            label: 'Rejected ✗',
            description: 'Request has been rejected',
        },
    };
    const config = statusConfigs[status] || statusConfigs.pending;
    const Icon = config.icon;
    return {
        badge: (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} border-current/20`}>
                <Icon className="w-3.5 h-3.5" />
                {config.label}
            </span>
        ),
        description: config.description,
        isPending: status === 'pending',
        isApproved: status === 'approved',
        isRejected: status === 'rejected',
    };
};

// ============================
// PIE CHART — NAVY/GOLD THEME
// ============================
const PieChart = ({ data, size = 200, thickness = 44, title, subtitle }) => {
    const hasData = Array.isArray(data) && data.length > 0;
    const total = hasData ? data.reduce((sum, d) => sum + d.value, 0) : 0;
    const safeTotal = total || 1;
    const radius = (size - thickness) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    const palette = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#fbbf24', '#fde68a', '#fef3c7'];

    let cumulativePercent = 0;
    const segments = hasData
        ? data.map((d, i) => {
            const percent = d.value / safeTotal;
            const dashArray = `${percent * circumference} ${circumference}`;
            const dashOffset = -cumulativePercent * circumference;
            cumulativePercent += percent;
            return {
                ...d,
                percent,
                dashArray,
                dashOffset,
                key: i,
                color: d.color || palette[i % palette.length],
            };
        })
        : [];

    return (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-md shadow-blue-900/10 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 shrink-0">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <PieChartIcon className="w-4 h-4 text-blue-900" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-blue-950">
                        {title || 'Chart'}
                    </h3>
                    {subtitle && (
                        <p className="text-[10px] text-blue-600/80">{subtitle}</p>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 min-h-0">
                <div className="relative shrink-0" style={{ width: size, height: size }}>
                    <svg width={size} height={size} className="-rotate-90">
                        <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor"
                            strokeWidth={thickness} className="text-blue-50" />
                        {segments.map((seg) => (
                            <circle key={seg.key} cx={center} cy={center} r={radius} fill="none"
                                stroke={seg.color} strokeWidth={thickness} strokeDasharray={seg.dashArray}
                                strokeDashoffset={seg.dashOffset} strokeLinecap="butt"
                                className="transition-all duration-700 ease-out" />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-extrabold text-blue-950">{total}</span>
                        <span className="text-[10px] uppercase tracking-wider text-blue-600 font-semibold">
                            Total
                        </span>
                    </div>
                </div>

                <div className="flex-1 w-full space-y-2 overflow-y-auto min-h-0">
                    {!hasData ? (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <PieChartIcon className="w-8 h-8 text-blue-200 mb-2" />
                            <p className="text-xs font-semibold text-blue-700">No data yet</p>
                        </div>
                    ) : (
                        segments.map((seg) => (
                            <div key={seg.key} className="flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
                                    <span className="text-blue-950 truncate font-medium">{seg.label}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-bold text-blue-950">{seg.value}</span>
                                    <span className="text-rose-600 text-[10px] w-10 text-right font-semibold">
                                        {Math.round(seg.percent * 100)}%
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================
// MINI STAT — NAVY/GOLD THEME
// ============================
const MiniStat = ({ label, value, sub, tone = 'blue', icon: Icon }) => {
    const tones = {
        blue: 'bg-blue-50 border-blue-200 text-blue-800',
        sky: 'bg-blue-50 border-blue-300 text-blue-800',
        yellow: 'bg-yellow-50 border-yellow-300 text-yellow-800',
        white: 'bg-white border-blue-200 text-blue-800',
        red: 'bg-rose-50 border-rose-200 text-rose-800',
    };
    return (
        <div className={`rounded-xl border p-3 ${tones[tone]}`}>
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
                {Icon && <Icon className="w-3.5 h-3.5 opacity-70" />}
            </div>
            <p className="text-xl font-extrabold mt-1">{value ?? 0}</p>
            {sub && <p className="text-[10px] opacity-70 mt-0.5">{sub}</p>}
        </div>
    );
};

// ============================
// STATISTICAL: REFERRED USERS CARD — NAVY/GOLD THEME
// ============================
const StatisticalReferredUsersCard = ({
    userCount,
    referralCode,
    sectionName,
    subjectTitle,
    status,
    updatedAt,
    onCopyReferralCode,
    onViewQR,
    statisticsCards,
    statisticsLoading,
    statisticsError,
    onRefreshStatistics,
}) => {
    const statusBadge = () => {
        if (status === 'success')
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    <CheckCircle2 className="w-3 h-3" /> success
                </span>
            );
        if (status === 'loading')
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <Clock className="w-3 h-3 animate-pulse" /> loading
                </span>
            );
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                <AlertCircle className="w-3 h-3" /> error
            </span>
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 p-5 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-4 h-4 text-blue-900" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-blue-950">
                            Statistical: Referred Users
                        </h3>
                        <p className="text-[10px] text-blue-600/80">
                            Referral summary at statistics overview
                        </p>
                    </div>
                </div>
                <button
                    onClick={onRefreshStatistics}
                    disabled={statisticsLoading}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-900 hover:bg-blue-950 text-white disabled:opacity-50 flex items-center gap-1 shadow-sm transition"
                >
                    {statisticsLoading ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</>
                    ) : (
                        <><RotateCcw className="w-3.5 h-3.5" /> Refresh</>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="rounded-xl border p-3 bg-blue-50 border-blue-200 text-blue-800">
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                        Active students via referral
                    </p>
                    <p className="text-xl font-extrabold mt-1">{userCount ?? 0}</p>
                </div>

                <div className="rounded-xl border p-3 bg-white border-blue-200">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">Referral Code</p>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="font-mono font-bold text-sm text-blue-950">{referralCode || 'N/A'}</span>
                        <button onClick={onCopyReferralCode} title="Copy code" className="p-1 rounded hover:bg-yellow-100 text-blue-700 transition">
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <button onClick={onViewQR} className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-yellow-700 hover:text-yellow-800 hover:underline">
                        <QrCode className="w-3 h-3" /> View QR
                    </button>
                </div>

                <div className="rounded-xl border p-3 bg-white border-blue-200">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">Class Section</p>
                    <p className="text-sm font-bold mt-1 text-blue-950 truncate">{sectionName || 'N/A'}</p>
                </div>

                <div className="rounded-xl border p-3 bg-white border-blue-200 col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">Subject Code Title</p>
                    <p className="text-sm font-bold mt-1 text-blue-950 truncate">{subjectTitle || 'N/A'}</p>
                </div>

                <div className="rounded-xl border p-3 bg-white border-blue-200">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">Response Status</p>
                    <div className="mt-1">{statusBadge()}</div>
                    <p className="text-[9px] text-blue-400 mt-1">Updated: {updatedAt}</p>
                </div>
            </div>

            {statisticsCards && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-md">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-900" />
                        </div>
                        <h4 className="text-xs font-bold text-blue-950">
                            Your Statistics Overview
                        </h4>
                    </div>

                    {statisticsError && (
                        <div className="p-2 text-[11px] bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {statisticsError}
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <MiniStat label="Total" value={statisticsCards.total} tone="blue" icon={FileText} />
                        <MiniStat label="Approved" value={statisticsCards.approved} tone="sky" icon={CheckCircle2} />
                        <MiniStat label="Pending" value={statisticsCards.pending} tone="yellow" icon={Hourglass} />
                        <MiniStat label="Rejected" value={statisticsCards.rejected} tone="red" icon={XCircle} />
                        <MiniStat label="For Revision" value={statisticsCards.forRevision} tone="white" icon={PenSquare} />
                        <MiniStat label="Approval Rate" value={`${statisticsCards.approvalRate}%`} tone="blue" icon={TrendingUp} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <MiniStat
                            label="Total Comments"
                            value={statisticsCards.totalComments}
                            tone="blue"
                            icon={MessageSquare}
                        />
                        <MiniStat
                            label="Resolution Rate"
                            value={`${statisticsCards.resolutionRate}%`}
                            sub="Resolved / Total"
                            tone="red"
                            icon={CheckCircle}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================
// COMMENTS LIST CARD — NAVY/GOLD THEME
// ============================
const CommentsListCard = ({ comments = [] }) => {
    const getInitials = (author) => {
        const f = author?.first_name?.[0] || '';
        const l = author?.last_name?.[0] || '';
        return (f + l).toUpperCase() || '?';
    };

    const getSeverityStyle = (sev) =>
    ({
        info: 'bg-blue-100 text-blue-800 border-blue-200',
        minor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        major: 'bg-yellow-200 text-yellow-900 border-yellow-300',
        critical: 'bg-rose-100 text-rose-800 border-rose-200',
    }[sev] ||
        'bg-slate-100 text-slate-700 border-slate-200');

    const newCount = comments.filter((c) => isWithinLast7Days(c.createdAt)).length;

    return (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-md shadow-blue-900/10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <MessageSquare className="w-4 h-4 text-blue-900" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-blue-950">Recent Comments</h3>
                        <p className="text-[10px] text-blue-600/80">
                            Mga comments na naka-link sa iyong mga URL tracking
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {newCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-rose-500 text-white shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            {newCount} new
                        </span>
                    )}
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {comments.length}
                    </span>
                </div>
            </div>

            {comments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center min-h-[280px]">
                    <MessageSquare className="w-10 h-10 text-blue-200 mb-2" />
                    <p className="text-xs font-semibold text-blue-800">Wala pang comments</p>
                    <p className="text-[10px] text-blue-400">
                        Mag-appear dito kapag may nag-comment sa mga URL tracking.
                    </p>
                </div>
            ) : (
                <ul className="flex-1 overflow-y-auto divide-y divide-blue-100 pr-1 min-h-0">
                    {comments.map((c) => {
                        const isNew = isWithinLast7Days(c.createdAt);

                        return (
                            <li key={c._id} className="py-3 flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-900 text-yellow-300 font-bold text-xs flex items-center justify-center shrink-0">
                                    {getInitials(c.author)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-xs font-bold text-blue-950">
                                            {c.author
                                                ? `${c.author.first_name || ''} ${c.author.last_name || ''}`.trim() || 'Unknown'
                                                : 'Unknown User'}
                                        </span>

                                        {isNew && (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-rose-500 text-white shadow-sm animate-pulse">
                                                <Sparkles className="w-2.5 h-2.5" />
                                                New
                                            </span>
                                        )}

                                        {c.author?.role && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded bg-blue-100 text-blue-800 border border-blue-200">
                                                <Shield className="w-2.5 h-2.5" />
                                                {c.author.role}
                                            </span>
                                        )}
                                        {c.author?.email && (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-500">
                                                <Mail className="w-2.5 h-2.5" />
                                                {c.author.email}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs text-blue-900 mt-1 break-words">
                                        {c.text || <em className="text-blue-400">(no text)</em>}
                                    </p>

                                    <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                                        <div className="flex items-center gap-1.5 text-[10px] text-blue-600">
                                            <FileText className="w-3 h-3 shrink-0" />
                                            <span className="font-semibold text-blue-950 truncate">
                                                {c.proposedTitle?.title || c.title || 'Untitled'}
                                            </span>
                                            {c.proposedTitle?.status && (
                                                <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-800 uppercase border border-blue-200">
                                                    {c.proposedTitle.status}
                                                </span>
                                            )}
                                        </div>

                                        {c.proposedTitle?.description && (
                                            <p className="mt-1 ml-4 text-[10px] text-blue-600 italic line-clamp-2">
                                                {c.proposedTitle.description}
                                            </p>
                                        )}

                                        {c.urlTracking && (
                                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-blue-600">
                                                <LinkIcon className="w-3 h-3 shrink-0" />
                                                <span className="font-medium truncate">
                                                    {c.urlTracking.label || c.urlTracking.url || 'Untitled chapter'}
                                                </span>
                                                {c.urlTracking.isCompleted ? (
                                                    <span className="inline-flex items-center gap-0.5 text-blue-700 text-[9px] font-semibold">
                                                        <CheckCircle className="w-2.5 h-2.5" /> Completed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-0.5 text-rose-600 text-[9px] font-semibold">
                                                        <Clock className="w-2.5 h-2.5" /> In progress
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                                            {c.adviser?.fullName && (
                                                <span className="inline-flex items-center gap-1 text-blue-600">
                                                    <UserCog className="w-2.5 h-2.5" />
                                                    <span className="font-semibold">Adviser:</span> {c.adviser.fullName}
                                                </span>
                                            )}
                                            {c.coAdviser?.fullName && (
                                                <span className="inline-flex items-center gap-1 text-blue-500">
                                                    <UserCircle className="w-2.5 h-2.5" />
                                                    <span className="font-semibold">Co-Adviser:</span> {c.coAdviser.fullName}
                                                </span>
                                            )}
                                            {!c.adviser?.fullName && !c.coAdviser?.fullName && (
                                                <span className="text-blue-400 italic text-[9px]">
                                                    No adviser assigned
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                        {c.severity && (
                                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${getSeverityStyle(c.severity)}`}>
                                                {c.severity}
                                            </span>
                                        )}
                                        {c.annotationType && (
                                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                                {c.annotationType}
                                            </span>
                                        )}
                                        {c.isResolved ? (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-blue-700">
                                                <CheckCircle className="w-2.5 h-2.5" /> Resolved
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-rose-600">
                                                <AlertCircle className="w-2.5 h-2.5" /> Unresolved
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-0.5 text-[9px] text-blue-500">
                                            <Calendar className="w-2.5 h-2.5" />
                                            {formatDate(c.createdAt)}
                                        </span>
                                        {c.groupName && (
                                            <span className="text-[9px] text-blue-400">
                                                • {c.groupName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

// ============================
// TOP COMMENTED URLS CARD — NAVY/GOLD THEME
// ============================
const TopCommentedUrlsCard = ({ rows = [] }) => {
    if (!rows || rows.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-md shadow-blue-900/10 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3 shrink-0">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <LinkIcon className="w-4 h-4 text-blue-900" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-blue-950">
                        Top Commented URLs
                    </h3>
                    <p className="text-[10px] text-blue-600/80">
                        Mga URL na may pinakamaraming comments
                    </p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
                <table className="min-w-full text-xs">
                    <thead className="sticky top-0 bg-white z-10">
                        <tr className="text-left text-blue-700 border-b border-blue-200">
                            <th className="py-2 pr-3">Title</th>
                            <th className="py-2 pr-3">URL</th>
                            <th className="py-2 pr-3">Group</th>
                            <th className="py-2 pr-3 text-right">Comments</th>
                            <th className="py-2 pr-3 text-right">Unresolved</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr
                                key={String(row.urlId)}
                                className="border-b border-blue-100 last:border-0 hover:bg-yellow-50 transition"
                            >
                                <td className="py-2 pr-3 truncate max-w-[180px] text-blue-950">{row.title}</td>
                                <td className="py-2 pr-3 truncate max-w-[220px]">
                                    <a
                                        href={row.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-700 hover:text-blue-900 hover:underline font-medium"
                                    >
                                        {row.urlLabel || row.url}
                                    </a>
                                </td>
                                <td className="py-2 pr-3 text-blue-800">{row.groupName}</td>
                                <td className="py-2 pr-3 text-right font-semibold text-blue-950">{row.commentCount}</td>
                                <td className="py-2 pr-3 text-right text-rose-600 font-semibold">
                                    {row.unresolvedCount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ============================
// ACTIVITY HEATMAP — NAVY/GOLD THEME (yellow default)
// ============================
const ActivityHeatmap = ({
    activityData = [],
    comments = [],
    loading = false,
    error = '',
    title = 'Activity Graph',
    subtitle = 'Bawat square = araw na may aktibidad',
    color = 'yellow',
    unit = 'comment',
}) => {
    const today = useMemo(() => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return t;
    }, []);

    const countsByDate = useMemo(() => {
        const map = {};

        if (Array.isArray(activityData) && activityData.length > 0) {
            activityData.forEach((d) => {
                if (!d?.date) return;
                const key = toLocalDateKey(d.date);
                if (!key) return;
                map[key] = (map[key] || 0) + (d.count || 0);
            });
            return map;
        }

        comments.forEach((c) => {
            if (!c.createdAt) return;
            const key = toLocalDateKey(c.createdAt);
            if (!key) return;
            map[key] = (map[key] || 0) + 1;
        });
        return map;
    }, [activityData, comments]);

    const weeks = useMemo(() => {
        const result = [];
        const currentDay = today.getDay();
        const startOfCurrentWeek = new Date(today);
        startOfCurrentWeek.setDate(today.getDate() - currentDay);

        const startDate = new Date(startOfCurrentWeek);
        startDate.setDate(startOfCurrentWeek.getDate() - 51 * 7);

        for (let w = 0; w < 52; w++) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + w * 7 + d);
                date.setHours(0, 0, 0, 0);
                const key = toLocalDateKey(date);
                week.push({
                    date,
                    key,
                    count: countsByDate[key] || 0,
                    isFuture: date > today,
                });
            }
            result.push(week);
        }
        return result;
    }, [countsByDate, today]);

    const getLevel = (count) => {
        if (!count || count === 0) return 0;
        if (count === 1) return 1;
        if (count <= 3) return 2;
        if (count <= 6) return 3;
        return 4;
    };

    const levelColors = useMemo(() => {
        if (color === 'blue') {
            return {
                0: 'bg-blue-50',
                1: 'bg-blue-200',
                2: 'bg-blue-400',
                3: 'bg-blue-600',
                4: 'bg-blue-900',
            };
        }
        if (color === 'purple') {
            return {
                0: 'bg-blue-50',
                1: 'bg-purple-200',
                2: 'bg-purple-400',
                3: 'bg-purple-600',
                4: 'bg-purple-800',
            };
        }
        if (color === 'yellow') {
            return {
                0: 'bg-blue-50',
                1: 'bg-yellow-100',
                2: 'bg-yellow-300',
                3: 'bg-yellow-400',
                4: 'bg-yellow-500',
            };
        }
        return {
            0: 'bg-blue-50',
            1: 'bg-emerald-200',
            2: 'bg-emerald-400',
            3: 'bg-emerald-600',
            4: 'bg-emerald-800',
        };
    }, [color]);

    const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''];

    const monthLabels = useMemo(() => {
        const labels = [];
        let lastMonth = -1;
        weeks.forEach((week, idx) => {
            const firstDay = week[0]?.date;
            if (!firstDay) return;
            const month = firstDay.getMonth();
            if (month !== lastMonth) {
                labels.push({
                    index: idx,
                    label: firstDay.toLocaleDateString('en-US', { month: 'short' }),
                });
                lastMonth = month;
            }
        });
        return labels;
    }, [weeks]);

    const totalCount = useMemo(
        () => Object.values(countsByDate).reduce((a, b) => a + b, 0),
        [countsByDate]
    );
    const uniqueDays = Object.keys(countsByDate).length;
    const newCount = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return Object.entries(countsByDate).reduce((sum, [key, count]) => {
            const d = new Date(key);
            return d >= sevenDaysAgo ? sum + count : sum;
        }, 0);
    }, [countsByDate]);

    const unitLabel = totalCount === 1 ? unit : `${unit}s`;

    return (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-md shadow-blue-900/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-4 h-4 text-blue-900" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-blue-950">{title}</h3>
                        <p className="text-[10px] text-blue-600/80">{subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                            {totalCount} total
                        </span>
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            {uniqueDays} days
                        </span>
                        {newCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full bg-rose-500 text-white font-bold shadow-sm">
                                <Sparkles className="w-2.5 h-2.5" />
                                {newCount} this week
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-blue-600">
                        <span>Less</span>
                        {[0, 1, 2, 3, 4].map((lvl) => (
                            <span
                                key={lvl}
                                className={`w-3 h-3 rounded-sm border border-blue-100 ${levelColors[lvl]}`}
                            />
                        ))}
                        <span>More</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-3 p-2 text-[11px] bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-900" />
                    <span className="ml-2 text-xs text-blue-600">Loading activity…</span>
                </div>
            ) : (
                <div className="overflow-x-auto pb-1">
                    <div className="inline-flex flex-col gap-1 min-w-max">
                        <div className="flex gap-1 ml-8">
                            {weeks.map((_, idx) => {
                                const label = monthLabels.find((m) => m.index === idx);
                                return (
                                    <div
                                        key={idx}
                                        className="w-3 text-[9px] text-blue-600 font-medium whitespace-nowrap"
                                    >
                                        {label ? label.label : ''}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-1">
                            <div className="flex flex-col gap-1 w-7">
                                {dayLabels.map((d, i) => (
                                    <div
                                        key={i}
                                        className="h-3 text-[9px] text-blue-600 font-medium leading-3"
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {weeks.map((week, wIdx) => (
                                <div key={wIdx} className="flex flex-col gap-1">
                                    {week.map((day) => {
                                        const count = day.count;
                                        const level = getLevel(count);
                                        const tooltip = count > 0
                                            ? `${count} ${count === 1 ? unit : `${unit}s`} on ${day.date.toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}`
                                            : `No ${unit}s on ${day.date.toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}`;

                                        return (
                                            <div
                                                key={day.key}
                                                title={tooltip}
                                                className={`w-3 h-3 rounded-sm border border-blue-100 ${day.isFuture ? 'bg-transparent border-transparent' : levelColors[level]
                                                    } hover:ring-2 hover:ring-yellow-400 transition cursor-pointer`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!loading && totalCount === 0 && (
                <p className="text-[10px] text-blue-400 mt-2 italic">
                    No {unitLabel} recorded yet.
                </p>
            )}
        </div>
    );
};

// ============================
// MAIN COMPONENT
// ============================
export default function UserDashboard() {
    const { authToken, referredBy, role, first_name, last_name } = useContext(AuthContext);
    const {
        FetchProposedTitles,
        statisticsCards,
        statisticsCharts,
        statisticsLoading,
        statisticsError,
        FetchStatistics,
        RefreshStatistics,
    } = useContext(ProposedTitleContext);

    useContext(StatisticalContext);

    console.log("first_name", last_name);

    const { advisers, advisersLoading } = useContext(UserDisplayContext);
    const { getGroupDetails, groupDetails, referralUrl, assignAdviserAndCoAdviser } = useContext(GroupContext);

    const [darkMode] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [selectedUserModal, setSelectedUserModal] = useState(null);

    const [showAdviserModal, setShowAdviserModal] = useState(false);
    const [adviserModalType, setAdviserModalType] = useState('adviser');
    const [selectedAdviserId, setSelectedAdviserId] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignError, setAssignError] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);

    const [heatmapMode, setHeatmapMode] = useState('comments');

    const [fileViewModal, setFileViewModal] = useState({
        open: false,
        url: '',
        title: '',
        fileName: '',
    });

    const isFetching = useRef(false);

    useEffect(() => {
        if (authToken) FetchProposedTitles(1, 10);
    }, [authToken]);

    useEffect(() => {
        if (authToken) FetchStatistics({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (groupDetails && groupDetails.group) setSelectedGroup(groupDetails.group);
    }, [groupDetails]);

    const displayData = useMemo(() => {
        if (groupDetails && groupDetails.group) {
            return {
                group: groupDetails.group,
                referredUsers: groupDetails.referredUsers || [],
                userCount: groupDetails.userCount || 0,
                status: groupDetails.status || 'success',
            };
        }
        return {
            group: {
                _id: '',
                name: 'Loading...',
                referralCode: 'N/A',
                section: { name: 'N/A', subject: { title: 'N/A', createdBy: 'N/A' } },
                memberCount: 0,
                members: [],
                createdAt: '',
                updatedAt: '',
            },
            referredUsers: [],
            userCount: 0,
            status: 'loading',
        };
    }, [groupDetails]);

    const commentsByTypeData = useMemo(() => {
        const raw = statisticsCharts?.commentsByType || [];
        const palette = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#fbbf24', '#fde68a', '#fef3c7'];
        return raw.map((d, i) => ({
            label: d.label,
            value: d.count ?? d.value ?? 0,
            color: palette[i % palette.length],
        }));
    }, [statisticsCharts]);

    const getAdviserFromGroup = useCallback(() => {
        const currentGroup = selectedGroup || displayData.group;
        let adviser = null;
        let coadviser = null;

        if (currentGroup.adviserId) {
            const adviserId = currentGroup.adviserId._id || currentGroup.adviserId;
            adviser = advisers?.find((a) => a._id === adviserId) || null;
            if (!adviser && currentGroup.adviserId._id) adviser = currentGroup.adviserId;
        }
        if (currentGroup.coadviserId) {
            const coadviserId = currentGroup.coadviserId._id || currentGroup.coadviserId;
            coadviser = advisers?.find((a) => a._id === coadviserId) || null;
            if (!coadviser && currentGroup.coadviserId._id) coadviser = currentGroup.coadviserId;
        }
        return { adviser, coadviser };
    }, [selectedGroup, displayData.group, advisers]);

    const getCurrentAdviserDisplay = useCallback(() => {
        const { adviser, coadviser } = getAdviserFromGroup();
        const currentGroup = selectedGroup || displayData.group;

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
                adviserStatus: currentGroup?.adviserStatus || 'pending',
            };
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
                coadviserStatus: currentGroup?.coadviserStatus || 'pending',
            };
        }
        return { adviserDisplay, coadviserDisplay };
    }, [getAdviserFromGroup, selectedGroup, displayData.group]);

    const triggerToast = (msg, type = 'success') => {
        setToastMessage({ msg, type });
        setTimeout(() => setToastMessage(null), 2800);
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        triggerToast(label || 'Copied to clipboard!');
    };

    const getFileNameFromUrl = (url) => {
        try {
            const parts = url.split('/');
            const lastPart = parts[parts.length - 1];
            return decodeURIComponent(lastPart.split('?')[0] || 'document.pdf');
        } catch {
            return 'document.pdf';
        }
    };

    const handleOpenAdviserModal = (type) => {
        setAdviserModalType(type);
        setShowAdviserModal(true);
        setSelectedAdviserId('');
        setAssignError('');

        const currentGroup = selectedGroup || displayData.group;
        setSelectedGroup(currentGroup);

        if (advisers && advisers.length > 0) {
            const available = advisers.filter((u) => {
                const isCurrentAdviser = currentGroup.adviserId?._id === u._id || currentGroup.adviserId === u._id;
                const isCurrentCoAdviser = currentGroup.coadviserId?._id === u._id || currentGroup.coadviserId === u._id;
                if (type === 'adviser') return !isCurrentAdviser && !isCurrentCoAdviser;
                return !isCurrentCoAdviser && !isCurrentAdviser;
            });
            setAvailableUsers(available);
            if (available.length === 0) {
                setAssignError(`No available ${type === 'adviser' ? 'advisers' : 'co-advisers'} to assign`);
            }
        } else {
            setAvailableUsers([]);
            if (!advisersLoading) setAssignError('No advisers or panelists available');
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
            const selectedUser = availableUsers.find((u) => u._id === selectedAdviserId);
            let adviserId = currentGroup.adviserId?._id || currentGroup.adviserId || null;
            let coadviserId = currentGroup.coadviserId?._id || currentGroup.coadviserId || null;

            if (adviserModalType === 'adviser') adviserId = selectedAdviserId;
            else coadviserId = selectedAdviserId;

            const result = await assignAdviserAndCoAdviser(currentGroup._id, adviserId, coadviserId);

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
                    coadviserStatus: adviserModalType === 'coadviser' ? 'pending' : currentGroup.coadviserStatus,
                };
                setSelectedGroup(updatedGroup);
                triggerToast(`Successfully assigned ${adviserModalType === 'adviser' ? 'Adviser' : 'Co-Adviser'}!`);
                handleCloseAdviserModal();
                if (referredBy) await getGroupDetails(referredBy);
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
        const currentGroup = selectedGroup || displayData.group;
        if (!currentGroup) {
            triggerToast('No group selected', 'error');
            return;
        }
        const confirmMessage = type === 'adviser'
            ? 'Are you sure you want to remove the Adviser?'
            : 'Are you sure you want to remove the Co-Adviser?';
        if (!window.confirm(confirmMessage)) return;

        try {
            let adviserId = currentGroup.adviserId?._id || currentGroup.adviserId || null;
            let coadviserId = currentGroup.coadviserId?._id || currentGroup.coadviserId || null;
            if (type === 'adviser') adviserId = null;
            else coadviserId = null;

            const result = await assignAdviserAndCoAdviser(currentGroup._id, adviserId, coadviserId);
            if (result.success) {
                const updatedGroup = {
                    ...currentGroup,
                    adviserId: adviserId ? currentGroup.adviserId : null,
                    coadviserId: coadviserId ? currentGroup.coadviserId : null,
                    adviserStatus: type === 'adviser' ? null : currentGroup.adviserStatus,
                    coadviserStatus: type === 'coadviser' ? null : currentGroup.coadviserStatus,
                };
                setSelectedGroup(updatedGroup);
                triggerToast(`Successfully removed ${type === 'adviser' ? 'Adviser' : 'Co-Adviser'}`);
                if (referredBy) await getGroupDetails(referredBy);
            } else {
                setAssignError(result.message || result.error || 'Failed to remove adviser');
            }
        } catch (error) {
            setAssignError(error.message || 'Failed to remove adviser');
        }
    };

    const renderAdviserStatusBadge = (status, type) => {
        const statusDisplay = getAdviserStatusDisplay(status);
        return (
            <div className="flex flex-col gap-0.5">
                {statusDisplay.badge}
                {statusDisplay.isPending && (
                    <p className="text-[10px] text-yellow-700">
                        ⚠️ This request is waiting for approval from the approver
                    </p>
                )}
                {statusDisplay.isApproved && (
                    <p className="text-[10px] text-blue-700">
                        ✅ {type === 'adviser' ? 'Adviser' : 'Co-adviser'} has been approved and can now manage the group
                    </p>
                )}
                {statusDisplay.isRejected && (
                    <p className="text-[10px] text-rose-700">
                        ❌ Request has been rejected. Please contact the approver.
                    </p>
                )}
            </div>
        );
    };

    const handleViewFormatFile = (url, title, fileName) => {
        if (!url) {
            triggerToast('File not found', 'error');
            return;
        }
        setFileViewModal({
            open: true,
            url: url,
            title: title || 'Format Document',
            fileName: fileName || 'document.pdf',
        });
    };

    const handleDownloadFormatFile = (url) => {
        if (!url) {
            triggerToast('File not found', 'error');
            return;
        }
        try {
            let fileUrl = url;
            if (fileUrl.includes('/image/upload/')) fileUrl = fileUrl.replace('/image/upload/', '/raw/upload/');
            if (fileUrl.includes('/upload/')) fileUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');

            const filename = getFileNameFromUrl(url);
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            triggerToast(`Downloading: ${filename}`);
        } catch {
            triggerToast('Failed to download file', 'error');
        }
    };

    const handleCopyReferralCode = () => {
        copyToClipboard(displayData.group.referralCode, 'Referral Code copied!');
    };

    const { adviserDisplay, coadviserDisplay } = getCurrentAdviserDisplay();

    const heatmapActivity = heatmapMode === 'comments'
        ? (statisticsCharts?.commentActivityByDate || [])
        : (statisticsCharts?.proposalActivityByDate || []);

    return (
        <div className="min-h-screen font-sans bg-gradient-to-b from-blue-100 via-blue-50 to-sky-50 text-blue-950 transition-colors duration-200">
            {/* TOAST */}
            {toastMessage && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl shadow-blue-900/20 transition-all duration-300 ${toastMessage.type === 'error'
                    ? 'bg-rose-600 text-white'
                    : 'bg-blue-900 text-white border-l-4 border-yellow-400'
                    }`}>
                    {toastMessage.type === 'error' ? (
                        <AlertCircle className="w-4 h-4" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                    )}
                    <span>{toastMessage.msg}</span>
                </div>
            )}

            {/* ADVISER MODAL */}
            {showAdviserModal && (
                <div
                    className="fixed inset-0 z-[1000] bg-blue-950/60 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) handleCloseAdviserModal();
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl shadow-blue-900/20 max-w-md w-full mx-4 p-6 border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <UserCog className="w-5 h-5 text-blue-900" />
                                </div>
                                <h3 className="text-lg font-bold text-blue-950">
                                    {adviserModalType === 'adviser' ? 'Assign Adviser' : 'Assign Co-Adviser'}
                                </h3>
                            </div>
                            <button
                                onClick={handleCloseAdviserModal}
                                className="p-1 text-blue-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-blue-600 mb-4">
                            {adviserModalType === 'adviser'
                                ? 'Select a main adviser to assign to this group. The request will need approval.'
                                : 'Select a co-adviser to assist the main adviser. The request will need approval.'}
                        </p>

                        <div className="mb-4 space-y-2">
                            {adviserDisplay.exists && (
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-100 rounded-lg">
                                            <UserCog className="w-4 h-4 text-blue-900" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-500 font-medium uppercase tracking-wider">Main Adviser</p>
                                            <p className="text-sm font-semibold text-blue-950">{adviserDisplay.name}</p>
                                            <div className="mt-1">{renderAdviserStatusBadge(adviserDisplay.status, 'adviser')}</div>
                                        </div>
                                    </div>
                                    {adviserDisplay.status !== 'pending' && (
                                        <button
                                            onClick={() => handleRemoveAdviser('adviser')}
                                            className="p-1.5 text-blue-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                            title="Remove Adviser"
                                        >
                                            <UserX className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {coadviserDisplay.exists && (
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-100 rounded-lg">
                                            <UserCircle className="w-4 h-4 text-blue-900" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-500 font-medium uppercase tracking-wider">Co-Adviser</p>
                                            <p className="text-sm font-semibold text-blue-950">{coadviserDisplay.name}</p>
                                            <div className="mt-1">{renderAdviserStatusBadge(coadviserDisplay.status, 'coadviser')}</div>
                                        </div>
                                    </div>
                                    {coadviserDisplay.status !== 'pending' && (
                                        <button
                                            onClick={() => handleRemoveAdviser('coadviser')}
                                            className="p-1.5 text-blue-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                            title="Remove Co-Adviser"
                                        >
                                            <UserX className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {assignError && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                                {assignError}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-blue-800 mb-1">
                                Select {adviserModalType === 'adviser' ? 'Adviser' : 'Co-Adviser'}
                            </label>
                            {advisersLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-900" />
                                    <span className="ml-2 text-sm text-blue-600">Loading advisers...</span>
                                </div>
                            ) : (
                                <div className="relative">
                                    <select
                                        value={selectedAdviserId}
                                        onChange={(e) => {
                                            setSelectedAdviserId(e.target.value);
                                            setAssignError('');
                                        }}
                                        className="w-full px-4 py-2.5 border border-blue-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none appearance-none bg-blue-50 text-blue-950"
                                    >
                                        <option value="">Select an adviser...</option>
                                        {availableUsers.length === 0 ? (
                                            <option value="" disabled>No available advisers</option>
                                        ) : (
                                            availableUsers.map((u) => (
                                                <option key={u._id} value={u._id}>
                                                    {u.first_name} {u.last_name}
                                                    {u.username ? ` (${u.username})` : ''}
                                                    {u.role ? ` - ${u.role}` : ''}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                                </div>
                            )}
                            {availableUsers.length === 0 && !advisersLoading && (
                                <p className="text-xs text-blue-500 mt-1">
                                    No advisers or panelists available to assign
                                </p>
                            )}
                        </div>

                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                            <p className="text-xs text-yellow-800 flex items-center gap-1.5">
                                <Hourglass className="w-4 h-4" />
                                <span>Once assigned, this request will need approval before it becomes active.</span>
                            </p>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={handleAssignAdviser}
                                disabled={isAssigning || !selectedAdviserId}
                                className="flex-1 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                            >
                                {isAssigning ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</>
                                ) : (
                                    <><UserPlus className="w-4 h-4" /> Assign {adviserModalType === 'adviser' ? 'Adviser' : 'Co-Adviser'}</>
                                )}
                            </button>
                            <button
                                onClick={handleCloseAdviserModal}
                                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-semibold rounded-xl transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT */}
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <UserDashboardBanner
                    first_name={first_name}
                    last_name={last_name}
                    role={role}
                    displayData={displayData}
                    adviserDisplay={adviserDisplay}
                    coadviserDisplay={coadviserDisplay}
                    onAssignAdviser={() => handleOpenAdviserModal('adviser')}
                    onAssignCoAdviser={() => handleOpenAdviserModal('coadviser')}
                    onProposeTitle={() =>
                        document.getElementById('proposed-title-section')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    advisers={advisers}
                    advisersLoading={advisersLoading}
                />

                <StatisticalReferredUsersCard
                    userCount={displayData.userCount}
                    referralCode={displayData.group.referralCode}
                    sectionName={displayData.group.section?.name || 'N/A'}
                    subjectTitle={displayData.group.section?.subject?.title || 'N/A'}
                    status={displayData.status}
                    updatedAt={formatDate(displayData.group.updatedAt)}
                    onCopyReferralCode={handleCopyReferralCode}
                    onViewQR={() => setShowQrModal(true)}
                    statisticsCards={statisticsCards}
                    statisticsLoading={statisticsLoading}
                    statisticsError={statisticsError}
                    onRefreshStatistics={() => RefreshStatistics()}
                />

                {/* ACTIVITY HEATMAP — NAVY/GOLD THEME */}
                {statisticsCards && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                                <Activity className="w-4 h-4 text-blue-900" />
                            </div>
                            <h3 className="text-sm font-bold text-blue-950 mr-2">
                                Activity Heatmap
                            </h3>
                            <button
                                type="button"
                                onClick={() => setHeatmapMode('comments')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                                    heatmapMode === 'comments'
                                        ? 'bg-yellow-400 text-blue-950 border-yellow-400 shadow-sm ring-2 ring-yellow-200'
                                        : 'bg-white text-blue-700 border-blue-200 hover:bg-yellow-50'
                                }`}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Comments
                            </button>
                            <button
                                type="button"
                                onClick={() => setHeatmapMode('proposals')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                                    heatmapMode === 'proposals'
                                        ? 'bg-blue-900 text-yellow-300 border-blue-900 shadow-sm ring-2 ring-yellow-300'
                                        : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Proposals
                            </button>
                        </div>

                        <ActivityHeatmap
                            activityData={heatmapActivity}
                            comments={statisticsCharts?.recentComments || []}
                            loading={statisticsLoading}
                            error={statisticsError}
                            title={
                                heatmapMode === 'comments'
                                    ? 'Comments Activity Graph'
                                    : 'Proposals Activity Graph'
                            }
                            subtitle={
                                heatmapMode === 'comments'
                                    ? 'Bawat square = araw na may comment (hover para sa details)'
                                    : 'Bawat square = araw na may proposal activity'
                            }
                            color={heatmapMode === 'comments' ? 'yellow' : 'blue'}
                            unit={heatmapMode === 'comments' ? 'comment' : 'proposal'}
                        />
                    </div>
                )}

                {/* LEFT + RIGHT LAYOUT */}
                {statisticsCards && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-6 h-[600px]">
                            {statisticsCharts && (
                                <div className="h-[280px] shrink-0">
                                    <PieChart
                                        data={commentsByTypeData}
                                        size={200}
                                        thickness={44}
                                        title="Comments by Type"
                                        subtitle="Distribution ng annotation types"
                                    />
                                </div>
                            )}

                            <div className="flex-1 min-h-0">
                                <TopCommentedUrlsCard rows={statisticsCharts?.commentsByUrl || []} />
                            </div>
                        </div>

                        <div className="h-[600px] min-h-0">
                            <CommentsListCard comments={statisticsCharts?.recentComments || []} />
                        </div>
                    </div>
                )}

                {/* TWO-COLUMN LAYOUT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <FormatDetailsCard
                        formatDetails={displayData.group.section?.subject?.formatDetails}
                        onViewFile={handleViewFormatFile}
                        onDownloadFile={handleDownloadFormatFile}
                    />

                    <ClassShareLink
                        referralUrl={referralUrl}
                        referralCode={displayData.group.referralCode}
                        onCopy={copyToClipboard}
                    />
                </div>
            </main>

            {/* FOOTER */}
            <footer className="mt-auto bg-blue-900 border-t-4 border-yellow-400 py-4 transition-colors">
                <div className="max-w-7xl mx-auto px-4 text-center text-xs text-blue-200">
                    Academic Group & Referral Management Dashboard &bull; Code: <strong className="text-yellow-300">{displayData.group.referralCode}</strong>
                </div>
            </footer>

            {/* QR MODAL */}
            {showQrModal && (
                <div className="fixed inset-0 z-50 bg-blue-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-blue-200 w-full max-w-sm p-6 shadow-2xl shadow-blue-900/30 text-center space-y-4">
                        <h3 className="font-bold text-blue-950">Referral Code QR</h3>
                        <p className="text-xs text-blue-600">
                            Scan to join section <strong>{displayData.group.section?.name || 'N/A'}</strong>
                        </p>
                        <div className="flex justify-center py-2">
                            <div className="p-3 bg-blue-50 border-2 border-yellow-400 rounded-2xl shadow-inner">
                                <QrCode className="w-40 h-40 text-blue-900" />
                            </div>
                        </div>
                        <button
                            onClick={() => setShowQrModal(false)}
                            className="w-full py-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-xl transition shadow-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* STUDENT DETAIL MODAL */}
            {selectedUserModal && (
                <div className="fixed inset-0 z-50 bg-blue-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-blue-200 w-full max-w-md p-6 shadow-2xl shadow-blue-900/30 space-y-4">
                        <div className="flex justify-between items-start border-b border-blue-100 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-900 text-yellow-300 font-bold flex items-center justify-center text-lg">
                                    {selectedUserModal.first_name?.[0] || '?'}{selectedUserModal.last_name?.[0] || '?'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-950 text-base">
                                        {`${selectedUserModal.first_name || ''} ${selectedUserModal.middle_name ? selectedUserModal.middle_name + ' ' : ''}${selectedUserModal.last_name || ''} ${selectedUserModal.suffix || ''}`.trim() || 'Unnamed User'}
                                    </h3>
                                    <p className="text-xs text-blue-500">
                                        {selectedUserModal.email || selectedUserModal.username || 'No email'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUserModal(null)} className="text-blue-400 hover:text-blue-700 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-blue-100">
                                <span className="text-blue-500">User ID:</span>
                                <span className="font-mono text-blue-900">{selectedUserModal.id || selectedUserModal._id}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-blue-100">
                                <span className="text-blue-500">Role:</span>
                                <span className="font-semibold text-blue-700 uppercase">{selectedUserModal.role || 'student'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-blue-100">
                                <span className="text-blue-500">Status:</span>
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">{selectedUserModal.status || 'Active'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-blue-100">
                                <span className="text-blue-500">Referred By Code:</span>
                                <span className="font-mono font-bold text-blue-700">{selectedUserModal.referredBy || displayData.group.referralCode}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-blue-500">Registration Date:</span>
                                <span className="text-blue-900">{formatDate(selectedUserModal.createdAt)}</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => setSelectedUserModal(null)}
                                className="w-full py-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-xl transition shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FILE VIEW MODAL */}
            {fileViewModal.open && (
                <div className="fixed inset-0 z-50 bg-blue-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-blue-200 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl shadow-blue-900/30 overflow-hidden">
                        <div className="p-4 border-b border-blue-200 flex items-center justify-between bg-blue-50">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-5 h-5 text-blue-900 shrink-0" />
                                <h3 className="font-bold text-blue-950 truncate" title={fileViewModal.title}>
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
                                    className="px-3 py-1 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-sm"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download
                                </button>
                                <button
                                    onClick={() => setFileViewModal({ open: false, url: '', title: '', fileName: '' })}
                                    className="p-1.5 hover:bg-blue-100 rounded-lg transition text-blue-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-2 bg-blue-50/50 min-h-[500px]">
                            {fileViewModal.url && fileViewModal.url.endsWith('.pdf') ? (
                                <iframe
                                    src={fileViewModal.url}
                                    className="w-full h-[600px] rounded-lg bg-white border border-blue-200"
                                    title="PDF Viewer"
                                />
                            ) : fileViewModal.url && fileViewModal.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/) ? (
                                <img
                                    src={fileViewModal.url}
                                    alt={fileViewModal.title || 'File preview'}
                                    className="w-full h-auto max-h-[600px] object-contain bg-white rounded-lg border border-blue-200"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-lg border border-blue-200">
                                    <FileText className="w-20 h-20 text-blue-200 mb-4" />
                                    <p className="text-blue-800 font-medium">Preview not available</p>
                                    <p className="text-xs text-blue-500 mt-1">Click Download to save the file</p>
                                    <button
                                        onClick={() => {
                                            if (fileViewModal.url) window.open(fileViewModal.url, '_blank');
                                        }}
                                        className="mt-4 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-sm font-semibold rounded-lg transition shadow-sm"
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