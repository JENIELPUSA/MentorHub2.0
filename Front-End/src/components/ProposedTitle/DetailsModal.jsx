import React from 'react';
import {
    X, History, Calendar, Link as LinkIcon,
    Eye, ExternalLink
} from 'lucide-react';

export default function DetailsModal({
    item,
    onClose,
    onOpenPdfViewer,
    getActualDisplayStatus,
    getStatusBadgeClass,
    getStatusIconComponent,
    getActionBadgeClass,
    formatDate,
}) {
    if (!item) return null;

    const displayStatus = getActualDisplayStatus(item);
    const trackingHistory = Array.isArray(item.titleUrlTracking)
        ? [...item.titleUrlTracking].sort((a, b) => new Date(b.date) - new Date(a.date))
        : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200 dark:border-gray-700 flex-shrink-0">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Submission details &amp; URL tracking history
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition flex-shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(displayStatus)}`}>
                            {getStatusIconComponent(displayStatus)} {displayStatus}
                        </span>
                        <span className="text-[11px] text-slate-400">
                            Uploaded {formatDate(item.createdAt)}
                        </span>
                        {item.uploaderName && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                by <strong>{item.uploaderName}</strong>
                            </span>
                        )}
                    </div>

                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {item.description || 'No description provided.'}
                        </p>
                    </div>

                    {item.remarks && (
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Remarks</h3>
                            <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                                “{item.remarks}”
                            </p>
                        </div>
                    )}

                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                            <History className="w-4 h-4" />
                            URL Tracking History
                            <span className="ml-1 px-1.5 py-0.5 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300 rounded-full text-[10px]">
                                {trackingHistory.length}
                            </span>
                        </h3>

                        {trackingHistory.length === 0 ? (
                            <div className="text-center py-6 bg-slate-50 dark:bg-gray-700/50 rounded-xl">
                                <LinkIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                                <p className="text-xs text-slate-400">No tracking history available</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {trackingHistory.map((track, index) => {
                                    const isLatest = index === 0;
                                    return (
                                        <div
                                            key={track._id || index}
                                            className="relative bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-700 rounded-xl p-3"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getActionBadgeClass(track.action)}`}>
                                                        {track.action}
                                                    </span>
                                                    {isLatest && (
                                                        <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                                                            ● Latest
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(track.date)}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                                                {track.remarks || 'No remarks'}
                                            </p>

                                            <div className="flex items-center gap-2 flex-wrap">
                                                {isLatest && (
                                                    <button
                                                        onClick={() => onOpenPdfViewer(item, track.url, track._id)}
                                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-lg transition"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        View
                                                    </button>
                                                )}

                                                <a
                                                    href={track.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Open URL
                                                </a>
                                                <span className="text-[10px] text-slate-400 truncate max-w-[200px]" title={track.url}>
                                                    {track.url?.split('/').pop() || track.url}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 p-4 border-t border-slate-200 dark:border-gray-700 flex-shrink-0 bg-slate-50 dark:bg-gray-800/60">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-lg transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}