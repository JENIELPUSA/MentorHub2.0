import React, { useState, useCallback, useContext, useEffect } from 'react';
import {
  Award,
  Search,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ExternalLink,
  Archive,
} from 'lucide-react';

import { ProposedTitleContext } from '../../contexts/ProposedTitleContext/ProposedTitleContext';

/* ============================================================
   THEME
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
   MAP CONTEXT DATA -> CARD SHAPE
   ============================================================ */
const mapReadyTitleToCard = (titleItem) => {
  const group = titleItem.groupInfo || {};

  const latestTracking =
    titleItem.latestTracking &&
    (titleItem.latestTracking.preview || titleItem.latestTracking.url)
      ? titleItem.latestTracking
      : Array.isArray(titleItem.titleUrlTracking) && titleItem.titleUrlTracking.length > 0
      ? [...titleItem.titleUrlTracking].sort(
          (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
        )[0]
      : null;

  const defenseDateSource = latestTracking?.date || titleItem.createdAt;
  const preview = latestTracking?.preview || null;

  return {
    id: titleItem._id,
    groupName: group.name || titleItem.groupName || 'Unnamed Group',
    referralCode: group.referralCode || 'N/A',
    defenseDate: defenseDateSource,
    defenseTime: formatTime(defenseDateSource),
    defenseDateFormatted: formatDate(defenseDateSource),
    panel: titleItem.panel || 'TBA',
    status:
      titleItem.status === 'Ready for Defense' ? 'Scheduled' : titleItem.status,
    title: titleItem.title,
    remarks: titleItem.remarks,
    adviserStatus: group.adviserStatus,
    coadviserStatus: group.coadviserStatus,
    latestTracking,
    preview,
    pdfUrl: titleItem.fileUrl || latestTracking?.url || null,
    collegeLabel: titleItem.track || 'General',
    year: titleItem.createdAt
      ? new Date(titleItem.createdAt).getFullYear()
      : '',
    uploaderName: titleItem.uploaderName || '—',
  };
};

/* ============================================================
   SKELETON CARD
   ============================================================ */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 overflow-hidden animate-pulse">
    <div className="aspect-[3/4] w-full bg-blue-100" />
    <div className="p-3 space-y-2">
      <div className="h-3 w-16 bg-blue-100 rounded" />
      <div className="h-4 w-full bg-blue-100 rounded" />
      <div className="h-4 w-3/4 bg-blue-100 rounded" />
    </div>
  </div>
);

/* ============================================================
   PDF PREVIEW IMAGE
   ============================================================ */
