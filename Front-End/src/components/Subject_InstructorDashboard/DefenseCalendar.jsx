import React, { useState, useMemo, useCallback, useContext } from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter,
    Users,
    RefreshCw,
    Clock,
    CheckCircle,
    MapPin,
    Video,
    Download,
    MessageSquare,
    FolderOpen,
    CalendarDays,
    ListChecks,
    Info,
    Hourglass,
    LayoutGrid,
    List,
    Lock,
    Unlock,
    CheckCircle2,
} from 'lucide-react';

import { ScheduleContext } from '../../contexts/ScheduleContext/ScheduleContext';

// ============================
// HELPERS
// ============================
const safeStr = (val, fallback = '') => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (Array.isArray(val)) {
        const joined = val.map((v) => safeStr(v)).filter(Boolean).join(', ');
        return joined || fallback;
    }
    if (typeof val === 'object') {
        return (
            safeStr(val.name) ||
            safeStr(val.label) ||
            safeStr(val.title) ||
            safeStr(val.value) ||
            safeStr(val.text) ||
            fallback
        );
    }
    return fallback;
};

const formatTime = (t) => {
    if (!t || typeof t !== 'string') return '';
    const [hStr, mStr] = t.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(isNaN(m) ? 0 : m).padStart(2, '0')} ${ampm}`;
};

const resolveActivityType = (s) => {
    const proposedStatus = safeStr(s?.proposedTitle?.status).toLowerCase();
    const scheduleStatus = safeStr(s?.status).toLowerCase();

    if (proposedStatus.includes('final')) return 'final';
    if (proposedStatus.includes('revision') || scheduleStatus.includes('revision')) return 'revision';
    if (proposedStatus.includes('title')) return 'title';
    if (proposedStatus.includes('proposal')) return 'proposal';
    if (scheduleStatus.includes('mentoring')) return 'mentoring';
    return 'proposal';
};

const computeInDays = (dateStr) => {
    if (!dateStr) return 'TBA';
    const target = new Date(`${dateStr}T00:00:00`);
    if (isNaN(target.getTime())) return 'TBA';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.round((target - now) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff > 1) return `In ${diff} days`;
    if (diff === -1) return 'Yesterday';
    return `${Math.abs(diff)} days ago`;
};

const resolvePerson = (personObj, personId, panelists = []) => {
    if (personObj && (personObj.first_name || personObj.last_name || personObj.fullName)) {
        return personObj;
    }
    if (personId) {
        const found = panelists.find(
            (p) => p?._id === personId || p?.panelistId === personId || p?.id === personId
        );
        if (found) return found;
    }
    return null;
};

const getPersonName = (person, fallback = '—') => {
    if (!person) return fallback;
    const full = safeStr(person.fullName);
    if (full) return full;
    const combo = `${safeStr(person.first_name)} ${safeStr(person.last_name)}`.trim();
    return combo || fallback;
};

// ============================
// SEQUENTIAL CHAPTERS (mirror ng schema)
// ============================
const SEQUENTIAL_CHAPTERS = [
    'Preliminary Pages',
    'Chapter 1',
    'Chapter 2',
    'Chapter 3',
    'Chapter 4',
    'Chapter 5',
    'Appendices',
    'Full Manuscript',
];

// ============================
// ACTIVITY TYPE CONFIG
// ============================
const ACTIVITY_TYPES = {
    title: { label: 'Title Proposal', color: '#2563EB', bg: '#DBEAFE', text: '#1E40AF' },
    proposal: { label: 'Thesis Proposal Defense', color: '#7C3AED', bg: '#EDE9FE', text: '#5B21B6' },
    final: { label: 'Final Defense', color: '#059669', bg: '#D1FAE5', text: '#065F46' },
    revision: { label: 'Revision Review', color: '#E11D48', bg: '#FFE4E6', text: '#9F1239' },
    mentoring: { label: 'Mentoring Session', color: '#0D9488', bg: '#CCFBF1', text: '#115E59' },
};

// ============================
// CALENDAR CELL
// ============================
const CalendarCell = ({ day, month, dim, isToday, events, onSelect }) => {
    const hasSelected = events?.some((e) => e.selected);
    return (
        <div
            className={`min-h-[110px] p-2 rounded-lg flex flex-col transition-all cursor-pointer ${dim
                ? 'bg-blue-50/40 opacity-60'
                : hasSelected
                    ? 'bg-amber-50 border-2 border-amber-400 shadow-md'
                    : 'bg-white hover:bg-blue-50/70'
                }`}
            onClick={() => events?.[0] && onSelect?.(events[0])}
        >
            <div className="flex items-center justify-between">
                <span
                    className={`text-[11px] font-semibold ${dim ? 'text-blue-400' : isToday ? 'text-blue-900' : 'text-blue-800'
                        }`}
                >
                    {month ? `${month} ${day}` : day}
                </span>
                {isToday && (
                    <span className="text-[9px] text-amber-600 uppercase font-bold">Today</span>
                )}
            </div>

            {events?.map((ev, i) => {
                const cfg = ACTIVITY_TYPES[ev.type] || ACTIVITY_TYPES.proposal;
                return (
                    <div
                        key={i}
                        className="mt-1.5 p-1.5 rounded-lg shadow-sm hover:scale-[1.02] transition-transform"
                        style={{ backgroundColor: cfg.bg, color: cfg.text }}
                    >
                        <div
                            className="flex items-center gap-1 text-[10px] font-bold"
                            style={{ color: cfg.color }}
                        >
                            <Clock className="w-3 h-3" />
                            <span>{safeStr(ev.time, '—')}</span>
                        </div>
                        <div className="text-[11px] font-bold truncate leading-tight mt-0.5">
                            {safeStr(ev.group, '—')}
                        </div>
                        <div className="text-[10px] opacity-80 truncate">{cfg.label}</div>
                    </div>
                );
            })}

            {isToday && !events?.length && (
                <div className="mt-2 text-[10px] text-blue-500 italic">No sessions</div>
            )}
        </div>
    );
};

// ============================
// PROGRESS CHAPTER COMPONENT
// Base sa chapterProgressionApprovals (true/false) + completedChapters
// ============================
const ProgressChapter = ({ schedule }) => {
    const proposed = schedule?.proposedTitle || {};

    const completedChapters = useMemo(() => {
        return new Set(proposed?.completedChapters || []);
    }, [proposed]);

    const approvals = useMemo(() => {
        const raw = proposed?.chapterProgressionApprovals;
        if (!raw) return new Map();
        if (raw instanceof Map) return raw;
        if (Array.isArray(raw)) {
            return new Map(
                raw
                    .filter((e) => e && e.k !== undefined)
                    .map((e) => [e.k, e.v])
            );
        }
        if (typeof raw === 'object') return new Map(Object.entries(raw));
        return new Map();
    }, [proposed]);

    const nextAllowed = proposed?.nextAllowedChapter || null;

    const approvedCount = SEQUENTIAL_CHAPTERS.filter(
        (ch) => approvals.get(ch) === true
    ).length;
    const completedCount = SEQUENTIAL_CHAPTERS.filter(
        (ch) => completedChapters.has(ch)
    ).length;
    const total = SEQUENTIAL_CHAPTERS.length;
    const percentage = Math.round((approvedCount / total) * 100);

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-200 flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-blue-700" />
                    <h3 className="text-base font-bold text-blue-900">Progress Chapter</h3>
                </div>
                <span className="text-[11px] text-blue-500 font-bold">
                    {approvedCount}/{total} • {percentage}%
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden mb-4">
                <div
                    className="h-full bg-blue-700 transition-all"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Chapter list */}
            <div className="flex flex-col gap-1.5">
                {SEQUENTIAL_CHAPTERS.map((ch) => {
                    const isApproved = approvals.get(ch) === true;
                    const isCompleted = completedChapters.has(ch);
                    const isActive = ch === nextAllowed && !isApproved && !isCompleted;

                    let icon;
                    let bgCls = 'bg-white border-blue-100';
                    let textCls = 'text-blue-900';
                    let label = '';
                    let labelCls = 'text-blue-400';

                    if (isCompleted) {
                        icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
                        bgCls = 'bg-emerald-50 border-emerald-200';
                        label = 'Completed';
                        labelCls = 'text-emerald-600';
                    } else if (isApproved) {
                        icon = <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
                        bgCls = 'bg-blue-50 border-blue-300';
                        label = 'Approved';
                        labelCls = 'text-blue-600';
                    } else if (isActive) {
                        icon = <Unlock className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
                        bgCls = 'bg-amber-50 border-amber-300';
                        label = 'Active';
                        labelCls = 'text-amber-600';
                    } else {
                        icon = <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
                        bgCls = 'bg-white border-blue-100 opacity-70';
                        label = 'Locked';
                        labelCls = 'text-blue-400';
                    }

                    return (
                        <div
                            key={ch}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-md border ${bgCls}`}
                            title={
                                isCompleted
                                    ? `${ch} — tapos na`
                                    : isApproved
                                        ? `${ch} — na-approve ng instructor`
                                        : isActive
                                            ? `${ch} — pwede nang i-submit`
                                            : `${ch} — naka-lock`
                            }
                        >
                            <div className="flex items-center gap-1.5 min-w-0">
                                {icon}
                                <span className={`text-[11px] font-bold truncate ${textCls}`}>
                                    {ch}
                                </span>
                            </div>
                            <span className={`text-[9px] font-bold whitespace-nowrap ml-2 ${labelCls}`}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Summary footer */}
            <div className="mt-3 flex items-center justify-between text-[10px] text-blue-500 border-t border-blue-100 pt-2">
                <span>
                    <strong className="text-emerald-600">{completedCount}</strong> Completed
                </span>
                <span>
                    <strong className="text-blue-600">{approvedCount}</strong> Approved
                </span>
                <span>
                    <strong className="text-amber-600">{total - approvedCount}</strong> Pending
                </span>
            </div>

            {/* Current active hint */}
            {nextAllowed && (
                <div className="mt-3 p-2 bg-white rounded-md border border-amber-200 flex items-start gap-1.5">
                    <Info className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                    <span className="text-[10px] text-blue-700 leading-relaxed">
                        Kasalukuyang pwedeng i-submit:{' '}
                        <strong className="text-amber-700">{nextAllowed}</strong>
                    </span>
                </div>
            )}

            {approvedCount === total && completedCount === total && (
                <div className="mt-3 p-2 bg-emerald-50 rounded-md border border-emerald-200 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="text-[10px] text-emerald-700 leading-relaxed font-bold">
                        Lahat ng chapters ay completed na!
                    </span>
                </div>
            )}
        </div>
    );
};

