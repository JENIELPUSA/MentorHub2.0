import React, { useState, useMemo, useCallback, useContext, useEffect } from 'react';
import {
  Award,
  Search,
  Clock,
  CheckCircle,
  CheckCircle2,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';

import { ProposedTitleContext } from '../../contexts/ProposedTitleContext/ProposedTitleContext';

/* ============================================================
   THEME — BLUE · WHITE · YELLOW
   ============================================================ */

const CARD = 'bg-white rounded-2xl shadow-md shadow-blue-900/10 border border-blue-200';

/* ============================================================
   UTILITIES
   ============================================================ */
const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'NA';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/* ============================================================
   MAP CONTEXT DATA -> TABLE ROW SHAPE
   ============================================================ */
const mapReadyTitleToSchedule = (titleItem) => {
  const group = titleItem.groupInfo || {};
  const latestTracking =
    Array.isArray(titleItem.titleUrlTracking) && titleItem.titleUrlTracking.length > 0
      ? titleItem.titleUrlTracking[titleItem.titleUrlTracking.length - 1]
      : null;

  const defenseDateSource = latestTracking?.date || titleItem.createdAt;

  return {
    id: titleItem._id,
    groupName: group.name || titleItem.groupName || 'Unnamed Group',
    referralCode: group.referralCode || 'N/A',
    defenseDate: defenseDateSource,
    defenseTime: formatTime(defenseDateSource),
    panel: titleItem.panel || 'TBA',
    status: titleItem.status === 'Ready for Defense' ? 'Scheduled' : titleItem.status,
    title: titleItem.title,
    remarks: titleItem.remarks,
    adviserStatus: group.adviserStatus,
    coadviserStatus: group.coadviserStatus,
  };
};

/* ============================================================
   SKELETON COMPONENTS
   ============================================================ */
const SkeletonPulse = ({ className = '' }) => (
  <div className={`animate-pulse bg-blue-200/70 rounded ${className}`} />
);

const DefenseRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="py-4 px-6">
      <div className="flex items-center gap-2">
        <SkeletonPulse className="h-8 w-8 rounded-xl" />
        <div className="space-y-1">
          <SkeletonPulse className="h-4 w-28" />
          <SkeletonPulse className="h-3 w-40" />
        </div>
      </div>
    </td>
    <td className="py-4 px-6"><SkeletonPulse className="h-6 w-20 rounded-lg" /></td>
    <td className="py-4 px-6"><SkeletonPulse className="h-4 w-24" /></td>
    <td className="py-4 px-6"><SkeletonPulse className="h-4 w-16" /></td>
    <td className="py-4 px-6"><SkeletonPulse className="h-6 w-20 rounded-lg" /></td>
    <td className="py-4 px-6 text-right"><SkeletonPulse className="h-7 w-20 rounded-xl ml-auto" /></td>
  </tr>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function DefenseSchedule({
  isLoading = false,
  onMarkDone,
  title = 'Defense Schedule',
  subtitle = 'Groups scheduled for defense. Mark as done once completed.',
}) {
  const {
    readyTitles = [],
    UpdateProposedTitle,

    // ✅ Back-end pagination state
    totalReadyTitles = 0,
    readyTotalPages = 1,
    readyCurrentPage = 1,
    setReadyCurrentPage,

    // ✅ Back-end filters
    readySearch = '',
    setReadySearch,
    readyDateFrom = '',
    setReadyDateFrom,
    readyDateTo = '',
    setReadyDateTo,
    readyGroupIdFilter = '',
    setReadyGroupIdFilter,
    limit = 5,
  } = useContext(ProposedTitleContext);

  const [processingId, setProcessingId] = useState(null);
  const [localSchedules, setLocalSchedules] = useState([]);
  const [searchInput, setSearchInput] = useState(readySearch);

  // Sync local input with context (e.g., after ResetReadyFilters)
  useEffect(() => {
    setSearchInput(readySearch);
  }, [readySearch]);

  // Map context data to rows
  useEffect(() => {
    if (!readyTitles) return;
    setLocalSchedules(readyTitles.map(mapReadyTitleToSchedule));
  }, [readyTitles]);

  // Debounce search input -> context
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== readySearch) {
        setReadyCurrentPage(1);
        setReadySearch(searchInput);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, readySearch, setReadySearch, setReadyCurrentPage]);

  // ----- Handlers -----
  const handleMarkDone = useCallback(
    async (id) => {
      setProcessingId(id);
      try {
        if (onMarkDone) {
          await onMarkDone(id);
        } else if (UpdateProposedTitle) {
          await UpdateProposedTitle(id, { status: 'Done' });
        } else {
          await new Promise((r) => setTimeout(r, 1000));
          setLocalSchedules((prev) =>
            prev.map((g) => (g.id === id ? { ...g, status: 'Done' } : g))
          );
        }
      } catch (err) {
        console.error('Error marking defense as done:', err);
      } finally {
        setProcessingId(null);
      }
    },
    [onMarkDone, UpdateProposedTitle]
  );

  const goToPage = useCallback(
    (page) => {
      const clamped = Math.min(Math.max(1, page), readyTotalPages);
      setReadyCurrentPage(clamped);
    },
    [readyTotalPages, setReadyCurrentPage]
  );

  const handleItemsPerPageChange = () => {};

  const indexOfFirstItem = (readyCurrentPage - 1) * limit + 1;
  const indexOfLastItem = Math.min(readyCurrentPage * limit, totalReadyTitles);

  // ============================================================
  // FIXED TABLE BODY HEIGHT
  // ------------------------------------------------------------
  // Constant height regardless of entry count. Adjust the px
  // value below to change how many rows are visible before
  // the body starts scrolling. ~456px ≈ 6 rows (76px each).
  // ============================================================
  const TABLE_BODY_HEIGHT = 'max-h-[456px]';

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className={`${CARD} overflow-hidden`}>
      {/* ---------- HEADER ---------- */}
      <div className="p-6 bg-blue-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {isLoading ? (
          <>
            <div className="space-y-2">
              <div className="h-6 w-40 rounded bg-blue-700 animate-pulse" />
              <div className="h-4 w-72 max-w-full rounded bg-blue-800 animate-pulse" />
            </div>
            <div className="h-10 w-full sm:w-64 rounded-xl bg-blue-700 animate-pulse" />
          </>
        ) : (
          <>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-300" />
                {title}
              </h3>
              <p className="text-blue-200 text-sm mt-0.5">{subtitle}</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
              <input
                type="text"
                placeholder="Search group or code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border-2 border-transparent rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-yellow-400 w-full sm:w-64"
              />
            </div>
          </>
        )}
      </div>

      {/* ---------- FIXED HEIGHT SCROLLABLE TABLE ---------- */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-blue-100 border-b-2 border-yellow-400 text-xs uppercase tracking-wider text-blue-950 font-bold">
              <th className="py-4 px-6">Group Name</th>
              <th className="py-4 px-6">Referral Code</th>
              <th className="py-4 px-6">Defense Date</th>
              <th className="py-4 px-6">Time</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
        </table>
        <div className={`${TABLE_BODY_HEIGHT} overflow-y-auto`}>
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-blue-100 text-sm">
              {isLoading ? (
                [...Array(limit)].map((_, i) => <DefenseRowSkeleton key={i} />)
              ) : localSchedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Award className="w-8 h-8 text-blue-200" />
                      No defense schedules found
                    </div>
                  </td>
                </tr>
              ) : (
                localSchedules.map((defense) => {
                  const isDone = defense.status === 'Done';
                  const isProcessingRow = processingId === defense.id;

                  return (
                    <tr
                      key={defense.id}
                      className={`transition-colors ${
                        isDone
                          ? 'bg-emerald-50/40'
                          : 'odd:bg-white even:bg-blue-50/60 hover:bg-yellow-50'
                      }`}
                    >
                      <td className="py-4 px-6 font-bold text-blue-950">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-900 text-yellow-300 flex items-center justify-center font-extrabold text-xs shadow-sm">
                            {getInitials(defense.groupName)}
                          </div>
                          <div>
                            <div>{defense.groupName}</div>
                            <div className="text-[11px] font-normal text-slate-500 truncate max-w-[220px]">
                              {defense.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <code className="px-2.5 py-1 bg-white text-blue-800 border border-blue-200 rounded-lg text-xs font-mono font-bold">
                          {defense.referralCode}
                        </code>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          {formatDate(defense.defenseDate)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <Clock className="w-4 h-4 text-blue-600" />
                          {defense.defenseTime}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-yellow-100 text-yellow-900 border-yellow-300'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Done
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              Scheduled
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-100 text-blue-900 font-bold text-xs rounded-xl border border-blue-300 cursor-not-allowed">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMarkDone(defense.id)}
                            disabled={isProcessingRow}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                          >
                            {isProcessingRow ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Done
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- PAGINATION (BACK-END DRIVEN) ---------- */}
      {!isLoading && totalReadyTitles > 0 && (
        <div className="px-6 py-4 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-blue-50">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>Show</span>
            <select
              value={limit}
              onChange={handleItemsPerPageChange}
              disabled
              className="px-2 py-1 border border-blue-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
            <span className="hidden sm:inline ml-2">
              Showing {indexOfFirstItem} to {indexOfLastItem} of {totalReadyTitles} schedules
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(readyCurrentPage - 1)}
              disabled={readyCurrentPage === 1}
              className={`p-2 rounded-lg border transition-all ${
                readyCurrentPage === 1
                  ? 'border-blue-100 text-blue-200 cursor-not-allowed'
                  : 'border-blue-300 text-blue-900 bg-white hover:bg-yellow-100 hover:border-yellow-400'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(readyTotalPages, 5) }, (_, i) => {
                let pageNumber;
                if (readyTotalPages <= 5) pageNumber = i + 1;
                else if (readyCurrentPage <= 3) pageNumber = i + 1;
                else if (readyCurrentPage >= readyTotalPages - 2)
                  pageNumber = readyTotalPages - 4 + i;
                else pageNumber = readyCurrentPage - 2 + i;

                return (
                  <button
                    key={i}
                    onClick={() => goToPage(pageNumber)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                      readyCurrentPage === pageNumber
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
              onClick={() => goToPage(readyCurrentPage + 1)}
              disabled={readyCurrentPage === readyTotalPages || readyTotalPages === 0}
              className={`p-2 rounded-lg border transition-all ${
                readyCurrentPage === readyTotalPages || readyTotalPages === 0
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
  );
}