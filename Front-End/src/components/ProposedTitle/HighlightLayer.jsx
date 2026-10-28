// HighlightLayer.jsx
import React, { useState } from 'react';
import {
    MessageSquare,
    AlertCircle, Type, Move, AlignLeft,
    Image as ImageIcon, Palette, Maximize,
    FileWarning, Ruler
} from 'lucide-react';

// ⭐ Icon per annotation type
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

// ⭐ Color config per color name
const getColorConfig = (color) => {
    const map = {
        red: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', label: '#ef4444' },
        purple: { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', label: '#a855f7' },
        orange: { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', label: '#f97316' },
        blue: { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', label: '#3b82f6' },
        pink: { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', label: '#ec4899' },
        green: { bg: 'rgba(34, 197, 94, 0.2)', border: '#22c55e', label: '#22c55e' },
        cyan: { bg: 'rgba(6, 182, 212, 0.15)', border: '#06b6d4', label: '#06b6d4' },
        yellow: { bg: 'rgba(250, 204, 21, 0.35)', border: '#eab308', label: '#eab308' },
        slate: { bg: 'rgba(100, 116, 139, 0.15)', border: '#64748b', label: '#64748b' }
    };
    return map[color] || map.yellow;
};

const HighlightLayer = ({
    comments,
    pageNumber,
    scale,
    onClickComment,
    currentUserId,
    getRoleBadgeColor
}) => {
    const [hoveredId, setHoveredId] = useState(null);

    const pageComments = (comments || []).filter(
        (c) => Number(c.pageNumber) === Number(pageNumber) && c.position
    );

    if (pageComments.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
            {pageComments.map((comment) => {
                const isRegion =
                    comment.annotationType && comment.annotationType !== 'text';
                const isTextHighlight = !isRegion;

                const colorConfig = getColorConfig(comment.color);
                const TypeIcon = getIconForType(comment.annotationType);
                const role = comment.userRole || comment.userId?.role;

                return (
                    <div
                        key={comment._id}
                        className="absolute pointer-events-auto cursor-pointer group"
                        style={{
                            left: comment.position.x * scale,
                            top: comment.position.y * scale,
                            width: comment.position.width * scale,
                            height: comment.position.height * scale,
                            backgroundColor: colorConfig.bg,
                            border: isRegion ? `2px solid ${colorConfig.border}` : 'none',
                            borderBottom: isTextHighlight
                                ? `2px solid ${colorConfig.border}`
                                : undefined,
                            borderRadius: isRegion ? '6px' : '2px',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={() => setHoveredId(comment._id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClickComment?.(comment);
                        }}
                        title={comment.selectedText || comment.text || ''}
                    >
                        {/* Badge */}
                        <div
                            className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-white shadow-md"
                            style={{ backgroundColor: colorConfig.border }}
                        >
                            {isRegion ? (
                                <TypeIcon className="w-2.5 h-2.5" />
                            ) : (
                                <MessageSquare className="w-2.5 h-2.5" />
                            )}
                        </div>

                        {/* Region label */}
                        {isRegion && comment.annotationLabel && (
                            <div
                                className="absolute -top-5 left-0 px-1.5 py-0.5 text-[9px] font-bold text-white rounded whitespace-nowrap shadow-sm"
                                style={{ backgroundColor: colorConfig.label }}
                            >
                                {comment.annotationLabel}
                            </div>
                        )}

                        {/* Tooltip */}
                        {hoveredId === comment._id && (
                            <div
                                className="absolute left-0 top-full mt-2 w-72 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-2xl pointer-events-none"
                                style={{ zIndex: 100 }}
                            >
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <div
                                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getRoleBadgeColor?.(role) || 'bg-slate-600 text-white'}`}
                                    >
                                        {(role || 'USER').toUpperCase()}
                                    </div>
                                    {isRegion && comment.annotationLabel && (
                                        <span
                                            className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                                            style={{ backgroundColor: colorConfig.label }}
                                        >
                                            {comment.annotationLabel}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 ml-auto">
                                        {comment.userName || comment.userId?.name || 'Anonymous'}
                                    </span>
                                </div>

                                <p className="line-clamp-4 leading-relaxed">{comment.text}</p>

                                {isTextHighlight && comment.selectedText && (
                                    <p className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400 italic line-clamp-2">
                                        "{comment.selectedText}"
                                    </p>
                                )}

                                {comment.pageNumber && (
                                    <p className="mt-2 pt-2 border-t border-slate-700 text-[9px] text-slate-500">
                                        Page {comment.pageNumber}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default HighlightLayer;