// ============================
// MAIN COMPONENT
// ============================
export default function DefenseCalendar() {
    const [viewMode, setViewMode] = useState('month');
    const { schedules } = useContext(ScheduleContext);

    // ===== MAP SCHEDULES -> EVENTS =====
    const events = useMemo(() => {
        if (!Array.isArray(schedules)) return [];

        return schedules
            .map((s) => {
                if (!s?.date) return null;
                const d = new Date(`${s.date}T00:00:00`);
                if (isNaN(d.getTime())) return null;

                const type = resolveActivityType(s);
                const group = s.groupIds?.[0];
                const groupId = safeStr(group?.referralCode) || safeStr(group?.name) || '—';
                const time =
                    formatTime(s.startTime) ||
                    safeStr(s.timeRangeLabel) ||
                    '—';

                return {
                    raw: s,
                    id: s._id,
                    day: d.getDate(),
                    month: d.toLocaleString('en-US', { month: 'short' }),
                    monthIndex: d.getMonth(),
                    year: d.getFullYear(),
                    type,
                    time,
                    group: groupId,
                    title:
                        safeStr(s.proposedTitle?.title) ||
                        safeStr(group?.name) ||
                        'Untitled',
                    location: safeStr(s.location, 'TBA'),
                    selected: false,
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                const da = new Date(`${a.year}-${String(a.monthIndex + 1).padStart(2, '0')}-${String(a.day).padStart(2, '0')}`);
                const db = new Date(`${b.year}-${String(b.monthIndex + 1).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`);
                return da - db;
            });
    }, [schedules]);

    // ===== SELECTED EVENT =====
    const [selectedEvent, setSelectedEvent] = useState(null);
    const effectiveSelected = selectedEvent || events[0] || null;
    const selectedSchedule = effectiveSelected?.raw || null;

    // ===== CALENDAR GRID =====
    const calendarData = useMemo(() => {
        const refDate = events[0]
            ? new Date(`${events[0].year}-${String(events[0].monthIndex + 1).padStart(2, '0')}-01`)
            : new Date();
        const year = refDate.getFullYear();
        const monthIndex = refDate.getMonth();

        const firstDay = new Date(year, monthIndex, 1);
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const startWeekday = firstDay.getDay();

        const prevMonthDays = new Date(year, monthIndex, 0).getDate();
        const prevCells = [];
        for (let i = startWeekday - 1; i >= 0; i--) {
            prevCells.push({
                day: prevMonthDays - i,
                month: '',
                dim: true,
                isToday: false,
                events: [],
            });
        }

        const today = new Date();
        const isCurrentMonth =
            today.getFullYear() === year && today.getMonth() === monthIndex;
        const monthCells = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dayEvents = events
                .filter((e) => e.day === d && e.monthIndex === monthIndex && e.year === year)
                .map((e) => ({ ...e, selected: effectiveSelected?.id === e.id }));
            monthCells.push({
                day: d,
                month: '',
                dim: false,
                isToday: isCurrentMonth && today.getDate() === d,
                events: dayEvents,
            });
        }

        const totalSoFar = prevCells.length + monthCells.length;
        const remainder = totalSoFar % 7;
        const nextCells = [];
        if (remainder !== 0) {
            const needed = 7 - remainder;
            for (let d = 1; d <= needed; d++) {
                nextCells.push({
                    day: d,
                    month: new Date(year, monthIndex + 1, 1).toLocaleString('en-US', { month: 'short' }),
                    dim: true,
                    isToday: false,
                    events: [],
                });
            }
        }

        const allCells = [...prevCells, ...monthCells, ...nextCells];
        const weeks = [];
        for (let i = 0; i < allCells.length; i += 7) {
            weeks.push(allCells.slice(i, i + 7));
        }

        return {
            weeks,
            monthLabel: firstDay.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
            monthIndex,
            year,
        };
    }, [events, effectiveSelected]);

    const handleSelectEvent = useCallback((ev) => {
        const found = events.find((x) => x.id === ev.id);
        setSelectedEvent(found || ev);
    }, [events]);

    // ===== SELECTED DETAILS =====
    const selectedCfg =
        ACTIVITY_TYPES[effectiveSelected?.type] || ACTIVITY_TYPES.proposal;

    const proposed = selectedSchedule?.proposedTitle || {};

    const panelists = Array.isArray(selectedSchedule?.panelists)
        ? selectedSchedule.panelists
        : [];

    const advisers = resolvePerson(
        proposed.adviser,
        proposed.adviserId,
        panelists
    );
    const coAdvisers = resolvePerson(
        proposed.coAdviser,
        proposed.coAdviserId,
        panelists
    );

    const adviserName = getPersonName(advisers, '—');
    const coAdviserName = getPersonName(coAdvisers, '—');
    const adviserRole = safeStr(advisers?.role, 'Adviser');
    const coAdviserRole = safeStr(coAdvisers?.role, 'Co-Adviser');

    const confirmedCount = panelists.filter(
        (p) => p?.status === 'confirmed' || p?.status === 'accepted'
    ).length;

    const ds = selectedSchedule?.defenseSchedule || {};
    const modality = safeStr(ds.modality, 'TBA');
    const venue = safeStr(ds.venue) || safeStr(selectedSchedule?.location, 'TBA');
    const zoomLink = safeStr(ds.zoomLink);
    const zoomPasscode = safeStr(ds.zoomPasscode);

    const detailDateLabel = useMemo(() => {
        if (!selectedSchedule?.date) return 'TBA';
        const d = new Date(`${selectedSchedule.date}T00:00:00`);
        if (isNaN(d.getTime())) return 'TBA';
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    }, [selectedSchedule]);

    const detailTimeLabel = useMemo(() => {
        if (!selectedSchedule) return 'TBA';
        const start = formatTime(selectedSchedule.startTime);
        const end = formatTime(selectedSchedule.endTime);
        if (start && end) return `${start} – ${end}`;
        return safeStr(selectedSchedule.timeRangeLabel) || 'TBA';
    }, [selectedSchedule]);

    return (
        <div className="min-h-screen bg-blue-50 text-blue-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {/* === TOP HEADER === */}
                <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="flex flex-col max-w-2xl">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-blue-200 text-[10px] text-blue-700 uppercase tracking-wider font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Academic Council • Module 8
                            </span>
                            <span className="text-[11px] text-blue-500">
                                AY 2024–2025 Regular Defense Cycle
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight">
                            Defense &amp; Mentoring Calendar
                        </h1>
                        <p className="text-sm text-blue-600 mt-1">
                            Interactive schedule of upcoming thesis defenses, title proposals, and panelist
                            mentoring sessions.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-blue-200">
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                            <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                                <ListChecks className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-[10px] text-blue-500 uppercase font-semibold">
                                    My Quorum Load
                                </div>
                                <div className="text-base font-bold text-blue-900 leading-tight">
                                    {events.length} Scheduled
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                                <Hourglass className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-[10px] text-blue-500 uppercase font-semibold">
                                    Pending Reviews
                                </div>
                                <div className="text-base font-bold text-blue-900 leading-tight">
                                    {events.filter((e) => e.raw?.status === 'pending').length} Groups
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* === TOOLBAR === */}
                <section className="bg-white p-4 rounded-xl shadow-sm border border-blue-200 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center bg-blue-50 rounded-lg p-0.5">
                            <button className="p-1.5 rounded-lg text-blue-500 hover:text-blue-900 hover:bg-blue-100 transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-4 text-sm font-bold text-blue-900 select-none min-w-[150px] text-center">
                                {calendarData.monthLabel}
                            </span>
                            <button className="p-1.5 rounded-lg text-blue-500 hover:text-blue-900 hover:bg-blue-100 transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <button className="px-3 py-1.5 bg-blue-50 text-blue-800 text-[11px] font-bold rounded-lg hover:bg-blue-100 transition-all flex items-center gap-1.5 border border-blue-200">
                            <Calendar className="w-3.5 h-3.5" />
                            Today
                        </button>

                        <div className="inline-flex p-1 bg-blue-50 rounded-lg gap-0.5">
                            {[
                                { key: 'month', label: 'Month', icon: LayoutGrid },
                                { key: 'week', label: 'Week', icon: CalendarDays },
                                { key: 'day', label: 'Day', icon: Calendar },
                                { key: 'agenda', label: 'Agenda', icon: List },
                            ].map((v) => {
                                const Icon = v.icon;
                                return (
                                    <button
                                        key={v.key}
                                        onClick={() => setViewMode(v.key)}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${viewMode === v.key
                                            ? 'bg-blue-900 text-white shadow-sm'
                                            : 'text-blue-600 hover:text-blue-900 hover:bg-blue-100'
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">{v.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[210px] flex-1 sm:flex-initial">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400 pointer-events-none" />
                            <select className="w-full pl-9 pr-8 py-2 bg-blue-50 text-blue-800 text-xs rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer border border-blue-200 font-medium">
                                <option>All Activity Types ({Object.keys(ACTIVITY_TYPES).length})</option>
                                {Object.entries(ACTIVITY_TYPES).map(([key, cfg]) => (
                                    <option key={key}>{cfg.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative min-w-[190px] flex-1 sm:flex-initial">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400 pointer-events-none" />
                            <select className="w-full pl-9 pr-8 py-2 bg-blue-50 text-blue-800 text-xs rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer border border-blue-200 font-medium">
                                <option>All Assigned Groups</option>
                                {Array.from(new Set(events.map((e) => e.group))).map((g) => (
                                    <option key={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="p-2 bg-blue-50 text-blue-500 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-all border border-blue-200"
                            title="Refresh Live Schedule"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </section>

                {/* === MAIN GRID === */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* CALENDAR GRID */}
                    <section className="lg:col-span-7 xl:col-span-8 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-blue-200">
                        <div className="grid grid-cols-7 bg-blue-50 text-center py-2 text-[11px] text-blue-700 font-bold select-none">
                            <div>Sun</div>
                            <div>Mon</div>
                            <div>Tue</div>
                            <div>Wed</div>
                            <div>Thu</div>
                            <div>Fri</div>
                            <div>Sat</div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 bg-blue-100 p-1">
                            {calendarData.weeks.flat().map((cell, i) => (
                                <CalendarCell
                                    key={i}
                                    day={cell.day}
                                    month={cell.month}
                                    dim={cell.dim}
                                    isToday={cell.isToday}
                                    events={cell.events}
                                    onSelect={handleSelectEvent}
                                />
                            ))}
                        </div>

                        <div className="px-4 py-3 bg-blue-50 flex items-center justify-between text-blue-500 border-t border-blue-200">
                            <div className="flex items-center gap-2 text-[11px]">
                                <Info className="w-4 h-4 text-blue-700" />
                                <span>All defense sessions synchronized with Academic Calendar Term 2</span>
                            </div>
                            <span className="text-[10px] font-mono text-blue-400">Zone: UTC+08:00 (PHT)</span>
                        </div>
                    </section>

                    {/* RIGHT PANEL */}
                    <section className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
                        {/* === SELECTED EVENT DETAILS === */}
                        {effectiveSelected ? (
                            <div className="bg-white rounded-xl shadow-md flex flex-col relative overflow-hidden border border-blue-200">
                                <div
                                    className="absolute top-0 left-0 right-0 h-1.5"
                                    style={{ backgroundColor: selectedCfg.color }}
                                />

                                <div className="p-5 flex flex-col gap-3">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <div
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
                                            style={{ backgroundColor: selectedCfg.bg, color: selectedCfg.text }}
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: selectedCfg.color }}
                                            />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                                {selectedCfg.label}
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                                            <CheckCircle className="w-3 h-3 text-blue-600" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                                {confirmedCount}/{panelists.length || 3} Confirmed
                                            </span>
                                        </div>
                                    </div>

                                    <h2 className="text-sm font-bold text-blue-900 leading-snug">
                                        {safeStr(effectiveSelected.group, '—')}: {safeStr(effectiveSelected.title, 'Untitled')}
                                    </h2>

                                    <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-blue-700 mt-0.5" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-blue-900">
                                                {detailDateLabel} • {detailTimeLabel}
                                            </span>
                                            <span
                                                className="text-[10px] font-bold mt-0.5 flex items-center gap-1"
                                                style={{ color: selectedCfg.color }}
                                            >
                                                <Clock className="w-3 h-3" />
                                                {computeInDays(selectedSchedule?.date)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                                        <div className="flex-1">
                                            <span className="text-[10px] text-blue-500 uppercase tracking-wider block font-semibold">
                                                Defense Venue / Session Modality
                                            </span>
                                            <span className="text-xs text-blue-900 font-medium">
                                                {venue} ({modality})
                                            </span>
                                            {zoomLink && (
                                                <div className="mt-1">
                                                    <a
                                                        href={zoomLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-bold hover:underline"
                                                    >
                                                        <Video className="w-3 h-3" />
                                                        Zoom Link {zoomPasscode && `(Passcode: ${zoomPasscode})`}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Supervising team */}
                                    <div className="p-3 bg-blue-50 rounded-lg flex flex-col gap-2">
                                        <div className="text-[10px] text-blue-600 uppercase tracking-wider font-bold">
                                            Supervising Team &amp; Academic Panel
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-white p-2 rounded-md border border-blue-100">
                                                <span className="text-[9px] text-blue-400 uppercase block font-bold">
                                                    Principal Adviser
                                                </span>
                                                <span className="text-[11px] font-bold text-blue-900 block truncate" title={adviserName}>
                                                    {adviserName}
                                                </span>
                                                <span className="text-[10px] text-blue-500">
                                                    {adviserRole}
                                                </span>
                                            </div>

                                            <div className="bg-white p-2 rounded-md border border-blue-100">
                                                <span className="text-[9px] text-blue-400 uppercase block font-bold">
                                                    Co-Adviser
                                                </span>
                                                <span className="text-[11px] font-bold text-blue-900 block truncate" title={coAdviserName}>
                                                    {coAdviserName}
                                                </span>
                                                <span className="text-[10px] text-blue-500">
                                                    {coAdviserRole}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-white p-2.5 rounded-md border border-blue-100">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[9px] text-blue-400 uppercase font-bold">
                                                    Assigned Panelists
                                                </span>
                                                <span className="text-[10px] text-amber-600 font-bold">
                                                    {confirmedCount}/{panelists.length || 3} Confirmed
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {panelists.length === 0 ? (
                                                    <span className="text-[11px] text-blue-400 italic">
                                                        No panelists assigned.
                                                    </span>
                                                ) : (
                                                    panelists.map((p, idx) => {
                                                        const d = p.details || p;
                                                        const name =
                                                            getPersonName(d, '') ||
                                                            `${safeStr(d.first_name)} ${safeStr(d.last_name)}`.trim() ||
                                                            '—';
                                                        const isPending = p.status === 'pending';
                                                        return (
                                                            <div key={p.panelistId || p._id || idx} className="flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span
                                                                        className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-amber-500' : 'bg-blue-400'}`}
                                                                    />
                                                                    <span className="text-[11px] font-bold text-blue-900">
                                                                        {name}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[9px] text-blue-500">
                                                                    {isPending ? 'Pending' : safeStr(p.status, 'Assigned')}
                                                                </span>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button className="px-3 py-2 bg-blue-900 text-white text-[11px] font-bold rounded-lg hover:bg-blue-800 transition-all flex items-center justify-center gap-1.5">
                                            <FolderOpen className="w-3.5 h-3.5" />
                                            View Group
                                        </button>
                                        <button className="px-3 py-2 bg-blue-50 text-blue-800 text-[11px] font-bold rounded-lg hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5 border border-blue-200">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Comments
                                        </button>
                                        <button className="px-3 py-2 bg-blue-50 text-blue-800 text-[11px] font-bold rounded-lg hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5 border border-blue-200">
                                            <Download className="w-3.5 h-3.5" />
                                            Download PDF
                                        </button>
                                        <button className="px-3 py-2 bg-blue-50 text-blue-800 text-[11px] font-bold rounded-lg hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5 border border-blue-200">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            Sync Outlook
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm text-center">
                                <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                <p className="text-xs text-blue-500">
                                    No defense schedule selected. Click a date with a session to view details.
                                </p>
                            </div>
                        )}

                        {/* === PROGRESS CHAPTER === */}
                        <ProgressChapter schedule={selectedSchedule} />
                    </section>
                </div>
            </div>
        </div>
    );
}