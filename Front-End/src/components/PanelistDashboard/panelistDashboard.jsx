import React, { useState, useMemo, useCallback, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  ArrowRight,
  MessageSquare,
  MapPin,
  Video,
  Shield,
  ListChecks,
  FileText,
  ChevronRight,
  User,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { ScheduleContext } from '../../contexts/ScheduleContext/ScheduleContext';
import { AuthContext } from '../../contexts/AuthContext';
import UserDashboardBanner from '../UserDashboard/components/UserDashboardBanner';

// ============================
// SAFE HELPERS
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

const buildInitials = (u) => {
  if (!u) return '?';
  const f = (u.first_name || u.fullName || '').trim();
  const l = (u.last_name || '').trim();
  if (f || l) return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || '?';
  const fallback = (u.username || u.email || '?').trim();
  return fallback.charAt(0).toUpperCase();
};

const buildName = (u, fallback = '') => {
  if (!u) return fallback;
  if (u.fullName) return u.fullName;
  const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
  return name || fallback;
};

const getStatusBadge = (variant) => {
  const styles = {
    success: 'bg-blue-100 text-blue-800',
    error: 'bg-red-100 text-red-800',
    secondary: 'bg-amber-100 text-amber-800',
    warning: 'bg-amber-200 text-amber-900',
    approved: 'bg-blue-200 text-blue-900',
  };
  const dotStyles = {
    success: 'bg-blue-600',
    error: 'bg-red-600',
    secondary: 'bg-amber-500',
    warning: 'bg-amber-600',
    approved: 'bg-blue-800',
  };
  return {
    container: styles[variant] || styles.secondary,
    dot: dotStyles[variant] || dotStyles.secondary,
  };
};

const mapReviewStatus = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('approved') || s.includes('ready for defense') || s.includes('done')) {
    return { label: status || 'Approved', variant: 'approved' };
  }
  if (s.includes('revision')) return { label: status || 'Under Revision', variant: 'error' };
  if (s.includes('rejected')) return { label: status || 'Rejected', variant: 'error' };
  if (s.includes('schedule')) return { label: status || 'For Schedule', variant: 'success' };
  if (s.includes('pending')) return { label: status || 'Pending Review', variant: 'secondary' };
  return { label: status || 'Pending Review', variant: 'secondary' };
};

const mapAcceptanceStatus = (gs) => {
  const s = (gs || '').toLowerCase();
  if (s.includes('accepted')) return { label: gs || 'Accepted', variant: 'success' };
  if (s.includes('rejected')) return { label: gs || 'Rejected', variant: 'error' };
  if (s.includes('pending')) return { label: gs || 'Pending Acceptance', variant: 'error' };
  return { label: gs || 'Pending Acceptance', variant: 'error' };
};

