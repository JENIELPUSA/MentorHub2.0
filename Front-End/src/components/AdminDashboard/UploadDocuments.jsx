import React, { useState, useContext } from 'react';
import {
    Upload,
    FileCheck2,
    CheckCircle2,
    Send,
    Loader2,
    XCircle,
    FileText,
    Layers,
    Clock,
} from 'lucide-react';
import { FormatContext } from '../../contexts/FormatContext/FormatContext';

const UploadCardSkeleton = () => (
    <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg animate-pulse bg-slate-200" />
            <div className="space-y-1.5 flex-1">
                <div className="h-3 w-48 rounded animate-pulse bg-slate-200" />
                <div className="h-2 w-32 rounded animate-pulse bg-slate-200" />
            </div>
        </div>
        <div className="h-8 w-32 rounded-lg animate-pulse bg-slate-200" />
    </div>
);

export default function UploadDocuments({ isLoading = false, onUploaded }) {
    const [titleFormat, setTitleFormat] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('Capstone');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [toastMessage, setToastMessage] = useState(null);

    const { CreateFormat, formats } = useContext(FormatContext);

    console.log("formats", formats)

    /* ============================
       TOAST HELPER
       ============================ */
    const showNotification = (msg, isError = false) => {
        setToastMessage({ msg, isError });
        setTimeout(() => setToastMessage(null), 3000);
    };

    /* ============================
       VALIDATION CONSTANTS
       ============================ */
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

    /* ============================
       FILE PICKER HANDLER
       ============================ */
    const handleUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_SIZE) {
            showNotification('❌ File too large. Max 50MB.', true);
            e.target.value = '';
            return;
        }

        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExt)) {
            showNotification('❌ Invalid file type. PDF, DOC, or DOCX only.', true);
            e.target.value = '';
            return;
        }

        setSelectedFile(file);
        setIsSubmitted(false);
        setUploadProgress(0);
        e.target.value = '';
    };

    /* ============================
       SUBMIT HANDLER
       ============================ */
    const handleSubmit = async () => {
        if (!titleFormat.trim()) {
            showNotification('❌ Title is required', true);
            return;
        }
        if (!selectedFile) {
            showNotification('❌ Please select a file', true);
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const progressInterval = setInterval(() => {
            setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        try {
            const formData = new FormData();
            formData.append('titleFormat', titleFormat.trim());
            formData.append('description', description.trim());
            formData.append('type', type);
            formData.append('file', selectedFile);

            const result = await CreateFormat(formData);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (result?.success === true || result?.ok === true) {
                setIsSubmitted(true);
                showNotification('✅ Sample format uploaded successfully!');

                // Reset form fields
                setTitleFormat('');
                setDescription('');
                setType('Capstone');
                setSelectedFile(null);

                // The new item will appear automatically via `formats` from context
                // (assuming CreateFormat refreshes the list)

                onUploaded?.(result.data || result);
            } else {
                const errMsg = result?.error || result?.message || 'Unknown error';
                showNotification(`❌ Upload failed: ${errMsg}`, true);
            }
        } catch (error) {
            clearInterval(progressInterval);
            showNotification(`❌ Upload failed: ${error.message}`, true);
        } finally {
            setIsUploading(false);
        }
    };

    const canSubmit = titleFormat.trim() && selectedFile && !isSubmitted && !isUploading;

    /* ============================
       FORMAT HELPERS
       ============================ */
    const formatBytes = (bytes) => {
        if (!bytes) return '0 MB';
        const mb = bytes / 1024 / 1024;
        return `${mb.toFixed(2)} MB`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Extract filename from URL
    const getFileNameFromUrl = (url) => {
        if (!url) return 'Unknown file';
        try {
            const parts = url.split('/');
            return decodeURIComponent(parts[parts.length - 1]);
        } catch {
            return 'Unknown file';
        }
    };

    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 hover:shadow-lg transition-shadow duration-300">
            {/* Toast */}
            {toastMessage && (
                <div
                    className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 text-white text-xs font-medium rounded-xl shadow-2xl animate-bounce ${toastMessage.isError ? 'bg-red-600' : 'bg-slate-900'
                        }`}
                >
                    {toastMessage.isError ? (
                        <XCircle className="w-4 h-4 text-red-200" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>{toastMessage.msg}</span>
                </div>
            )}

            {/* Section Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-sm font-semibold text-blue-950 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-blue-900" /> Sample Format
                    </h3>
                    <p className="text-[11px] text-slate-400 font-normal">
                        Submit a Capstone / Thesis sample format template
                    </p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                    Single Upload
                </span>
            </div>

            {isLoading ? (
                <UploadCardSkeleton />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* ============================
                        LEFT: UPLOAD SAMPLE FORMAT
                       ============================ */}
                    <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                                <Upload className="w-3.5 h-3.5 text-blue-900" />
                            </div>
                            <span className="text-[11px] font-semibold text-blue-950 uppercase tracking-wider">
                                Upload Sample Format
                            </span>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                                Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={titleFormat}
                                onChange={(e) => setTitleFormat(e.target.value)}
                                placeholder="e.g., Capstone Sample Format 2026"
                                disabled={isUploading}
                                className="w-full px-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition disabled:opacity-60"
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                                Type <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                disabled={isUploading}
                                className="w-full px-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition disabled:opacity-60"
                            >
                                <option value="Capstone">Capstone</option>
                                <option value="Thesis">Thesis</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                                Description <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Short description..."
                                rows={2}
                                disabled={isUploading}
                                className="w-full px-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none disabled:opacity-60"
                            />
                        </div>

                        {/* File Picker */}
                        <div className="flex items-center gap-3 pt-1">
                            <div
                                className={`p-2.5 rounded-lg border shrink-0 ${selectedFile
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-slate-50 border-slate-200'
                                    }`}
                            >
                                {selectedFile ? (
                                    <FileCheck2 className="w-5 h-5 text-emerald-600" />
                                ) : (
                                    <Upload className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-semibold text-slate-800 truncate">
                                    {selectedFile ? selectedFile.name : 'No file selected'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-normal truncate">
                                    {selectedFile
                                        ? `${formatBytes(selectedFile.size)} • ${selectedFile.type || 'Unknown type'}`
                                        : 'PDF • DOC • DOCX • Max 50MB'}
                                </p>
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded shrink-0">
                                Req
                            </span>
                        </div>

                        {/* Progress Bar */}
                        {isUploading && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-2 mt-1">
                            {isUploading ? (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-700">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading... {uploadProgress}%
                                </span>
                            ) : selectedFile ? (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                                    <CheckCircle2 className="w-3 h-3" /> Ready to submit
                                </span>
                            ) : (
                                <span className="text-[10px] font-medium text-amber-600">
                                    No file selected
                                </span>
                            )}

                            <div className="flex items-center gap-2">
                                <label
                                    className={`cursor-pointer text-[10px] font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors duration-200 ${isUploading ? 'opacity-50 pointer-events-none' : ''
                                        }`}
                                >
                                    {selectedFile ? 'Replace File' : 'Choose File'}
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        className="hidden"
                                        onChange={handleUpload}
                                        disabled={isUploading}
                                    />
                                </label>

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    className={`flex items-center gap-1 text-[10px] font-semibold px-3 py-1.5 rounded-lg border transition-colors duration-200 ${!canSubmit
                                        ? 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed'
                                        : 'text-white bg-blue-900 hover:bg-blue-800 border-blue-900'
                                        }`}
                                >
                                    {isUploading ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Send className="w-3 h-3" />
                                    )}
                                    {isUploading ? 'Uploading' : 'Submit'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ============================
                        RIGHT: DISPLAY SAMPLE FORMATS
                       ============================ */}
                    <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3 hover:border-blue-300 transition-all duration-200 bg-slate-50/40">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-amber-50 border border-amber-100 rounded-lg">
                                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                                </div>
                                <span className="text-[11px] font-semibold text-blue-950 uppercase tracking-wider">
                                    Sample Formats
                                </span>
                            </div>
                            <span className="text-[10px] font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                {formats?.length || 0} total
                            </span>
                        </div>

                        {!formats || formats.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 border border-dashed border-slate-200 rounded-lg bg-white/60">
                                <FileText className="w-8 h-8 text-slate-300 mb-2" />
                                <p className="text-[11px] font-medium text-slate-500">
                                    No sample formats uploaded yet
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    Submitted sample formats will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
                                {formats.map((item) => (
                                    <div
                                        key={item._id}
                                        className="bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg shrink-0">
                                                <FileText className="w-4 h-4 text-blue-900" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-[12px] font-semibold text-slate-800 truncate">
                                                        {item.titleFormat}
                                                    </p>
                                                    <span
                                                        className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 border ${item.type === 'Thesis'
                                                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                                                            : 'text-blue-900 bg-blue-50 border-blue-200'
                                                            }`}
                                                    >
                                                        {item.type}
                                                    </span>
                                                </div>

                                                {item.description && (
                                                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <a
                                                        href={item.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[9px] text-blue-700 hover:underline truncate max-w-[140px]"
                                                        title={getFileNameFromUrl(item.fileUrl)}
                                                    >
                                                        📄 {getFileNameFromUrl(item.fileUrl)}
                                                    </a>
                                                    <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {formatDate(item.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}