const PreviewImage = ({ item }) => {
  const [imgError, setImgError] = useState(false);

  if (item.preview && !imgError) {
    return (
      <img
        src={item.preview}
        alt={item.title}
        className="w-full h-full object-cover object-top bg-blue-50"
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 gap-1">
      <Award className="w-10 h-10 text-blue-200" />
      <span className="text-[9px] text-blue-400 font-semibold uppercase tracking-wider">
        No Preview
      </span>
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function DefenseSchedule({
  isLoading = false,
  onMarkDone,
  title = 'Defense Schedule',
  subtitle = 'Groups scheduled for defense. Move to Archived once completed.',
}) {
  const {
    readyTitles = [],
    UpdateProposedTitle,
    totalReadyTitles = 0,
    readyTotalPages = 1,
    readyCurrentPage = 1,
    setReadyCurrentPage,
    readySearch = '',
    setReadySearch,
    limit = 8,
    FetchReadyTitle,
  } = useContext(ProposedTitleContext);

  const [processingId, setProcessingId] = useState(null);
  const [localSchedules, setLocalSchedules] = useState([]);
  const [searchInput, setSearchInput] = useState(readySearch);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    setSearchInput(readySearch);
  }, [readySearch]);

  useEffect(() => {
    if (!readyTitles) return;
    setLocalSchedules(readyTitles.map(mapReadyTitleToCard));
  }, [readyTitles]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== readySearch) {
        setReadyCurrentPage(1);
        setReadySearch(searchInput);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, readySearch, setReadySearch, setReadyCurrentPage]);

  const handleMarkDone = useCallback(
    async (id) => {
      setProcessingId(id);
      try {
        if (onMarkDone) {
          await onMarkDone(id);
        } else if (UpdateProposedTitle) {
          const result = await UpdateProposedTitle(id, { status: 'Done' });
          if (result.success === true) {
            FetchReadyTitle?.();
          }
        } else {
          await new Promise((r) => setTimeout(r, 1000));
          setLocalSchedules((prev) =>
            prev.map((g) => (g.id === id ? { ...g, status: 'Done' } : g))
          );
        }
      } catch (err) {
        console.error('Error moving defense to archived:', err);
      } finally {
        setProcessingId(null);
      }
    },
    [onMarkDone, UpdateProposedTitle, FetchReadyTitle]
  );

  const goToPage = useCallback(
    (page) => {
      const clamped = Math.min(Math.max(1, page), readyTotalPages);
      setReadyCurrentPage(clamped);
    },
    [readyTotalPages, setReadyCurrentPage]
  );

  const indexOfFirstItem = (readyCurrentPage - 1) * limit + 1;
  const indexOfLastItem = Math.min(readyCurrentPage * limit, totalReadyTitles);

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

      {/* ---------- CARD GRID — 4 columns sa desktop ---------- */}
      <div className="p-4 bg-blue-50/40">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(limit)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : localSchedules.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="flex flex-col items-center gap-2">
              <Award className="w-8 h-8 text-blue-200" />
              No defense schedules found
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {localSchedules.map((defense) => {
              const isDone = defense.status === 'Done';
              const isProcessingRow = processingId === defense.id;

              return (
                <div
                  key={defense.id}
                  onClick={() => setSelectedCard(defense)}
                  className="group relative bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 hover:shadow-2xl hover:border-blue-900/40 transition-all duration-300 overflow-hidden cursor-pointer"
                >
                  {/* ⭐ 1st PAGE PREVIEW — aspect 3/4 (mas malapad) */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-blue-50">
                    <PreviewImage item={defense} />

                    {/* Chapter badge */}
                    {defense.latestTracking?.chapter && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-blue-950 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow z-10">
                        {defense.latestTracking.chapter}
                      </div>
                    )}

                    {/* Status badge */}
                    <div
                      className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow z-10 ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : 'bg-blue-900/90 text-yellow-300'
                      }`}
                    >
                      {isDone ? 'Archived' : 'Sched'}
                    </div>

                    {/* HOVER OVERLAY */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/95 to-blue-950/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-md bg-yellow-400 text-blue-950 flex items-center justify-center font-extrabold text-xs shrink-0">
                          {getInitials(defense.groupName)}
                        </div>
                        <span className="text-[12px] font-bold truncate">
                          {defense.groupName}
                        </span>
                      </div>

                      <code className="text-[10px] font-mono font-bold text-yellow-300 bg-white/10 px-2 py-0.5 rounded mb-2 w-fit">
                        {defense.referralCode}
                      </code>

                      <h4 className="font-bold text-[15px] leading-snug line-clamp-3 mb-2">
                        {defense.title}
                      </h4>

                      <div className="space-y-1 text-[11px] text-blue-100 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-yellow-300" />
                          {defense.defenseDateFormatted}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-yellow-300" />
                          {defense.defenseTime}
                        </div>
                      </div>

                      {defense.panel && defense.panel !== 'TBA' && (
                        <div className="text-[11px] text-blue-200 mb-3">
                          <span className="font-semibold text-white">Panel:</span>{' '}
                          {defense.panel}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        {isDone ? (
                          <span className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-800/50 text-blue-200 font-bold text-[11px] rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Archived
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkDone(defense.id);
                            }}
                            disabled={isProcessingRow}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold text-[11px] rounded-md shadow-sm transition disabled:opacity-50"
                          >
                            {isProcessingRow ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Moving...
                              </>
                            ) : (
                              <>
                                <Archive className="w-3.5 h-3.5" />
                                Move to Archived
                              </>
                            )}
                          </button>
                        )}
                        {defense.pdfUrl && (
                          <a
                            href={defense.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-md backdrop-blur-sm transition flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom info */}
                  <div className="px-3 py-2 border-t border-blue-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider truncate">
                      {defense.collegeLabel}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase whitespace-nowrap ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-yellow-100 text-yellow-900'
                      }`}
                    >
                      {isDone ? 'Archived' : 'Scheduled'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------- PAGINATION ---------- */}
      {!isLoading && totalReadyTitles > 0 && (
        <div className="px-6 py-4 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-blue-50">
          <div className="text-sm text-slate-600">
            Showing{' '}
            <span className="font-bold text-blue-900">{indexOfFirstItem}</span>–
            <span className="font-bold text-blue-900">{indexOfLastItem}</span> of{' '}
            <span className="font-bold text-blue-900">{totalReadyTitles}</span> schedules
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

      {/* ---------- MODAL ---------- */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 bg-blue-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl border border-blue-200 border-t-4 border-t-yellow-400 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="group relative w-full h-[70vh] overflow-hidden bg-blue-50">
              {selectedCard.preview ? (
                <img
                  src={selectedCard.preview}
                  alt={selectedCard.title}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Award className="w-16 h-16 text-blue-200" />
                </div>
              )}

              <div className="absolute top-3 left-3 bg-yellow-400 text-blue-950 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow z-10">
                {selectedCard.latestTracking?.chapter || 'PDF'}
              </div>
              <div className="absolute top-3 right-3 bg-blue-900/90 text-yellow-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow z-10">
                PDF
              </div>

              <button
                onClick={() => setSelectedCard(null)}
                className="absolute top-3 w-8 h-8 bg-white/90 hover:bg-yellow-400 text-blue-900 rounded-md flex items-center justify-center shadow z-20 transition"
                style={{ right: '4.5rem' }}
              >
                ✕
              </button>

              {/* HOVER OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/95 to-blue-950/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-400 text-blue-950 flex items-center justify-center font-extrabold text-sm">
                    {getInitials(selectedCard.groupName)}
                  </div>
                  <div>
                    <div className="text-base font-bold">{selectedCard.groupName}</div>
                    <code className="text-[11px] font-mono text-yellow-300">
                      {selectedCard.referralCode}
                    </code>
                  </div>
                </div>

                <h2 className="font-bold text-white text-lg leading-snug mb-3">
                  {selectedCard.title}
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-[10px] text-blue-300 uppercase tracking-wider mb-0.5">
                      Date
                    </div>
                    <div className="text-sm font-semibold">
                      {selectedCard.defenseDateFormatted}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-blue-300 uppercase tracking-wider mb-0.5">
                      Time
                    </div>
                    <div className="text-sm font-semibold">
                      {selectedCard.defenseTime}
                    </div>
                  </div>
                </div>

                {selectedCard.panel && selectedCard.panel !== 'TBA' && (
                  <div className="bg-white/5 backdrop-blur-sm p-3 rounded-md mb-3">
                    <div className="text-[10px] text-blue-300 uppercase tracking-wider mb-1">
                      Panel
                    </div>
                    <div className="text-sm font-semibold">
                      {selectedCard.panel}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  {selectedCard.status === 'Done' ? (
                    <div className="flex-1 text-center py-2.5 bg-emerald-500/20 text-emerald-300 font-bold text-sm rounded-md flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Archived
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkDone(selectedCard.id);
                        setSelectedCard(null);
                      }}
                      className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold text-sm rounded-md shadow transition flex items-center justify-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Move to Archived
                    </button>
                  )}
                  {selectedCard.pdfUrl && (
                    <a
                      href={selectedCard.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-md backdrop-blur-sm transition flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}