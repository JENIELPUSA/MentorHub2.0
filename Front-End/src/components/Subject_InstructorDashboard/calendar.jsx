import React, { useState, useRef, useEffect, useMemo, useCallback, useContext } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    X,
    Check,
    ShieldCheck,
    UserCog,
    Users,
    Clock,
    Clock3,
    MapPin,
    FileText,
    Bell,
    Layers,
    Pencil,
    Trash2,
} from 'lucide-react';

import { ScheduleContext } from '../../contexts/ScheduleContext/ScheduleContext';
import { GroupContext } from '../../contexts/GroupNameContext/GroupNameContext';

// ============================================================
// LOCAL CONSTANTS
// ============================================================
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const INITIAL_CALENDAR_EVENTS = [
    { id: 1, title: 'Thesis Defense - Group Alpha', date: '2025-01-15', time: '9:00 AM - 11:00 AM', type: 'defense', location: 'Room 301, Main Building', description: 'Final defense for Group Alpha research project', color: '#1E3A8A', panelists: ['Dr. Jose Rizal', 'Dr. Andres Bonifacio'], groups: ['Group Alpha'], attendees: ['Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes'] },
    { id: 2, title: 'Adviser Consultation', date: '2025-01-16', time: '2:00 PM - 3:30 PM', type: 'consultation', location: 'Faculty Office 205', description: 'One-on-one consultation with Group Beta', color: '#FBBF24', panelists: ['Prof. Emilio Aguinaldo'], groups: ['Group Beta'], attendees: ['Ana Garcia', 'Carlos Mendoza'] },
    { id: 3, title: 'Chapter 3 Submission Deadline', date: '2025-01-20', time: '11:59 PM', type: 'deadline', location: 'Online Submission Portal', description: 'Deadline for Chapter 3 - Methodology', color: '#EF4444', panelists: ['Dr. Apolinario Mabini'], groups: ['All Groups'], attendees: ['All Groups'] },
    { id: 4, title: 'Research Meeting', date: '2025-01-22', time: '10:00 AM - 12:00 PM', type: 'meeting', location: 'Conference Room A', description: 'Monthly research progress meeting', color: '#10B981', panelists: ['Prof. Marcelo del Pilar', 'Dr. Gabriela Silang'], groups: ['All Groups'], attendees: ['All Advisers', 'Group Leaders'] },
    { id: 5, title: 'Proposal Defense - Group Gamma', date: '2025-01-25', time: '1:00 PM - 3:00 PM', type: 'defense', location: 'Auditorium', description: 'Proposal defense for Group Gamma', color: '#1E3A8A', panelists: ['Prof. Melchora Aquino', 'Dr. Lapu-Lapu', 'Dr. Jose Rizal'], groups: ['Group Gamma'], attendees: ['Group Gamma Members'] },
    { id: 6, title: 'Chapter 1-2 Revision Due', date: '2025-01-28', time: '5:00 PM', type: 'deadline', location: 'Online Submission Portal', description: 'Revised Chapters 1 and 2 submission', color: '#EF4444', panelists: ['Dr. Gabriela Silang'], groups: ['Group Alpha', 'Group Beta'], attendees: ['Group Alpha', 'Group Beta'] },
    { id: 7, title: 'Co-Adviser Meeting', date: '2025-01-30', time: '3:00 PM - 4:00 PM', type: 'meeting', location: 'Faculty Lounge', description: 'Co-advisers coordination meeting', color: '#10B981', panelists: ['Prof. Melchora Aquino'], groups: ['All Groups'], attendees: ['All Co-Advisers'] },
];

// ============================================================
// LOCAL UTILITIES
// ============================================================
const formatDate = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatDateLong = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const format12Hour = (time24) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const period = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${m} ${period}`;
};

// Convert "9:00 AM" → "09:00" para sa <input type="time">
const to24Hour = (time12) => {
    if (!time12) return '';
    const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return '';
    let [, hStr, mStr, period] = match;
    let h = parseInt(hStr, 10);
    const upper = period.toUpperCase();
    if (upper === 'PM' && h !== 12) h += 12;
    if (upper === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${mStr}`;
};

// Parse "9:00 AM - 11:00 AM" → { start: "09:00", end: "11:00" }
const parseTimeRange = (timeRange) => {
    if (!timeRange) return { start: '09:00', end: '11:00' };
    const parts = timeRange.split('-').map((s) => s.trim());
    if (parts.length !== 2) return { start: '09:00', end: '11:00' };
    return {
        start: to24Hour(parts[0]) || '09:00',
        end: to24Hour(parts[1]) || '11:00',
    };
};

const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
};

const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'NA';

const getEventTypeLabel = (type) => ({
    defense: 'Defense', meeting: 'Meeting',
    deadline: 'Deadline', consultation: 'Consultation',
}[type] || type);

const buildFullName = (u) =>
    [u.first_name, u.middle_name, u.last_name]
        .filter(Boolean)
        .join(' ') + (u.suffix ? ` ${u.suffix}` : '');