// ============================
// STAT CARD
// ============================
const StatCard = ({
  label, title, value, valueTone = 'default', subtitle,
  badge, badgeVariant, icon: Icon, iconBg, iconColor,
  progress, progressColor,
}) => {
  const valueColors = { default: 'text-blue-900', error: 'text-red-600' };
  return (
    <div className="group relative flex flex-col justify-between rounded-xl bg-white border border-blue-200 p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-500">
            {safeStr(label)}
          </span>
          <h2 className="text-base font-bold text-blue-900">{safeStr(title)}</h2>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2 flex-wrap">
        <span className={`text-3xl font-extrabold ${valueColors[valueTone]}`}>
          {safeStr(value, '0')}
        </span>
        {badge && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeVariant}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-blue-600/80">{safeStr(subtitle)}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-blue-100">
          <div className={`h-full ${progressColor}`} style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};

// ============================
// TOPIC FILTER TABS
// ============================
const TopicFilterTabs = ({ activeFilter, onChange, counts = {} }) => {
  const filters = [
    { key: 'all', label: `All (${counts.all || 0})` },
    { key: 'action', label: `Needs Action (${counts.action || 0})` },
    { key: 'pending', label: `Pending (${counts.pending || 0})` },
    { key: 'approved', label: `Approved (${counts.approved || 0})` },
  ];
  return (
    <div className="inline-flex items-center rounded-lg bg-amber-100 p-0.5">
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onChange(f.key)}
          className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-all ${
            activeFilter === f.key
              ? 'bg-white text-blue-900 shadow-sm'
              : 'text-amber-800 hover:text-amber-900'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
};

// ============================
// TOPICS TABLE
// ============================
const TopicsTable = ({ activeFilter, topics = [], onAction }) => {
  const filtered =
    activeFilter === 'all' ? topics : topics.filter((t) => t.filterKey === activeFilter);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-blue-50 text-blue-700 text-[10px] uppercase tracking-wider">
            <th className="py-2 px-4 font-semibold">Group &amp; Topic Details</th>
            <th className="py-2 px-4 font-semibold hidden md:table-cell">Advisers</th>
            <th className="py-2 px-4 font-semibold">Acceptance</th>
            <th className="py-2 px-4 font-semibold">Review State</th>
            <th className="py-2 px-4 font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="text-xs text-blue-900">
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 px-4 text-center text-blue-500">
                No topics in this filter.
              </td>
            </tr>
          ) : (
            filtered.map((topic) => {
              const acceptBadge = getStatusBadge(topic.acceptanceVariant);
              const reviewBadge = getStatusBadge(topic.reviewVariant);
              const isPanelist = topic.isYouPanelist === true;
              return (
                <tr
                  key={topic.id}
                  className="hover:bg-blue-50/50 transition-colors border-b border-blue-100 last:border-0"
                >
                  <td className="py-3 px-4 align-top max-w-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-blue-700">{topic.id}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          topic.timeBadge === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {topic.timeLabel}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-blue-900 mt-1 leading-snug">
                      {topic.title}
                    </h4>
                    <span className="text-[11px] text-blue-500">
                      Sub-domain: {topic.subDomain || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 align-top hidden md:table-cell">
                    <div className="flex flex-col gap-1.5">
                      {(topic.advisers || []).length === 0 ? (
                        <span className="text-[11px] text-blue-400 italic">No advisers assigned</span>
                      ) : (
                        topic.advisers.map((a, idx) => (
                          <div key={`${a.initials}-${idx}`} className="flex items-center gap-1.5">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                a.primary
                                  ? 'bg-blue-200 text-blue-800'
                                  : 'bg-amber-200 text-amber-800'
                              }`}
                            >
                              {a.initials}
                            </span>
                            <span
                              className={`text-xs ${
                                a.primary ? 'text-blue-900 font-medium' : 'text-blue-500'
                              }`}
                            >
                              {a.name}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </td>

                  {/* ⭐ ACCEPTANCE — "Confirmed" kapag isYouPanelist === true */}
                  <td className="py-3 px-4 align-top">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        isPanelist
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : acceptBadge.container
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isPanelist ? 'bg-emerald-600' : acceptBadge.dot
                        }`}
                      />
                      {isPanelist && <Shield className="w-3 h-3" />}
                      {topic.acceptance}
                    </span>
                  </td>

                  <td className="py-3 px-4 align-top">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${reviewBadge.container}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${reviewBadge.dot}`} />
                      {topic.reviewState}
                    </span>
                  </td>
                  <td className="py-3 px-4 align-top text-right">
                    <button
                      onClick={() => onAction?.(topic)}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                        topic.actionVariant === 'primary'
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-900 hover:text-white'
                      }`}
                      type="button"
                    >
                      {topic.actionLabel}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

// ============================
// FEEDBACK ITEM
// ============================
const FeedbackItem = ({
  initials, name, role, timeAgo, message,
  accent = 'primary', primaryAction, primaryVariant = 'primary',
}) => {
  const accentBg = accent === 'primary' ? 'bg-blue-900 text-white' : 'bg-amber-500 text-white';
  return (
    <div className="flex flex-col justify-between rounded-lg bg-blue-50 border border-blue-100 p-4">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs ${accentBg}`}>
              {safeStr(initials, '?')}
            </div>
            <div>
              <span className="text-xs font-bold text-blue-900 block">{safeStr(name, 'Unknown')}</span>
              <span className="text-[10px] text-blue-500">{safeStr(role)}</span>
            </div>
          </div>
          <span className="text-[10px] text-blue-400">{safeStr(timeAgo)}</span>
        </div>
        <p className="mt-2 text-xs text-blue-800 line-clamp-3 italic">"{safeStr(message)}"</p>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1">
        <button className="rounded px-2 py-0.5 text-[11px] text-blue-700 hover:bg-blue-100 font-semibold" type="button">
          Reply
        </button>
        <button
          className={`rounded px-3 py-1 text-[11px] font-semibold ${
            primaryVariant === 'primary'
              ? 'bg-blue-900 text-white hover:bg-blue-800'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
          type="button"
        >
          {safeStr(primaryAction, 'View')}
        </button>
      </div>
    </div>
  );
};

// ============================
// SCHEDULE ITEM
// ============================
const ScheduleItem = ({
  typeLabel, typeVariant, statusLabel, statusVariant,
  groupId, title, topicCode, track, proposedStatus,
  dateLabel, timeLabel, locationLabel, LocationIcon = MapPin,
  mentors, createdBy, actionLabel, actionVariant = 'primary',
  isMyPending, isYouPanelist,
  onConfirm, confirming,
}) => {
  const typeStyles = {
    secondary: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-700',
    primary: 'bg-blue-100 text-blue-800',
  };
  const typeDot = {
    secondary: 'bg-amber-500',
    error: 'bg-red-600',
    primary: 'bg-blue-700',
  };
  const statusStyles = {
    success: 'bg-blue-100 text-blue-800',
    warning: 'bg-amber-200 text-amber-900',
    error: 'bg-red-100 text-red-700',
  };
  const iconColor = {
    secondary: 'text-amber-600',
    error: 'text-red-600',
    primary: 'text-blue-700',
  };

  const tLabel = safeStr(typeLabel, 'Schedule');
  const sLabel = safeStr(statusLabel, 'Scheduled');
  const gId = safeStr(groupId, '—');
  const tTitle = safeStr(title, 'Untitled');
  const tCode = safeStr(topicCode);
  const tTrack = safeStr(track);
  const pStatus = safeStr(proposedStatus);
  const dLabel = safeStr(dateLabel, 'TBA');
  const tmLabel = safeStr(timeLabel, 'TBA');
  const locLabel = safeStr(locationLabel, 'TBA');
  const mLabel = safeStr(mentors, 'No panelists');
  const aLabel = safeStr(actionLabel, 'View');
  const createdName = safeStr(createdBy?.name);
  const createdRole = safeStr(createdBy?.role);

  const tv = typeStyles[typeVariant] ? typeVariant : 'secondary';
  const sv = statusStyles[statusVariant] ? statusVariant : 'warning';
  const isBusy = !!confirming;

  return (
    <div className="group relative rounded-xl bg-blue-50 border border-blue-100 p-4 transition-all hover:shadow-md hover:bg-blue-100/60">
      <div className="flex items-start justify-between gap-1">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${typeStyles[tv]}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${typeDot[tv]}`} />
          {tLabel}
        </span>
        <div className="flex items-center gap-1">
          {/* ⭐ Confirmed Panelist badge */}
          {isYouPanelist && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Shield className="w-3 h-3" /> Confirmed
            </span>
          )}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${statusStyles[sv]}`}>
            {sLabel}
          </span>
        </div>
      </div>

      <div className="mt-2">
        <span className="text-[11px] font-bold text-blue-700">{gId}</span>
        {(tCode || tTrack || pStatus) && (
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {tCode && <span className="rounded bg-blue-200 text-blue-900 px-1.5 py-0.5 text-[9px] font-bold">{tCode}</span>}
            {tTrack && <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[9px] font-semibold">{tTrack}</span>}
            {pStatus && <span className="rounded bg-blue-100 text-blue-800 px-1.5 py-0.5 text-[9px] font-bold">{pStatus}</span>}
          </div>
        )}
        <h4 className="text-sm font-bold text-blue-900 mt-1 leading-snug line-clamp-2">{tTitle}</h4>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-blue-600">
        <div className="flex items-center gap-1">
          <Calendar className={`w-3.5 h-3.5 ${iconColor[tv]}`} />
          <span className="font-semibold text-blue-900">{dLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className={`w-3.5 h-3.5 ${iconColor[tv]}`} />
          <span>{tmLabel}</span>
        </div>
        <div className="flex items-center gap-1 col-span-2">
          <LocationIcon className={`w-3.5 h-3.5 ${iconColor[tv]}`} />
          <span className="truncate">{locLabel}</span>
        </div>
        {createdName && (
          <div className="flex items-center gap-1 col-span-2 text-blue-500">
            <User className="w-3.5 h-3.5" />
            <span className="truncate">
              Created by <span className="font-semibold text-blue-900">{createdName}</span>
              {createdRole && <span className="text-blue-400"> • {createdRole}</span>}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-blue-200 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 truncate text-blue-600">
          <span className="font-semibold text-blue-900">Mentors:</span> {mLabel}
        </div>
        <button
          type="button"
          onClick={() => { if (isMyPending && onConfirm) onConfirm(); }}
          disabled={isBusy}
          className={`shrink-0 rounded px-3 py-1 text-[11px] font-semibold transition-all ${
            isBusy
              ? 'bg-blue-300 text-white cursor-not-allowed'
              : isMyPending
              ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
              : actionVariant === 'primary'
              ? 'bg-blue-900 text-white hover:bg-blue-800'
              : actionVariant === 'secondary'
              ? 'bg-white text-blue-800 hover:bg-blue-50 border border-blue-300'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          }`}
        >
          {isBusy ? 'Confirming…' : aLabel}
        </button>
      </div>
    </div>
  );
};

// ============================
// MAIN COMPONENT
// ============================
export default function AcademixPanelistDashboard() {
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('all');
  const [confirmingId, setConfirmingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const { schedules, confirmPanelist } = useContext(ScheduleContext);


  console.log("schedules",schedules)

  const authCtx = useContext(AuthContext) || {};
  const currentUser = authCtx.user || authCtx.currentUser || authCtx.authUser;
  const currentUserId =
    currentUser?._id || currentUser?.id || authCtx.userId || authCtx._id;

  const handleFilterChange = useCallback((key) => setActiveFilter(key), []);

  const goToResearchGroups = useCallback(() => {
    navigate('/dashboard/my-researchGroups');
  }, [navigate]);

  // ===== Map schedules -> ScheduleItem props =====
  const mappedSchedules = useMemo(() => {
    if (!schedules || !Array.isArray(schedules)) return [];

    return schedules.map((s) => {
      const group = s.groupIds?.[0];
      const proposed = s.proposedTitle || {};

      const groupId =
        safeStr(group?.referralCode) || safeStr(group?.name) || '—';

      const title =
        safeStr(proposed?.title) ||
        safeStr(group?.name) ||
        'Untitled Research Group';

      const topicCode = safeStr(proposed?.topicCode);
      const track = safeStr(proposed?.track);
      const proposedStatus = safeStr(proposed?.status);

      const locRaw = s.location;
      const loc =
        typeof locRaw === 'string' ? locRaw : safeStr(locRaw) || 'TBA';
      const isVirtual = /zoom|online|virtual|meet|teams/i.test(loc);

      let mentors = 'No panelists assigned';
      if (Array.isArray(s.panelists) && s.panelists.length > 0) {
        const names = s.panelists
          .map((p) => {
            const d = p?.details || {};
            const mid = d.middle_name ? ` ${safeStr(d.middle_name)}` : '';
            return `${safeStr(d.first_name)}${mid} ${safeStr(d.last_name)}`.trim();
          })
          .filter(Boolean);
        if (names.length) mentors = names.join(' • ');
      }

      const statusVariantMap = {
        scheduled: 'success',
        pending: 'warning',
        cancelled: 'error',
        completed: 'success',
      };
      const statusVariant = statusVariantMap[s.status] || 'warning';

      const myPanelistEntry = Array.isArray(s.panelists)
        ? s.panelists.find((p) => String(p?.panelistId) === String(currentUserId))
        : null;

      const isMyPending = myPanelistEntry?.status === 'pending';
      const isMyConfirmed =
        myPanelistEntry?.status === 'confirmed' ||
        myPanelistEntry?.status === 'accepted';

      const isYouPanelist = s.isYouPanelist === true;

      const actionLabel = isMyPending
        ? 'Confirm Slot'
        : isMyConfirmed
        ? 'Join Panel'
        : s.status === 'scheduled'
        ? 'View Details'
        : 'View Details';

      const actionVariant = isMyPending ? 'secondary' : 'primary';

      const createdByName =
        safeStr(s.createdBy?.fullName) ||
        `${safeStr(s.createdBy?.first_name)} ${safeStr(s.createdBy?.last_name)}`.trim() ||
        null;

      const statusLabel = isMyPending
        ? 'Awaiting Your Confirmation'
        : s.status === 'scheduled'
        ? 'Confirmed'
        : s.status === 'pending'
        ? 'Pending Panelist'
        : safeStr(s.status) || 'Scheduled';

      let dateLabel = 'TBA';
      if (s.date) {
        const parsed = new Date(`${s.date}T00:00:00`);
        if (!isNaN(parsed.getTime())) {
          dateLabel = parsed.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
        } else {
          dateLabel = safeStr(s.date, 'TBA');
        }
      }

      const startFmt = formatTime(s.startTime);
      const endFmt = formatTime(s.endTime);
      const timeLabel =
        (startFmt && endFmt ? `${startFmt} – ${endFmt}` : '') ||
        safeStr(s.timeRangeLabel) ||
        'TBA';

      return {
        id: s._id || `${groupId}-${s.date || Date.now()}`,
        scheduleId: s._id,
        panelistId: myPanelistEntry?.panelistId || currentUserId,
        isMyPending,
        isMyConfirmed,
        isYouPanelist,
        typeLabel: 'Research Defense',
        typeVariant: isMyPending ? 'error' : 'secondary',
        statusLabel,
        statusVariant,
        groupId,
        title,
        topicCode,
        track,
        proposedStatus,
        dateLabel,
        timeLabel,
        locationLabel: loc,
        LocationIcon: isVirtual ? Video : MapPin,
        mentors,
        createdBy: createdByName
          ? {
              name: createdByName,
              role: safeStr(s.createdBy?.role).replace(/_/g, ' ') || null,
            }
          : null,
        actionLabel,
        actionVariant,
      };
    });
  }, [schedules, currentUserId]);

  // ⭐ Map schedules -> TopicsTable rows
  const mappedTopics = useMemo(() => {
    if (!schedules || !Array.isArray(schedules)) return [];

    return schedules.map((s) => {
      const group = s.groupIds?.[0];
      const proposed = s.proposedTitle || {};

      const groupId =
        safeStr(group?.referralCode) || safeStr(group?.name) || '—';

      const title =
        safeStr(proposed?.title) ||
        safeStr(group?.name) ||
        'Untitled Research Group';

      const subDomain = safeStr(proposed?.track) || safeStr(proposed?.subDomain) || '—';

      const adviserList = [];
      if (proposed?.adviser) {
        adviserList.push({
          initials: buildInitials(proposed.adviser),
          name: buildName(proposed.adviser, 'Adviser'),
          primary: true,
        });
      }
      if (proposed?.coAdviser) {
        adviserList.push({
          initials: buildInitials(proposed.coAdviser),
          name: buildName(proposed.coAdviser, 'Co-Adviser'),
          primary: false,
        });
      }

      const groupStatusRaw =
        safeStr(proposed?.groupStatus) || safeStr(group?.status) || 'Pending Acceptance';
      let acceptance = mapAcceptanceStatus(groupStatusRaw);

      // ⭐ isYouPanelist === true → "Confirmed"
      const isYouPanelist = s.isYouPanelist === true;
      if (isYouPanelist) {
        acceptance = { label: 'Confirmed', variant: 'success' };
      }

      const proposedStatusRaw = safeStr(proposed?.status) || 'Pending Review';
      const review = mapReviewStatus(proposedStatusRaw);

      // Filter key
      let filterKey = 'all';
      const reviewLower = review.label.toLowerCase();
      const acceptLower = acceptance.label.toLowerCase();

      if (isYouPanelist) {
        filterKey = 'approved';
      } else if (
        reviewLower.includes('revision') ||
        reviewLower.includes('rejected') ||
        acceptLower.includes('pending')
      ) {
        filterKey = 'action';
      } else if (
        reviewLower.includes('approved') ||
        reviewLower.includes('ready for defense') ||
        reviewLower.includes('done')
      ) {
        filterKey = 'approved';
      } else if (reviewLower.includes('pending')) {
        filterKey = 'pending';
      }

      // Time label
      let timeLabel = 'Recently';
      let timeBadge = 'neutral';
      const rawDate = s.updatedAt || s.createdAt || proposed?.updatedAt || proposed?.createdAt;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) timeLabel = 'Today';
          else if (diffDays === 1) timeLabel = 'Yesterday';
          else if (diffDays < 7) timeLabel = `${diffDays} days ago`;
          else timeLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }
      if (filterKey === 'action') timeBadge = 'error';

      let actionLabel = 'View';
      let actionVariant = 'secondary';
      if (filterKey === 'action') {
        actionLabel = 'Evaluate';
        actionVariant = 'primary';
      }

      return {
        id: groupId,
        title,
        subDomain,
        advisers: adviserList,
        acceptance: acceptance.label,
        acceptanceVariant: acceptance.variant,
        reviewState: review.label,
        reviewVariant: review.variant,
        actionLabel,
        actionVariant,
        timeLabel,
        timeBadge,
        filterKey,
        isYouPanelist,
      };
    });
  }, [schedules]);

  // Filter counts
  const filterCounts = useMemo(() => {
    const counts = { all: mappedTopics.length, action: 0, pending: 0, approved: 0 };
    mappedTopics.forEach((t) => {
      if (counts[t.filterKey] !== undefined) counts[t.filterKey] += 1;
    });
    return counts;
  }, [mappedTopics]);

  const handleConfirmSlot = useCallback(
    async (scheduleId, panelistId) => {
      if (!scheduleId || !panelistId) {
        setActionError('Missing schedule or panelist ID.');
        return;
      }
      setActionError('');
      setActionSuccess('');
      setConfirmingId(scheduleId);
      try {
        const res = await confirmPanelist(
          scheduleId,
          panelistId,
          'Confirmed via panelist dashboard'
        );
        if (res?.success) {
          setActionSuccess(res?.message || 'Slot confirmed successfully.');
          setTimeout(() => setActionSuccess(''), 3500);
        } else {
          setActionError(res?.error || 'Failed to confirm slot.');
        }
      } catch (err) {
        setActionError(err?.message || 'Unexpected error while confirming.');
      } finally {
        setConfirmingId(null);
      }
    },
    [confirmPanelist]
  );

  const pendingMineCount = useMemo(
    () => mappedSchedules.filter((x) => x.isMyPending).length,
    [mappedSchedules]
  );

  const statCards = useMemo(
    () => [
      {
        label: 'Panel Workload',
        title: 'Total Groups Handled',
        value: schedules?.length || 0,
        valueTone: 'default',
        subtitle: 'Research groups assigned to you.',
        badge: (
          <>
            <TrendingUp className="w-3 h-3" />
            Live from schedule API
          </>
        ),
        badgeVariant: 'bg-blue-100 text-blue-700',
        icon: Users,
        iconBg: 'bg-blue-900',
        iconColor: 'text-white',
        progress: 80,
        progressColor: 'bg-blue-700',
      },
      {
        label: 'Action Pending',
        title: 'Groups Not Yet Accepted',
        value: pendingMineCount,
        valueTone: 'error',
        subtitle: 'Groups awaiting your acceptance.',
        badge: (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
            {pendingMineCount > 0 ? 'Requires Your Review' : 'All Caught Up'}
          </>
        ),
        badgeVariant: 'bg-red-100 text-red-700',
        icon: Clock,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-700',
      },
      {
        label: 'Evaluation Queue',
        title: 'Topics Awaiting Review',
        value: filterCounts.action || 0,
        valueTone: 'default',
        subtitle: 'Topics requiring your attention.',
        badge: (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Action Needed: {filterCounts.action || 0}
          </>
        ),
        badgeVariant: 'bg-amber-100 text-amber-800',
        icon: FileText,
        iconBg: 'bg-amber-500',
        iconColor: 'text-white',
        progress: 62,
        progressColor: 'bg-amber-500',
      },
      {
        label: 'Milestones',
        title: 'Upcoming Schedules',
        value: schedules?.length || 0,
        valueTone: 'default',
        subtitle: 'Upcoming research activities.',
        badge:
          schedules?.length > 0 && mappedSchedules[0] ? (
            <>
              <Clock className="w-3 h-3" />
              Next: {mappedSchedules[0].dateLabel} • {mappedSchedules[0].timeLabel}
            </>
          ) : (
            <>No upcoming schedules</>
          ),
        badgeVariant: 'bg-blue-100 text-blue-700',
        icon: Calendar,
        iconBg: 'bg-blue-700',
        iconColor: 'text-white',
        progress: 45,
        progressColor: 'bg-blue-500',
      },
    ],
    [schedules, mappedSchedules, pendingMineCount, filterCounts]
  );

  return (
    <div className="min-h-screen bg-blue-50 font-sans text-blue-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 p-6 text-white shadow-lg">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />
          <div className="absolute right-40 -bottom-20 h-56 w-56 rounded-full bg-yellow-300/10 blur-xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold backdrop-blur-md text-amber-200">
                <GraduationCap className="w-3.5 h-3.5" />
                Academic Year 2024–2025 • Term 2
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome Back, Panelist!
              </h1>
              <p className="text-sm text-blue-100 leading-relaxed">
                Monitor your assigned research groups, review research topics, track feedback, and
                stay updated with upcoming academic schedules.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={goToResearchGroups}
                className="group flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-blue-900 shadow-md transition-all hover:bg-amber-400 hover:shadow-lg"
              >
                <ListChecks className="w-4 h-4 transition-transform group-hover:scale-110" />
                Review Queue
                <span className="rounded-full bg-blue-900 text-amber-400 px-2 py-0.5 text-[10px] font-bold">
                  {pendingMineCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/schedules')}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <Calendar className="w-4 h-4" />
                Defense Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card, idx) => (
            <StatCard key={idx} {...card} />
          ))}
        </div>

        {/* Two-Column Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Topics Table + Feedback */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="rounded-xl bg-white border border-blue-200 shadow-sm flex flex-col">
              <div className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-amber-50 border-b border-amber-200 rounded-t-xl">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700">
                    Submission Registry
                  </span>
                  <h3 className="text-base font-bold text-blue-900">
                    Recently Updated Research Topics
                  </h3>
                </div>
                <TopicFilterTabs
                  activeFilter={activeFilter}
                  onChange={handleFilterChange}
                  counts={filterCounts}
                />
              </div>

              <TopicsTable
                activeFilter={activeFilter}
                topics={mappedTopics}
                onAction={goToResearchGroups}
              />

              <div className="p-4 bg-amber-50 border-t border-amber-200 rounded-b-xl flex items-center justify-between text-[11px] text-blue-600">
                <span>
                  Showing {mappedTopics.length} of {mappedTopics.length} active candidate proposals
                </span>
                <button
                  type="button"
                  onClick={goToResearchGroups}
                  className="inline-flex items-center gap-1 text-blue-800 font-bold hover:underline"
                >
                  View All Research Groups
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Feedback Widget */}
            <div className="rounded-xl bg-white border border-blue-200 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-bold text-blue-900">
                    Recent Feedback &amp; Discussion
                  </h3>
                </div>
                <button type="button" className="text-[11px] text-blue-800 font-bold hover:underline">
                  Open Feedback Drawer
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <FeedbackItem
                  initials="JB"
                  name="Dr. Jonathan Bell"
                  role="Adviser • RG-2024-03"
                  timeAgo="1h ago"
                  message="The group incorporated your methodology remarks regarding sample size augmentation. Updated Chapter 3 document re-submitted for your sign-off."
                  accent="primary"
                  primaryAction="Review Revisions"
                  primaryVariant="primary"
                />
                <FeedbackItem
                  initials="ER"
                  name="Prof. Elena Rostova"
                  role="Lead Adviser • RG-2024-01"
                  timeAgo="Yesterday"
                  message="Defense slide deck uploaded for tomorrow's 9:00 AM session. Let us know if you require any specialized physical demo equipment prepared in Room 402."
                  accent="secondary"
                  primaryAction="View Defense Pack"
                  primaryVariant="secondary"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Schedule Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="rounded-xl bg-white border border-blue-200 p-5 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700">
                    Synchronized Calendar
                  </span>
                  <h3 className="text-base font-bold text-blue-900">Upcoming Schedules</h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/schedules')}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-800 transition-all shadow-sm"
                >
                  <span>View Full</span>
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              </div>

              {actionSuccess && (
                <div className="mb-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-[11px] text-blue-800 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold">{actionSuccess}</span>
                  <button
                    type="button"
                    onClick={() => setActionSuccess('')}
                    className="ml-auto text-blue-500 hover:text-blue-800 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {actionError && (
                <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span className="font-semibold">{actionError}</span>
                  <button
                    type="button"
                    onClick={() => setActionError('')}
                    className="ml-auto text-red-500 hover:text-red-700 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3 flex-1">
                {mappedSchedules.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-blue-200 p-6 text-center">
                    <p className="text-xs text-blue-500">No upcoming schedules assigned.</p>
                  </div>
                ) : (
                  mappedSchedules.map((item) => {
                    const { id, scheduleId, panelistId, isMyPending, isYouPanelist, ...props } = item;
                    return (
                      <ScheduleItem
                        key={id}
                        {...props}
                        isMyPending={isMyPending}
                        isYouPanelist={isYouPanelist}
                        confirming={confirmingId === scheduleId}
                        onConfirm={
                          isMyPending
                            ? () => handleConfirmSlot(scheduleId, panelistId)
                            : undefined
                        }
                      />
                    );
                  })
                )}
              </div>

              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] text-blue-900 font-bold">
                    Panel Compliance: {pendingMineCount === 0 ? '100%' : 'Pending Confirmations'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-blue-500">AY24-25 T2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}