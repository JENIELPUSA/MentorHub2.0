import React, { useContext, useEffect, useRef, useMemo } from 'react';
import {
    MessageSquare, XCircle, Send, Loader2, Trash2, Eye,
    MapPin, Highlighter, Target,
    AlertCircle, Type, Move, AlignLeft,
    Image as ImageIcon, Palette, Maximize,
    FileWarning, Ruler
} from 'lucide-react';

import { AuthContext } from '../../contexts/AuthContext';

const getIconForType = (type) => {
    switch (type) {
        case 'wrong_margin': return Ruler;
        case 'wrong_font': return Type;
        case 'wrong_spacing': return Move;
        case 'wrong_alignment': return AlignLeft;
        case 'wrong_image': return ImageIcon;
        case 'wrong_color': return Palette;
        case 'wrong_size': return Maximize;
        case 'grammar': return FileWarning;
        case 'other': return AlertCircle;
        default: return MessageSquare;
    }
};

const getColorTheme = (color) => {
    const map = {
        red: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700', text: 'text-red-700 dark:text-red-400', solid: 'bg-red-500', ring: 'ring-red-200 dark:ring-red-800' },
        purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-400', solid: 'bg-purple-500', ring: 'ring-purple-200 dark:ring-purple-800' },
        orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-400', solid: 'bg-orange-500', ring: 'ring-orange-200 dark:ring-orange-800' },
        blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-400', solid: 'bg-blue-500', ring: 'ring-blue-200 dark:ring-blue-800' },
        pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-300 dark:border-pink-700', text: 'text-pink-700 dark:text-pink-400', solid: 'bg-pink-500', ring: 'ring-pink-200 dark:ring-pink-800' },
        green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-400', solid: 'bg-green-500', ring: 'ring-green-200 dark:ring-green-800' },
        cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-300 dark:border-cyan-700', text: 'text-cyan-700 dark:text-cyan-400', solid: 'bg-cyan-500', ring: 'ring-cyan-200 dark:ring-cyan-800' },
        yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-400', solid: 'bg-yellow-500', ring: 'ring-yellow-200 dark:ring-yellow-800' },
        slate: { bg: 'bg-slate-50 dark:bg-slate-900/20', border: 'border-slate-300 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', solid: 'bg-slate-500', ring: 'ring-slate-200 dark:ring-slate-800' }
    };
    return map[color] || map.yellow;
};