// ============================================================
// ✅ USER AVATAR COMPONENT
// ============================================================
const UserAvatar = ({ user, size = 'md', className = '' }) => {
    const sizeClasses = {
        xs: 'w-4 h-4 text-[7px]',
        sm: 'w-6 h-6 text-[8px]',
        md: 'w-8 h-8 text-xs',
        lg: 'w-10 h-10 text-sm',
    }[size] || 'w-8 h-8 text-xs';

    const avatarUrl = user?.avatar?.url || user?.avatarUrl || null;
    const initials = getInitials(user?.name || user?.fullName || '');
    const fullName = user?.name || user?.fullName || '';

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={fullName}
                title={fullName}
                className={`${sizeClasses} rounded-full object-cover flex-shrink-0 ${className}`}
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = 'flex';
                    }
                }}
            />
        );
    }

    return (
        <div
            title={fullName}
            className={`${sizeClasses} rounded-full bg-blue-900 text-yellow-400 flex items-center justify-center font-bold flex-shrink-0 ${className}`}
        >
            {initials}
        </div>
    );
};

// ============================================================
// ✅ AVATAR STACK — para sa calendar day cell
// ============================================================
const AvatarStack = ({ users = [], max = 3, size = 'xs' }) => {
    if (!users || users.length === 0) return null;

    const visible = users.slice(0, max);
    const remaining = users.length - max;

    const sizeClasses = {
        xs: 'w-3.5 h-3.5 text-[6px]',
        sm: 'w-5 h-5 text-[8px]',
    }[size] || 'w-3.5 h-3.5 text-[6px]';

    return (
        <div className="flex items-center -space-x-1 mt-0.5">
            {visible.map((user, i) => {
                const avatarUrl = user?.avatar?.url || user?.avatarUrl || null;
                const fullName = user?.name || user?.fullName || '';
                const initials = getInitials(fullName);

                return (
                    <div
                        key={user?._id || user?.userId || i}
                        className={`${sizeClasses} rounded-full border border-white bg-blue-900 text-yellow-400 flex items-center justify-center font-bold overflow-hidden flex-shrink-0 shadow-sm`}
                        title={fullName}
                    >
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={fullName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextSibling) {
                                        e.currentTarget.nextSibling.style.display = 'flex';
                                    }
                                }}
                            />
                        ) : null}
                        <span
                            className={`w-full h-full items-center justify-center ${avatarUrl ? 'hidden' : 'flex'}`}
                        >
                            {initials}
                        </span>
                    </div>
                );
            })}
            {remaining > 0 && (
                <div
                    className={`${sizeClasses} rounded-full border border-white bg-slate-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm`}
                    title={`+${remaining} more`}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
};

// ============================================================
// MODAL SHELL
// ============================================================
const ModalShell = ({ children, maxWidth = 'max-w-2xl', zIndex = 'z-50' }) => (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-black/50`}>
        <div className={`bg-white rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[92vh] overflow-hidden flex flex-col`}>
            {children}
        </div>
    </div>
);

// ============================================================
// EVENT DETAILS MODAL (with Edit & Delete)
// ============================================================
const EventDetailsModal = ({ event, onClose, onSetReminder, onEdit, onDelete }) => {
    if (!event) return null;

    const EventIcon = {
        defense: ShieldCheck, meeting: Users,
        deadline: Clock3, consultation: UserCog,
    }[event.type] || CalendarIcon;

    // ✅ Edit/Delete lang para sa dynamic defense events (galing sa ScheduleContext)
    const isEditable = event.type === 'defense' && !!event._raw;

    return (
        <ModalShell maxWidth="max-w-md" zIndex="z-[60]">
            <div className="p-5 text-white" style={{ backgroundColor: event.color }}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <EventIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                                {getEventTypeLabel(event.type)}
                            </span>
                            <h3 className="text-lg font-bold leading-tight">{event.title}</h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase">Date & Time</p>
                        <p className="text-sm font-bold text-blue-950">{event.date}</p>
                        <p className="text-sm text-slate-600">{event.time}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase">Location</p>
                        <p className="text-sm font-bold text-blue-950">{event.location}</p>
                    </div>
                </div>

                {event.groups?.length > 0 && (
                    <div className="flex items-start gap-3">
                        <Layers className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase">Groups Involved</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {event.groups.map((g, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-blue-900 text-yellow-400 text-xs font-bold rounded-lg">{g}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {event.panelists?.length > 0 && (
                    <div className="flex items-start gap-3">
                        <UserCog className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase">
                                Panelists ({event.panelists.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {event.panelists.map((p, i) => {
                                    const name = typeof p === 'string' ? p : (p.fullName || buildFullName(p));
                                    const avatarUser = typeof p === 'object' ? { ...p, name } : { name };
                                    return (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 bg-yellow-50 text-yellow-800 text-xs font-semibold rounded-lg border border-yellow-200"
                                        >
                                            <UserAvatar user={avatarUser} size="sm" />
                                            {name}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase">Description</p>
                        <p className="text-sm text-slate-600">{event.description}</p>
                    </div>
                </div>

                {event.attendees?.length > 0 && (
                    <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase">Attendees</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {event.attendees.map((a, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-900 text-xs font-semibold rounded-lg border border-blue-100">{a}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-2 p-4 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                    {isEditable && (
                        <button
                            onClick={() => onDelete?.(event)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-lg border border-red-200 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    )}
                    {isEditable && (
                        <button
                            onClick={() => onEdit?.(event)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-sm rounded-lg border border-blue-200 transition-colors"
                        >
                            <Pencil className="w-4 h-4" /> Edit
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg">
                        Close
                    </button>
                    <button onClick={onSetReminder} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-yellow-400 font-bold text-sm rounded-lg shadow-sm">
                        <Bell className="w-4 h-4" /> Set Reminder
                    </button>
                </div>
            </div>
        </ModalShell>
    );
};

// ============================================================
// DELETE CONFIRMATION MODAL
// ============================================================
const DeleteConfirmModal = ({ event, onConfirm, onClose, isDeleting }) => {
    if (!event) return null;

    return (
        <ModalShell maxWidth="max-w-sm" zIndex="z-[80]">
            <div className="p-5 text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <Trash2 className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-blue-950 mb-1">Delete Defense Schedule?</h3>
                <p className="text-sm text-slate-500 mb-4">
                    Are you sure you want to delete <span className="font-semibold text-blue-900">{event.title}</span>?
                    This action cannot be undone.
                </p>

                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg shadow-sm disabled:opacity-60"
                    >
                        <Trash2 className="w-4 h-4" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
};

// ============================================================
// DATE ASSIGNMENT MODAL (also used for editing)
// ============================================================
const DateAssignmentModal = ({
    date, defenseEvents,
    availableGroups, availablePanelists,
    selectedGroups, selectedPanelists,
    isGroupDropdownOpen, isPanelistDropdownOpen,
    groupDropdownRef, panelistDropdownRef,
    eventLocation, setEventLocation,
    eventStartTime, setEventStartTime,
    eventEndTime, setEventEndTime,
    onToggleGroup, onTogglePanelist, onSelectAllGroups, onSelectAllPanelists,
    onClearGroups, onClearPanelists, onToggleGroupDropdown, onTogglePanelistDropdown,
    onSave, onClose,
    isEditing = false,
    isSaving = false,
}) => {
    if (!date) return null;

    const allGroupsSelected =
        availableGroups.length > 0 && selectedGroups.length === availableGroups.length;
    const allPanelistsSelected =
        availablePanelists.length > 0 && selectedPanelists.length === availablePanelists.length;

    const canSave =
        selectedGroups.length > 0 &&
        selectedPanelists.length > 0 &&
        eventLocation.trim().length > 0 &&
        eventStartTime &&
        eventEndTime;

    const timePreview =
        eventStartTime && eventEndTime
            ? `${format12Hour(eventStartTime)} - ${format12Hour(eventEndTime)}`
            : '';

    const findPanelistByName = (name) =>
        availablePanelists.find((p) => p.name === name);

    return (
        <ModalShell maxWidth="max-w-lg" zIndex="z-[70]">
            <div className="p-5 bg-blue-900 text-yellow-400 flex-shrink-0">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center">
                            {isEditing
                                ? <Pencil className="w-5 h-5 text-yellow-400" />
                                : <CalendarIcon className="w-5 h-5 text-yellow-400" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                                {isEditing ? 'Editing Defense Schedule' : 'Selected Date'}
                            </p>
                            <h3 className="text-base font-bold leading-tight">{formatDateLong(date)}</h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-blue-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-blue-900" />
                        <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Defense Events This Date</p>
                        <span className="ml-auto text-[10px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full">
                            {defenseEvents.length}
                        </span>
                    </div>

                    {defenseEvents.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {defenseEvents.map((event) => (
                                <div key={event.id} className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50/40 flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center flex-shrink-0">
                                        <ShieldCheck className="w-4 h-4 text-yellow-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-yellow-400 px-1.5 py-0.5 rounded">
                                            Defense
                                        </span>
                                        <p className="text-sm font-bold text-blue-950 mt-1">{event.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{event.time} • {event.location}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 text-center">
                            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-slate-500">No defense events on this date</p>
                        </div>
                    )}
                </div>

                <div className="space-y-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> Event Details
                    </p>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Location <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={eventLocation}
                                onChange={(e) => setEventLocation(e.target.value)}
                                placeholder="e.g. Room 301, Main Building"
                                className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-blue-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Start Time <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="time"
                                    value={eventStartTime}
                                    onChange={(e) => setEventStartTime(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                End Time <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="time"
                                    value={eventEndTime}
                                    onChange={(e) => setEventEndTime(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {timePreview && (
                        <p className="text-xs text-blue-900 bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 font-semibold text-center">
                            🕐 {timePreview}
                        </p>
                    )}
                </div>

                {/* Group Selector */}
                <div ref={groupDropdownRef} className="relative">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Select Groups ({selectedGroups.length} selected)
                        </label>
                        {selectedGroups.length > 0 && (
                            <button onClick={onClearGroups} className="text-xs font-semibold text-red-500 hover:text-red-700">Clear all</button>
                        )}
                    </div>
                    <button
                        onClick={onToggleGroupDropdown}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-300"
                    >
                        <span className={`text-sm font-semibold ${selectedGroups.length > 0 ? 'text-blue-950' : 'text-slate-400'}`}>
                            {selectedGroups.length > 0
                                ? `${selectedGroups.length} group${selectedGroups.length > 1 ? 's' : ''} selected`
                                : 'Select groups...'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isGroupDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isGroupDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-blue-100 z-20 max-h-56 overflow-y-auto">
                            <div className="px-3 py-2 bg-slate-50 border-b sticky top-0 flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-500 uppercase">
                                    Available Groups ({availableGroups.length})
                                </p>
                                <button onClick={onSelectAllGroups} className="text-xs font-semibold text-blue-900 hover:text-blue-700">
                                    {allGroupsSelected ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            {availableGroups.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400">
                                    No groups available
                                </div>
                            ) : (
                                availableGroups.map((group) => {
                                    const isChecked = selectedGroups.includes(group.name);
                                    return (
                                        <button
                                            key={group.id}
                                            onClick={() => onToggleGroup(group.name)}
                                            className={`w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-center gap-3 ${isChecked ? 'bg-blue-50' : ''}`}
                                        >
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isChecked ? 'bg-blue-900 border-blue-900' : 'bg-white border-slate-300'}`}>
                                                {isChecked && <Check className="w-3 h-3 text-yellow-400" />}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-blue-900 text-yellow-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {getInitials(group.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-blue-950 truncate">{group.name}</p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {group.code ? `Code: ${group.code}` : 'Group'}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {selectedGroups.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {selectedGroups.map((name) => (
                                <span key={name} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-900 text-yellow-400 text-xs font-bold rounded-lg">
                                    {name}
                                    <button onClick={() => onToggleGroup(name)} className="p-0.5 rounded hover:bg-blue-800">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Panelist Selector */}
                <div ref={panelistDropdownRef} className="relative">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Assign Panelists ({selectedPanelists.length} selected)
                        </label>
                        {selectedPanelists.length > 0 && (
                            <button onClick={onClearPanelists} className="text-xs font-semibold text-red-500 hover:text-red-700">Clear all</button>
                        )}
                    </div>
                    <button
                        onClick={onTogglePanelistDropdown}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-300"
                    >
                        <span className={`text-sm font-semibold ${selectedPanelists.length > 0 ? 'text-blue-950' : 'text-slate-400'}`}>
                            {selectedPanelists.length > 0
                                ? `${selectedPanelists.length} panelist${selectedPanelists.length > 1 ? 's' : ''} selected`
                                : 'Select panelists...'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isPanelistDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isPanelistDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-blue-100 z-20 max-h-56 overflow-y-auto">
                            <div className="px-3 py-2 bg-slate-50 border-b sticky top-0 flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-500 uppercase">
                                    Available Panelists ({availablePanelists.length})
                                </p>
                                <button onClick={onSelectAllPanelists} className="text-xs font-semibold text-blue-900 hover:text-blue-700">
                                    {allPanelistsSelected ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            {availablePanelists.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400">
                                    No panel members available
                                </div>
                            ) : (
                                availablePanelists.map((panelist) => {
                                    const isChecked = selectedPanelists.includes(panelist.name);
                                    return (
                                        <button
                                            key={panelist.id}
                                            onClick={() => onTogglePanelist(panelist.name)}
                                            className={`w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-center gap-3 ${isChecked ? 'bg-blue-50' : ''}`}
                                        >
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isChecked ? 'bg-blue-900 border-blue-900' : 'bg-white border-slate-300'}`}>
                                                {isChecked && <Check className="w-3 h-3 text-yellow-400" />}
                                            </div>

                                            <UserAvatar user={panelist} size="md" />

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-blue-950 truncate">{panelist.name}</p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${panelist.role === 'adviser'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {panelist.role?.toUpperCase()}
                                                    </span>
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {selectedPanelists.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {selectedPanelists.map((name) => {
                                const panelist = findPanelistByName(name);
                                const avatarUser = panelist || { name };
                                return (
                                    <span
                                        key={name}
                                        className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 bg-yellow-400 text-blue-900 text-xs font-bold rounded-lg"
                                    >
                                        <UserAvatar user={avatarUser} size="sm" />
                                        {name}
                                        <button onClick={() => onTogglePanelist(name)} className="p-0.5 rounded hover:bg-yellow-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Summary */}
                {(selectedGroups.length > 0 || selectedPanelists.length > 0 || eventLocation || timePreview) && (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                            Assignment Summary
                        </p>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-blue-900 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="font-semibold text-slate-500">Location: </span>
                                    <span className="font-bold text-blue-950">{eventLocation || 'Not set'}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Clock className="w-3.5 h-3.5 text-blue-900 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="font-semibold text-slate-500">Time: </span>
                                    <span className="font-bold text-blue-950">{timePreview || 'Not set'}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Layers className="w-3.5 h-3.5 text-blue-900 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="font-semibold text-slate-500">Groups: </span>
                                    <span className="font-bold text-blue-950">
                                        {selectedGroups.length > 0 ? selectedGroups.join(', ') : 'None'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <UserCog className="w-3.5 h-3.5 text-blue-900 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="font-semibold text-slate-500">Panelists: </span>
                                    <span className="font-bold text-blue-950">
                                        {selectedPanelists.length > 0 ? selectedPanelists.join(', ') : 'None'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg disabled:opacity-50">
                    Cancel
                </button>
                <button
                    onClick={onSave}
                    disabled={!canSave || isSaving}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 font-bold text-sm rounded-lg shadow-sm ${canSave && !isSaving ? 'bg-blue-900 hover:bg-blue-800 text-yellow-400' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                    <Check className="w-4 h-4" />
                    {isSaving ? 'Saving...' : (isEditing ? 'Update Assignment' : 'Save Assignment')}
                </button>
            </div>
        </ModalShell>
    );
};

// ============================================================
// MAIN CALENDAR COMPONENT
// ============================================================
export default function Calendar() {
    // ----- Calendar state -----
    const [calendarView, setCalendarView] = useState('month');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarFilter, setCalendarFilter] = useState('all');
    const { createSchedule, updateSchedule, deleteSchedule, schedules } = useContext(ScheduleContext);

    // ----- Event modal -----
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);

    // ----- Delete modal -----
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ----- Date assignment modal -----
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [dateModalDate, setDateModalDate] = useState(null);
    const [editingScheduleId, setEditingScheduleId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedPanelists, setSelectedPanelists] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [isPanelistDropdownOpen, setIsPanelistDropdownOpen] = useState(false);
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
    const [eventLocation, setEventLocation] = useState('');
    const [eventStartTime, setEventStartTime] = useState('09:00');
    const [eventEndTime, setEventEndTime] = useState('11:00');
    const panelistDropdownRef = useRef(null);
    const groupDropdownRef = useRef(null);

    // ✅ Dynamic data mula sa GroupContext
    const { defenseGroups, panelMembers } = useContext(GroupContext);

    // ============================================================
    // TRANSFORM CONTEXT DATA → DROPDOWN FORMAT
    // ============================================================
    const availableGroups = useMemo(
        () =>
            (defenseGroups || []).map((group) => ({
                id: group.groupId,
                name: group.groupName,
                code: group.groupId?.slice(-6).toUpperCase() || '',
                members: 0,
                course: '',
            })),
        [defenseGroups]
    );

    const availablePanelists = useMemo(
        () =>
            (panelMembers || []).map((member) => ({
                id: member.userId,
                name: member.fullName,
                role: member.role,
                department: member.role === 'adviser' ? 'Adviser' : 'Panelist',
                avatarUrl: member.avatarUrl || member.avatar?.url || null,
                avatar: member.avatar || null,
            })),
        [panelMembers]
    );

    // ============================================================
    // TRANSFORM schedules → calendarEvents format
    // ============================================================
    const scheduleEvents = useMemo(() => {
        if (!schedules || schedules.length === 0) return [];

        return schedules.map((schedule) => {
            const groupNames = (schedule.groupIds || []).map((g) => g.name);
            const groupList = groupNames.length > 0 ? groupNames : ['Unknown Group'];

            const panelistObjects = (schedule.panelistIds || []).map((p) => ({
                _id: p._id,
                name: buildFullName(p),
                fullName: buildFullName(p),
                avatar: p.avatar || null,
                avatarUrl: p.avatar?.url || p.avatarUrl || null,
                role: p.role,
            }));

            return {
                id: schedule._id,
                title: `Defense - ${groupList.join(', ')}`,
                date: schedule.date,
                time: schedule.timeRangeLabel || `${schedule.startTime} - ${schedule.endTime}`,
                type: 'defense',
                location: schedule.location,
                description: schedule.remarks || 'Assigned defense',
                color: '#1E3A8A',
                panelists: panelistObjects,
                groups: groupList,
                attendees: groupList,
                _raw: schedule,
            };
        });
    }, [schedules]);

    const allCalendarEvents = useMemo(
        () => [...scheduleEvents, ...INITIAL_CALENDAR_EVENTS],
        [scheduleEvents]
    );

    // ----- Derived -----
    const todayStr = useMemo(() => formatDate(new Date()), []);
    const daysInMonth = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

    const defenseEventsForModal = useMemo(() => {
        if (!dateModalDate) return [];
        const dateStr = formatDate(dateModalDate);
        return allCalendarEvents.filter((e) => e.date === dateStr && e.type === 'defense');
    }, [allCalendarEvents, dateModalDate]);

    // ----- Navigation -----
    const goToPreviousMonth = useCallback(() => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const goToNextMonth = useCallback(() => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const goToToday = useCallback(() => {
        const today = new Date();
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(today);
    }, []);

    // ----- Handlers -----
    const handleEventClick = useCallback((event, e) => {
        e?.stopPropagation();
        setSelectedEvent(event);
        setIsEventModalOpen(true);
    }, []);

    const closeEventModal = useCallback(() => {
        setIsEventModalOpen(false);
        setSelectedEvent(null);
    }, []);

    const resetDateModalState = useCallback(() => {
        setSelectedPanelists([]);
        setSelectedGroups([]);
        setEventLocation('');
        setEventStartTime('09:00');
        setEventEndTime('11:00');
        setIsPanelistDropdownOpen(false);
        setIsGroupDropdownOpen(false);
        setEditingScheduleId(null);
    }, []);

    const handleDateClick = useCallback((date) => {
        if (!date) return;
        setSelectedDate(date);
        setDateModalDate(date);
        resetDateModalState();
        setIsDateModalOpen(true);
    }, [resetDateModalState]);

    const closeDateModal = useCallback(() => {
        setIsDateModalOpen(false);
        setDateModalDate(null);
        resetDateModalState();
    }, [resetDateModalState]);

    // ✅ EDIT handler
    const handleEditEvent = useCallback((event) => {
        if (!event?._raw) return;
        const raw = event._raw;

        setIsEventModalOpen(false);
        setSelectedEvent(null);

        const dateObj = new Date(`${raw.date}T00:00:00`);
        setDateModalDate(dateObj);
        setSelectedDate(dateObj);

        const groupNames = (raw.groupIds || []).map((g) => g.name).filter(Boolean);
        setSelectedGroups(groupNames);

        const panelistNames = (raw.panelistIds || [])
            .map((p) => buildFullName(p))
            .filter(Boolean);
        setSelectedPanelists(panelistNames);

        setEventLocation(raw.location || '');

        const { start, end } = parseTimeRange(
            raw.timeRangeLabel || `${raw.startTime || ''} - ${raw.endTime || ''}`
        );
        setEventStartTime(start);
        setEventEndTime(end);

        setEditingScheduleId(raw._id);
        setIsPanelistDropdownOpen(false);
        setIsGroupDropdownOpen(false);
        setIsDateModalOpen(true);
    }, []);

    // ✅ DELETE handler
    const handleDeleteEvent = useCallback((event) => {
        if (!event?._raw) return;
        setIsEventModalOpen(false);
        setSelectedEvent(null);
        setEventToDelete(event);
        setIsDeleteModalOpen(true);
    }, []);

    const closeDeleteModal = useCallback(() => {
        setIsDeleteModalOpen(false);
        setEventToDelete(null);
        setIsDeleting(false);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!eventToDelete?._raw?._id || !deleteSchedule) return;

        setIsDeleting(true);
        try {
            const result = await deleteSchedule(eventToDelete._raw._id);
            if (result?.success === false) {
                window.alert(`❌ ${result?.error || 'Failed to delete schedule'}`);
                setIsDeleting(false);
                return;
            }
            window.alert(`🗑️ Deleted: ${eventToDelete.title}`);
            closeDeleteModal();
        } catch (err) {
            console.error('Delete error:', err);
            window.alert('❌ Failed to delete schedule');
            setIsDeleting(false);
        }
    }, [eventToDelete, deleteSchedule, closeDeleteModal]);

    const togglePanelist = useCallback((name) => {
        setSelectedPanelists((prev) =>
            prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
        );
    }, []);

    const toggleGroup = useCallback((name) => {
        setSelectedGroups((prev) =>
            prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
        );
    }, []);

    const selectAllGroups = useCallback(() => {
        setSelectedGroups((prev) =>
            prev.length === availableGroups.length ? [] : availableGroups.map((g) => g.name)
        );
    }, [availableGroups]);

    const selectAllPanelists = useCallback(() => {
        setSelectedPanelists((prev) =>
            prev.length === availablePanelists.length ? [] : availablePanelists.map((p) => p.name)
        );
    }, [availablePanelists]);

    // ============================================================
    // SAVE ASSIGNMENT (create o update)
    // ============================================================
    const saveAssignment = useCallback(async () => {
        if (selectedGroups.length === 0 || selectedPanelists.length === 0) return;
        if (eventLocation.trim().length === 0) {
            window.alert('⚠️ Please enter a location before saving.');
            return;
        }
        if (!eventStartTime || !eventEndTime) {
            window.alert('⚠️ Please select start and end time.');
            return;
        }

        const groupIds = availableGroups
            .filter((g) => selectedGroups.includes(g.name))
            .map((g) => g.id);

        const panelistIds = availablePanelists
            .filter((p) => selectedPanelists.includes(p.name))
            .map((p) => p.id);

        const defenseDate = formatDate(dateModalDate);

        const start12 = format12Hour(eventStartTime);
        const end12 = format12Hour(eventEndTime);
        const timeRange = `${start12} - ${end12}`;

        const payload = {
            date: defenseDate,
            location: eventLocation.trim(),
            startTime: eventStartTime,
            endTime: eventEndTime,
            timeRange,
            groupIds,
            panelistIds,
        };

        const isEdit = !!editingScheduleId;
        console.log(isEdit ? '📤 Update Defense Payload:' : '📤 Create Defense Payload:', payload);

        setIsSaving(true);
        try {
            const result = isEdit
                ? await updateSchedule?.(editingScheduleId, payload)
                : await createSchedule(payload);

            if (!result?.success) {
                window.alert(`❌ ${result?.error || `Failed to ${isEdit ? 'update' : 'save'} schedule`}`);
                setIsSaving(false);
                return;
            }

            window.alert(
                isEdit
                    ? `✅ Defense Assignment Updated for ${formatDateLong(dateModalDate)}`
                    : `✅ Defense Assignment Saved for ${formatDateLong(dateModalDate)}`
            );
            setIsSaving(false);
            closeDateModal();
        } catch (err) {
            console.error('Save error:', err);
            window.alert('❌ Failed to save schedule');
            setIsSaving(false);
        }
    }, [
        selectedGroups,
        selectedPanelists,
        dateModalDate,
        eventLocation,
        eventStartTime,
        eventEndTime,
        availableGroups,
        availablePanelists,
        createSchedule,
        updateSchedule,
        editingScheduleId,
        closeDateModal,
    ]);

    // ----- Click outside dropdowns -----
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelistDropdownRef.current && !panelistDropdownRef.current.contains(event.target)) {
                setIsPanelistDropdownOpen(false);
            }
            if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target)) {
                setIsGroupDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ----- ESC key -----
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key !== 'Escape') return;
            if (isDeleteModalOpen) closeDeleteModal();
            else if (isDateModalOpen) closeDateModal();
            else if (isEventModalOpen) closeEventModal();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isDateModalOpen, isEventModalOpen, isDeleteModalOpen, closeDateModal, closeEventModal, closeDeleteModal]);

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 lg:col-span-2 flex flex-col overflow-hidden">
                {/* Header — COMPACT */}
                <div className="p-3 border-b border-blue-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gradient-to-r from-blue-900 to-blue-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center shadow-md">
                            <CalendarIcon className="w-4 h-4 text-blue-900" />
                        </div>
                        <div>
                            <h3 className="text-sm font-extrabold text-yellow-400 tracking-tight">Academic Calendar</h3>
                            <p className="text-[10px] text-blue-200 mt-0.5">Click any date to assign defense groups & panelists</p>
                        </div>
                    </div>
                </div>

                {/* Nav + view toggle + filter — COMPACT */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-1.5">
                        <button onClick={goToPreviousMonth} className="p-1 rounded-lg border border-slate-200 hover:bg-white hover:border-blue-300">
                            <ChevronLeft className="w-3 h-3 text-slate-600" />
                        </button>
                        <h4 className="text-xs font-bold text-blue-950 min-w-[120px] text-center">
                            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h4>
                        <button onClick={goToNextMonth} className="p-1 rounded-lg border border-slate-200 hover:bg-white hover:border-blue-300">
                            <ChevronRight className="w-3 h-3 text-slate-600" />
                        </button>
                        <button onClick={goToToday} className="ml-1 px-2 py-0.5 text-[10px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200">
                            Today
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                            {['month', 'week', 'day'].map((view) => (
                                <button
                                    key={view}
                                    onClick={() => setCalendarView(view)}
                                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md capitalize ${calendarView === view ? 'bg-blue-900 text-yellow-400 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {view}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <select
                                aria-label="Filter calendar events"
                                value={calendarFilter}
                                onChange={(e) => setCalendarFilter(e.target.value)}
                                className="appearance-none px-2 py-0.5 pr-6 text-[10px] font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-700"
                            >
                                <option value="all">All Events</option>
                                <option value="defense">Defense</option>
                                <option value="meeting">Meeting</option>
                                <option value="deadline">Deadline</option>
                                <option value="consultation">Consultation</option>
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Month view — COMPACT */}
                <div className="p-2 flex-1">
                    {calendarView === 'month' && (
                        <div className="grid grid-cols-7 gap-1">
                            {DAY_NAMES.map((day) => (
                                <div key={day} className="py-1 text-center text-[9px] font-bold text-blue-900 uppercase tracking-wider bg-blue-50/50 rounded-md">
                                    {day}
                                </div>
                            ))}

                            {daysInMonth.map((date, index) => {
                                const dayEvents = date
                                    ? allCalendarEvents.filter(
                                        (e) =>
                                            e.date === formatDate(date) &&
                                            (calendarFilter === 'all' || e.type === calendarFilter)
                                    )
                                    : [];
                                const isToday = date && formatDate(date) === todayStr;
                                const isSelected = date && formatDate(date) === formatDate(selectedDate);

                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleDateClick(date)}
                                        className={`min-h-[58px] p-0.5 rounded-md border transition-all cursor-pointer ${!date
                                            ? 'bg-slate-50/30 border-transparent'
                                            : isSelected
                                                ? 'bg-blue-50 border-blue-300 shadow-sm'
                                                : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'}`}
                                    >
                                        {date && (
                                            <>
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className={`text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-900 text-yellow-400' : 'text-slate-700'}`}>
                                                        {date.getDate()}
                                                    </span>
                                                    {dayEvents.length > 0 && (
                                                        <span className="text-[7px] font-bold text-blue-900 bg-blue-100 px-1 py-0.5 rounded-full">
                                                            {dayEvents.length}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="space-y-0.5">
                                                    {dayEvents.slice(0, 1).map((event) => (
                                                        <div key={event.id}>
                                                            <button
                                                                onClick={(e) => handleEventClick(event, e)}
                                                                className="w-full text-left px-1 py-[1px] rounded text-[8px] font-semibold truncate hover:opacity-80"
                                                                style={{
                                                                    backgroundColor: `${event.color}15`,
                                                                    color: event.color,
                                                                    borderLeft: `2px solid ${event.color}`,
                                                                }}
                                                            >
                                                                {event.title}
                                                            </button>

                                                            {/* ✅ AVATAR STACK — panelists sa calendar box */}
                                                            {event.type === 'defense' && event.panelists?.length > 0 && (
                                                                <AvatarStack
                                                                    users={event.panelists}
                                                                    max={3}
                                                                    size="xs"
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                    {dayEvents.length > 1 && (
                                                        <p className="text-[8px] text-slate-400 font-medium pl-1">
                                                            +{dayEvents.length - 1} more
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {calendarView === 'week' && (
                        <div className="text-center py-8 text-slate-400">
                            <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="font-semibold text-sm">Week View</p>
                            <p className="text-xs">Coming soon...</p>
                        </div>
                    )}

                    {calendarView === 'day' && (
                        <div className="text-center py-8 text-slate-400">
                            <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="font-semibold text-sm">Day View</p>
                            <p className="text-xs">Coming soon...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Event Details Modal */}
            {isEventModalOpen && selectedEvent && (
                <EventDetailsModal
                    event={selectedEvent}
                    onClose={closeEventModal}
                    onSetReminder={() => {
                        window.alert(`🔔 Reminder set for ${selectedEvent.title}!`);
                        closeEventModal();
                    }}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                />
            )}

            {/* Date Assignment Modal (create / edit) */}
            {isDateModalOpen && dateModalDate && (
                <DateAssignmentModal
                    date={dateModalDate}
                    defenseEvents={defenseEventsForModal}
                    availableGroups={availableGroups}
                    availablePanelists={availablePanelists}
                    selectedGroups={selectedGroups}
                    selectedPanelists={selectedPanelists}
                    isGroupDropdownOpen={isGroupDropdownOpen}
                    isPanelistDropdownOpen={isPanelistDropdownOpen}
                    groupDropdownRef={groupDropdownRef}
                    panelistDropdownRef={panelistDropdownRef}
                    eventLocation={eventLocation}
                    setEventLocation={setEventLocation}
                    eventStartTime={eventStartTime}
                    setEventStartTime={setEventStartTime}
                    eventEndTime={eventEndTime}
                    setEventEndTime={setEventEndTime}
                    onToggleGroup={toggleGroup}
                    onTogglePanelist={togglePanelist}
                    onSelectAllGroups={selectAllGroups}
                    onSelectAllPanelists={selectAllPanelists}
                    onClearGroups={() => setSelectedGroups([])}
                    onClearPanelists={() => setSelectedPanelists([])}
                    onToggleGroupDropdown={() => {
                        setIsGroupDropdownOpen((p) => !p);
                        setIsPanelistDropdownOpen(false);
                    }}
                    onTogglePanelistDropdown={() => {
                        setIsPanelistDropdownOpen((p) => !p);
                        setIsGroupDropdownOpen(false);
                    }}
                    onSave={saveAssignment}
                    onClose={closeDateModal}
                    isEditing={!!editingScheduleId}
                    isSaving={isSaving}
                />
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && eventToDelete && (
                <DeleteConfirmModal
                    event={eventToDelete}
                    onConfirm={confirmDelete}
                    onClose={closeDeleteModal}
                    isDeleting={isDeleting}
                />
            )}
        </>
    );
}