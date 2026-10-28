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
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-xl border border-blue-200 flex flex-col overflow-hidden">
                {/* Header — navy with yellow accent */}
                <div className="flex items-start justify-between gap-4 p-5 bg-blue-900 border-b-4 border-yellow-400 flex-shrink-0">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-white truncate">{item.title}</h2>
                        <p className="text-xs text-blue-200 mt-0.5">
                            Submission details &amp; URL tracking history
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-blue-100 hover:text-white hover:bg-blue-800 rounded-lg transition flex-shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(displayStatus)}`}>
                            {getStatusIconComponent(displayStatus)} {displayStatus}
                        </span>
                        <span className="text-[11px] text-blue-500">
                            Uploaded {formatDate(item.createdAt)}
                        </span>
                        {item.uploaderName && (
                            <span className="text-[11px] text-slate-500">
                                by <strong className="text-blue-900">{item.uploaderName}</strong>
                            </span>
                        )}
                    </div>

                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">Description</h3>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                            {item.description || 'No description provided.'}
                        </p>
                    </div>

                    {item.remarks && (
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">Remarks</h3>
                            <p className="text-sm text-slate-700 italic">"{item.remarks}"</p>
                        </div>
                    )}

                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-1.5">
                            <History className="w-4 h-4 text-blue-700" />
                            URL Tracking History
                            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 rounded-full text-[10px] font-bold">
                                {trackingHistory.length}
                            </span>
                        </h3>

                        {trackingHistory.length === 0 ? (
                            <div className="text-center py-6 bg-blue-50 border border-blue-200 rounded-xl">
                                <LinkIcon className="w-8 h-8 text-blue-200 mx-auto mb-1" />
                                <p className="text-xs text-blue-500">No tracking history available</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {trackingHistory.map((track, index) => {
                                    const isLatest = index === 0;
                                    return (
                                        <div
                                            key={track._id || index}
                                            className={`relative bg-blue-50 border rounded-xl p-3 ${
                                                isLatest ? 'border-yellow-400 ring-1 ring-yellow-200' : 'border-blue-200'
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getActionBadgeClass(track.action)}`}>
                                                        {track.action}
                                                    </span>
                                                    {isLatest && (
                                                        <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 border border-yellow-300 px-1.5 py-0.5 rounded-full">
                                                            ● Latest
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-blue-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(track.date)}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-600 mb-2">
                                                {track.remarks || 'No remarks'}
                                            </p>

                                            <div className="flex items-center gap-2 flex-wrap">
                                                {isLatest && (
                                                    <button
                                                        onClick={() => onOpenPdfViewer(item, track.url, track._id)}
                                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-950 bg-yellow-400 hover:bg-yellow-300 px-2.5 py-1 rounded-lg transition shadow-sm"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        View
                                                    </button>
                                                )}

                                                <a
                                                    href={track.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-800 bg-white hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg transition"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Open URL
                                                </a>
                                                <span className="text-[10px] text-blue-500 truncate max-w-[200px]" title={track.url}>
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

                <div className="flex flex-wrap items-center justify-end gap-2 p-4 border-t border-blue-100 flex-shrink-0 bg-blue-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-blue-900 bg-white border border-blue-200 hover:bg-blue-100 rounded-lg transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}