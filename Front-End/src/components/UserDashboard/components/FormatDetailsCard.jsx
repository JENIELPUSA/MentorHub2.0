import React from 'react';
import { FileSpreadsheet, FileText, Download, Eye, Calendar, User } from 'lucide-react';

const FormatDetailsCard = ({ formatDetails, onViewFile, onDownloadFile }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    console.log("formatDetails", formatDetails)

    const getFileNameFromUrl = (url) => {
        try {
            const parts = url.split('/');
            const lastPart = parts[parts.length - 1];
            return decodeURIComponent(lastPart.split('?')[0] || 'document.pdf');
        } catch (e) {
            return 'document.pdf';
        }
    };

    // EMPTY STATE
    if (!formatDetails) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm h-full">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                        <FileSpreadsheet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Format Details
                    </h2>
                </div>
                <div className="text-center py-6">
                    <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        No format assigned yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        Wait for the admin to assign a format
                    </p>
                </div>
            </div>
        );
    }

    const { titleFormat, description, type, fileUrl, createdAt, uploadedBy } = formatDetails;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                        <FileSpreadsheet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Format Details
                    </h2>
                </div>
                {type && (
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full">
                        {type}
                    </span>
                )}
            </div>

            {/* Title Format */}
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider mb-1">
                    Title Format
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {titleFormat || 'N/A'}
                </p>
            </div>

            {/* Description */}
            {description && (
                <div className="mb-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">
                        Description
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                        {description}
                    </p>
                </div>
            )}

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                        {formatDate(createdAt)}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                        {uploadedBy?.username || uploadedBy?.email || 'Admin'}
                    </span>
                </div>
            </div>

            {/* File Actions */}
            {fileUrl && (
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {getFileNameFromUrl(fileUrl)}
                        </span>
                    </div>
                    <button
                        onClick={() => onViewFile?.(fileUrl, titleFormat || 'Format Document', getFileNameFromUrl(fileUrl))}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                        title="View File"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDownloadFile?.(fileUrl)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition"
                        title="Download File"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FormatDetailsCard;