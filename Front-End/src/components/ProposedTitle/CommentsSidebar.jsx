import React, { useEffect, useRef } from 'react';
import {
    MessageSquare, XCircle, Send, Loader2, Trash2
} from 'lucide-react';

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
}) {
    const commentsEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && comments.length > 0) {
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comments, isOpen]);

    if (!isOpen) return null;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-slate-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Comments
                        {comments.length > 0 && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                {comments.length}
                            </span>
                        )}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                        <XCircle className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                {activeTrackingId && (
                    <p className="mt-2 text-[10px] text-slate-400 truncate" title={activeTrackingId}>
                        Tracking ID: <span className="font-mono">{activeTrackingId}</span>
                    </p>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No comments yet</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Be the first to leave a comment</p>
                    </div>
                ) : (
                    <>
                        {comments.map((comment) => {
                            const author = comment.author || comment.userId || {};
                            const authorName = author.first_name && author.last_name
                                ? `${author.first_name} ${author.last_name}`
                                : author.first_name || author.last_name || 'Unknown User';

                            const isOwner = isCommentOwner(comment);
                            const userRole = author.role || comment.userRole || '';
                            const shouldShowBadge = userRole && userRole.toLowerCase() !== 'student';

                            return (
                                <div
                                    key={comment._id}
                                    className="bg-slate-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-gray-600 transition"
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

                                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words pl-8">
                                                {comment.text}
                                            </p>

                                            <div className="flex items-center gap-3 mt-1.5 pl-8">
                                                {isOwner && (
                                                    <button
                                                        onClick={() => onDeleteComment(comment._id)}
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

            <div className="p-4 border-t border-slate-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex gap-2">
                    <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 resize-none px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition min-h-[60px] max-h-[120px]"
                        rows="2"
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting || !commentText.trim()}
                        className="self-end px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-1"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline text-sm">Send</span>
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}