export default function CommentsSidebar({
    isOpen,
    onClose,
    comments = [],
    activeTrackingId,
    commentText,
    setCommentText,
    onSubmit,
    isSubmitting,
    isCommentOwner,
    onDeleteComment,
    formatCommentDate,
    getRoleBadgeColor,
    onCommentClick,
    hoveredCommentId,
    setHoveredCommentId,
    currentPage,
    showAnnotations = true,
}) {
    const commentsEndRef = useRef(null);
    const { role } = useContext(AuthContext);
    const isReadOnly = role === 'student';

    const validComments = useMemo(() => {
        return (comments || []).filter((c) => {
            if (!c) return false;
            if (!c._id) return false;
            if (!c.text || !String(c.text).trim()) return false;
            return true;
        });
    }, [comments]);

    const annotationCount = useMemo(() => {
        return validComments.filter((c) => c.pageNumber && c.position).length;
    }, [validComments]);

    useEffect(() => {
        if (isOpen && validComments.length > 0 && !hoveredCommentId) {
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [validComments, isOpen, hoveredCommentId]);

    useEffect(() => {
        if (hoveredCommentId) {
            const el = document.getElementById(`comment-${hoveredCommentId}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [hoveredCommentId]);

    if (!isOpen) return null;

    const handleKeyDown = (e) => {
        if (isReadOnly) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    const handleCommentClick = (comment) => {
        if (comment.pageNumber && onCommentClick) {
            onCommentClick(comment);
        }
    };

    return (
        <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-slate-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Comments
                        {validComments.length > 0 && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                {validComments.length}
                            </span>
                        )}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition">
                        <XCircle className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {annotationCount > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-yellow-700 dark:text-yellow-400">
                        <Highlighter className="w-3 h-3" />
                        <span className="font-medium">
                            {annotationCount} inline annotation{annotationCount > 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {activeTrackingId && (
                    <p className="mt-2 text-[10px] text-slate-400 truncate" title={activeTrackingId}>
                        Tracking ID: <span className="font-mono">{activeTrackingId}</span>
                    </p>
                )}

                {isReadOnly && (
                    <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-gray-700 rounded-lg text-[10px] text-slate-500 dark:text-slate-400">
                        <Eye className="w-3 h-3" />
                        <span>View-only mode</span>
                    </div>
                )}

                {!isReadOnly && showAnnotations && (
                    <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-[10px] text-yellow-700 dark:text-yellow-400">
                        <Highlighter className="w-3 h-3" />
                        <span>I-select ang text o mag-draw ng region sa PDF</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {validComments.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No comments yet</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            {isReadOnly ? 'Comments will appear here' : 'Be the first to leave a comment'}
                        </p>
                    </div>
                ) : (
                    <>
                        {validComments.map((comment) => {
                            const author = comment.author || comment.userId || {};
                            const authorName = author.first_name && author.last_name
                                ? `${author.first_name} ${author.last_name}`
                                : author.first_name || author.last_name || author.name || comment.userName || 'Unknown User';

                            const isOwner = isCommentOwner(comment);
                            const userRole = author.role || comment.userRole || '';
                            const shouldShowBadge = userRole && userRole.toLowerCase() !== 'student';
                            const canDelete = isOwner && !isReadOnly;

                            const hasAnnotation = comment.pageNumber && comment.position;
                            const isOnCurrentPage = hasAnnotation && Number(comment.pageNumber) === Number(currentPage);
                            const isHovered = hoveredCommentId === comment._id;

                            const annotationType = comment.annotationType || 'text';
                            const isRegion = annotationType && annotationType !== 'text';
                            const annotationColor = comment.color || 'yellow';
                            const colorTheme = getColorTheme(annotationColor);
                            const TypeIcon = getIconForType(annotationType);

                            let cardClass = 'bg-slate-50 dark:bg-gray-700 border-transparent hover:bg-slate-100 dark:hover:bg-gray-600';
                            if (hasAnnotation) {
                                if (isHovered) {
                                    cardClass = 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800';
                                } else if (isRegion) {
                                    cardClass = `${colorTheme.bg} ${colorTheme.border} hover:opacity-90`;
                                } else if (isOnCurrentPage) {
                                    cardClass = 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 hover:border-yellow-400';
                                } else {
                                    cardClass = 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300';
                                }
                            }

                            return (
                                <div
                                    key={comment._id}
                                    id={`comment-${comment._id}`}
                                    onClick={() => handleCommentClick(comment)}
                                    onMouseEnter={() => hasAnnotation && setHoveredCommentId?.(comment._id)}
                                    onMouseLeave={() => setHoveredCommentId?.(null)}
                                    className={`rounded-lg p-3 transition border-2 ${cardClass} ${hasAnnotation ? 'cursor-pointer' : ''}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium text-[10px] flex-shrink-0">
                                                    {authorName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                                    {authorName}
                                                </span>
                                                {author.id_number && (
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                                                        {author.id_number}
                                                    </span>
                                                )}
                                                {shouldShowBadge && (
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getRoleBadgeColor(userRole)}`}>
                                                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 ml-auto">
                                                    {formatCommentDate(comment.createdAt)}
                                                </span>
                                            </div>

                                            {hasAnnotation && (
                                                <div className="flex items-center gap-1.5 mb-1.5 pl-8 flex-wrap">
                                                    {isRegion && comment.annotationLabel && (
                                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white ${colorTheme.solid}`}>
                                                            <TypeIcon className="w-2.5 h-2.5" />
                                                            {comment.annotationLabel}
                                                        </span>
                                                    )}
                                                    {!isRegion && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-yellow-100 text-yellow-700">
                                                            <MessageSquare className="w-2.5 h-2.5" />
                                                            Text
                                                        </span>
                                                    )}
                                                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${isOnCurrentPage ? 'text-yellow-700 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        <MapPin className="w-2.5 h-2.5" />
                                                        Page {comment.pageNumber}
                                                    </span>
                                                    {isOnCurrentPage && (
                                                        <span className="inline-flex items-center gap-0.5 text-[9px] text-blue-600 dark:text-blue-400">
                                                            <Target className="w-2.5 h-2.5" />
                                                            visible
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {comment.selectedText && (
                                                <div className="ml-8 mb-2 px-2 py-1 bg-white dark:bg-gray-800 border-l-2 border-yellow-400 rounded">
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                                                        "{comment.selectedText}"
                                                    </p>
                                                </div>
                                            )}

                                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words pl-8">
                                                {comment.text}
                                            </p>

                                            <div className="flex items-center gap-3 mt-1.5 pl-8">
                                                {canDelete && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteComment(comment._id);
                                                        }}
                                                        className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 transition flex items-center gap-1 text-[10px]"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        Delete
                                                    </button>
                                                )}
                                                {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                                                    <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                                        (edited)
                                                    </span>
                                                )}
                                                {hasAnnotation && (
                                                    <span className="ml-auto text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                                                        <Highlighter className="w-2.5 h-2.5" />
                                                        Click to jump
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={commentsEndRef} />
                    </>
                )}
            </div>

            {!isReadOnly ? (
                <div className="p-4 border-t border-slate-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex gap-2">
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a general comment..."
                            className="flex-1 resize-none px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition min-h-[60px] max-h-[120px]"
                            rows="2"
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            onClick={onSubmit}
                            disabled={isSubmitting || !commentText.trim()}
                            className="self-end px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-1"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span className="hidden sm:inline text-sm">Send</span>
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                        Press Enter to send, Shift+Enter for new line. Para sa annotation, i-select ang text o mag-draw ng region sa PDF.
                    </p>
                </div>
            ) : (
                <div className="p-4 border-t border-slate-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-xs text-slate-500 dark:text-slate-400">
                        <Eye className="w-4 h-4" />
                        <span>You have view-only access to comments</span>
                    </div>
                </div>
            )}
        </div>
    );
}